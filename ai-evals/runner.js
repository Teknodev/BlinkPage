/**
 * AI assistant regression eval runner.
 *
 * For each fixture in fixtures/*.json:
 *   1. Snapshot the test project's state (admin endpoint).
 *   2. POST /ai/chat with dry_run=true (so mutations don't persist).
 *   3. Capture the trace and (when dry_run=false) compute the diff.
 *   4. Assert the actual tool sequence is a supersequence of expected.
 *   5. Assert iteration & cost stay under the per-fixture caps.
 *
 * Run:
 *   SPICA_URL=https://staging.spica.example/api SPICA_TOKEN=<token> yarn ai-evals
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "./lib/spica-client.js";
import { isSupersequence, diffProjects } from "./lib/diff.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES_DIR = path.join(__dirname, "fixtures");

async function main() {
  const fixtures = fs.readdirSync(FIXTURES_DIR)
    .filter(f => f.endsWith(".json"))
    .map(f => JSON.parse(fs.readFileSync(path.join(FIXTURES_DIR, f), "utf8")))
    .sort((a, b) => (a.id || "").localeCompare(b.id || ""));

  const onlyId = process.env.AI_EVAL_ONLY;
  const filtered = onlyId ? fixtures.filter(f => f.id === onlyId) : fixtures;
  if (!filtered.length) {
    console.error(`No fixtures matched (AI_EVAL_ONLY=${onlyId || "<none>"}).`);
    process.exit(2);
  }

  const client = createClient();
  let pass = 0, fail = 0;
  const results = [];

  for (const fix of filtered) {
    const start = Date.now();
    const verdict = { id: fix.id, ok: true, errors: [], elapsed_ms: 0, iterations: 0, cost_usd: 0 };
    try {
      const dryRun = fix.dry_run !== false;
      const body = {
        messages: [{ role: "user", content: fix.prompt }],
        project_id: fix.context?.project_id,
        page_id: fix.context?.page_id,
        locale: fix.context?.locale || null,
        dry_run: dryRun,
      };
      const before = !dryRun && fix.context?.project_id ? await client.snapshot(fix.context.project_id).catch(() => null) : null;
      const resp = await client.chat(body);
      const after = !dryRun && fix.context?.project_id ? await client.snapshot(fix.context.project_id).catch(() => null) : null;
      verdict.iterations = resp?.iterations ?? 0;
      verdict.cost_usd = resp?.cost_usd ?? 0;

      // Tool sequence supersequence check
      const actualTools = (resp?.trace || []).filter(t => t.type === "tool" && t.name).map(t => t.name);
      if (Array.isArray(fix.expected_tool_sequence) && fix.expected_tool_sequence.length) {
        if (!isSupersequence(actualTools, fix.expected_tool_sequence)) {
          verdict.ok = false;
          verdict.errors.push(`tool_sequence mismatch: actual=${JSON.stringify(actualTools)} expected_supersequence_of=${JSON.stringify(fix.expected_tool_sequence)}`);
        }
      }

      // Forbidden tools — fail if any disallowed tool was invoked.
      if (Array.isArray(fix.forbidden_tools) && fix.forbidden_tools.length) {
        const hits = actualTools.filter(t => fix.forbidden_tools.includes(t));
        if (hits.length) {
          verdict.ok = false;
          verdict.errors.push(`forbidden_tools triggered: ${[...new Set(hits)].join(", ")}`);
        }
      }

      // Caps
      if (typeof fix.max_iterations === "number" && verdict.iterations > fix.max_iterations) {
        verdict.ok = false;
        verdict.errors.push(`iterations ${verdict.iterations} > max_iterations ${fix.max_iterations}`);
      }
      if (typeof fix.max_cost_usd === "number" && verdict.cost_usd > fix.max_cost_usd) {
        verdict.ok = false;
        verdict.errors.push(`cost_usd ${verdict.cost_usd} > max_cost_usd ${fix.max_cost_usd}`);
      }

      // Pending confirmation expected (e.g. delete-section-needs-confirm)
      if (fix.expected_pending_confirmation) {
        const pc = resp?.pending_confirmation;
        if (!pc || pc.name !== fix.expected_pending_confirmation) {
          verdict.ok = false;
          verdict.errors.push(`expected_pending_confirmation=${fix.expected_pending_confirmation} got=${pc?.name || null}`);
        }
      }

      // Diff check (only meaningful with dry_run=false + before/after snapshots)
      if (!dryRun && fix.expected_diff && before && after) {
        const diff = diffProjects(before, after);
        if (Array.isArray(fix.expected_diff.changed_section_indices)) {
          for (const i of fix.expected_diff.changed_section_indices) {
            if (!diff.changed_section_indices.includes(i)) {
              verdict.ok = false;
              verdict.errors.push(`expected changed_section_index ${i} not in actual ${JSON.stringify(diff.changed_section_indices)}`);
            }
          }
        }
        if (Array.isArray(fix.expected_diff.props_paths_modified)) {
          for (const p of fix.expected_diff.props_paths_modified) {
            if (!diff.props_paths_modified.some(x => x.endsWith(p))) {
              verdict.ok = false;
              verdict.errors.push(`expected prop path '${p}' not in actual ${JSON.stringify(diff.props_paths_modified)}`);
            }
          }
        }
      }
    } catch (err) {
      verdict.ok = false;
      verdict.errors.push("exception: " + (err?.message || String(err)));
    }
    verdict.elapsed_ms = Date.now() - start;
    if (verdict.ok) pass++; else fail++;
    results.push(verdict);
    console.log(`${verdict.ok ? "✓" : "✗"} ${verdict.id} (${verdict.elapsed_ms}ms, ${verdict.iterations} iter, $${verdict.cost_usd.toFixed(4)})`);
    for (const e of verdict.errors) console.log(`    ${e}`);
  }

  console.log(`\n${pass}/${pass + fail} fixtures passed.`);
  if (process.env.AI_EVAL_OUT) {
    fs.writeFileSync(process.env.AI_EVAL_OUT, JSON.stringify({ pass, fail, results }, null, 2));
  }
  process.exit(fail ? 1 : 0);
}

main().catch(err => {
  console.error("runner crashed:", err);
  process.exit(2);
});
