/**
 * Idempotent seeder for the eval test projects. Run once after spinning up a
 * fresh Spica:
 *
 *   SPICA_URL=… SPICA_TOKEN=… node seed/seed-projects.js
 *
 * Creates 3 projects keyed by stable names ("ai-eval-saas", "ai-eval-about",
 * "ai-eval-multilingual"). Re-runs are no-ops if the rows already exist.
 *
 * NOTE: This script writes directly to the PROJECTS bucket via the Spica REST
 * API, NOT through fn-execute, because it needs admin access to create rows
 * for the test user. Fill in SPICA_TOKEN with an admin identity token.
 */
import axios from "axios";

const PROJECT_BUCKET = "63b2c3529b0b86002b37507e";
const PAGE_BUCKET = "63ac7cda9b0b86002b37417c";

const SEEDS = [
  { name: "ai-eval-saas", description: "SaaS landing template for eval", current_language: "en", default_language: "en", languages: ["en"] },
  { name: "ai-eval-about", description: "About-only project for eval", current_language: "en", default_language: "en", languages: ["en"] },
  { name: "ai-eval-multilingual", description: "Multilingual project for eval", current_language: "en", default_language: "en", languages: ["en", "es", "tr"] },
];

async function main() {
  const baseURL = process.env.SPICA_URL;
  const token = process.env.SPICA_TOKEN;
  if (!baseURL || !token) {
    console.error("SPICA_URL and SPICA_TOKEN are required.");
    process.exit(2);
  }
  const api = axios.create({
    baseURL: baseURL.replace(/\/$/, "") + "/bucket",
    headers: { Authorization: token, "Content-Type": "application/json" },
  });

  for (const seed of SEEDS) {
    const existing = await api.get(`/${PROJECT_BUCKET}/data`, { params: { filter: JSON.stringify({ name: seed.name }) } }).then(r => r.data).catch(() => []);
    if (Array.isArray(existing) && existing.length) {
      console.log(`[skip] ${seed.name} (already seeded as ${existing[0]._id})`);
      continue;
    }
    const created = await api.post(`/${PROJECT_BUCKET}/data`, seed).then(r => r.data);
    console.log(`[seed] ${seed.name} → ${created._id}`);
  }
  console.log("Done. Update fixtures/*.json's context.project_id to the IDs above.");
}

main().catch(err => {
  console.error(err?.response?.data || err?.message || err);
  process.exit(1);
});
