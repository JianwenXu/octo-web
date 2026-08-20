import { existsSync } from "node:fs";
import { isAbsolute, resolve } from "node:path";

const CANDIDATES = ["e2e", "e2e-kit", "apps/web/e2e-kit"];

/** Resolve the project's e2e root without requiring downstream script edits. */
export function resolveE2ERoot(repoRoot = process.cwd()) {
  const configured = process.env.E2E_TARGET_DIR;
  const candidates = configured ? [configured, ...CANDIDATES] : CANDIDATES;
  for (const candidate of candidates) {
    const root = isAbsolute(candidate) ? candidate : resolve(repoRoot, candidate);
    const markers = ["manifest.yaml", "fixtures-authed.ts", "case-specs/TEMPLATE.md"];
    if (markers.some((marker) => existsSync(resolve(root, marker)))) {
      return root;
    }
  }
  return resolve(repoRoot, configured || "e2e");
}
