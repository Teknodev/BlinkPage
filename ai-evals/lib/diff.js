/**
 * Lightweight diff helper for eval assertions. We don't need a structural
 * diff — just verification that:
 *  - the actual tool sequence is a SUPERSEQUENCE of the expected one
 *    (extra tools are allowed; missing tools are not)
 *  - the changed-section indices and modified prop paths match a fixture's
 *    expected_diff (when supplied).
 */

export function isSupersequence(actual, expected) {
  let i = 0;
  for (const tool of actual) {
    if (i >= expected.length) return true;
    if (tool === expected[i]) i++;
  }
  return i >= expected.length;
}

export function diffProjects(before, after) {
  const out = { changed_section_indices: new Set(), props_paths_modified: new Set(), added_section_indices: [], deleted_section_indices: [] };
  const beforePages = before?.pages || [];
  const afterPages = after?.pages || [];
  const pagesById = new Map(beforePages.map(p => [p._id, p]));
  for (const ap of afterPages) {
    const bp = pagesById.get(ap._id);
    if (!bp) continue;
    const beforeSections = parseLocalization(bp);
    const afterSections = parseLocalization(ap);
    const len = Math.max(beforeSections.length, afterSections.length);
    for (let i = 0; i < len; i++) {
      const b = beforeSections[i];
      const a = afterSections[i];
      if (!b && a) { out.added_section_indices.push(i); continue; }
      if (b && !a) { out.deleted_section_indices.push(i); continue; }
      if (!b || !a) continue;
      const propPaths = diffProps(b.props, a.props);
      if (propPaths.length) {
        out.changed_section_indices.add(i);
        for (const p of propPaths) out.props_paths_modified.add(p);
      }
    }
  }
  return { changed_section_indices: [...out.changed_section_indices], props_paths_modified: [...out.props_paths_modified], added_section_indices: out.added_section_indices, deleted_section_indices: out.deleted_section_indices };
}

function parseLocalization(page) {
  const loc = (page.localization || [])[0];
  if (!loc) return [];
  try { return JSON.parse(loc.json || "[]"); } catch (_) { return []; }
}

function diffProps(beforeProps, afterProps, prefix = "", out = []) {
  if (!Array.isArray(beforeProps) || !Array.isArray(afterProps)) return out;
  const byKey = new Map(beforeProps.map((p, i) => [p && p.key != null ? p.key : String(i), p]));
  for (let i = 0; i < afterProps.length; i++) {
    const p = afterProps[i];
    if (!p) continue;
    const key = p.key != null ? p.key : String(i);
    const path = prefix ? prefix + "." + key : key;
    const b = byKey.get(key);
    if (!b) continue;
    if (Array.isArray(p.value) || Array.isArray(b.value)) {
      diffProps(b.value || [], p.value || [], path, out);
    } else if (JSON.stringify(p.value) !== JSON.stringify(b.value)) {
      out.push(path);
    }
  }
  return out;
}
