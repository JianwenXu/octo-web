import { describe, it, expect } from 'vitest';
import { summaryTestIds } from '../utils/testIds';

/**
 * Guard: e2e _testids.ts must mirror production testIds.ts.
 *
 * Loads both files as text, extracts string literals and function templates
 * via regex (avoiding any React/Playwright import at Vitest time), and checks
 * that every production key/value is present with an identical string or
 * template body.
 *
 * Dynamic function params differ between files (e.g. versionNum vs v); we only
 * compare the produced template string, not parameter names.
 */

// Use vitest's vi to avoid requiring @types/node; fs/path/url are available in
// Node at runtime (vitest runs in Node). Fall back to require for environments
// without node: protocol support.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const _fs = require('fs');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const _path = require('path');

// When run via vitest from packages/dmworksummary, cwd is that package root.
// When run via turbo from repo root, cwd may be repo root. Resolve robustly.
const _cwd = process.cwd();
const _pkgRoot = _cwd.endsWith('dmworksummary') ? _cwd : _path.join(_cwd, 'packages/dmworksummary');
const _repoRoot = _path.resolve(_pkgRoot, '../..');
const prodPath = _path.join(_pkgRoot, 'src/utils/testIds.ts');
const e2ePath = _path.join(_repoRoot, 'apps/web/e2e-kit/tests/summary/_testids.ts');
const prodSrc = _fs.readFileSync(prodPath, 'utf-8');
const e2eSrc = _fs.readFileSync(e2ePath, 'utf-8');

/** Extract `key: "string-literal"` pairs from object source text. */
function extractStringEntries(src: string): Record<string, string> {
  const entries: Record<string, string> = {};
  const re = /(\w+)\s*:\s*"([^"]*)"/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src)) !== null) {
    entries[m[1]] = m[2];
  }
  return entries;
}

/**
 * Extract `key: (params) => \`template-${expr}\`` pairs, returning the
 * template body text with ${...} placeholders replaced by a single `%s`
 * placeholder so we can compare template *shape* without caring about arg names.
 *
 * Only handles single-line arrow functions returning a template literal —
 * which is the form used throughout both testids files.
 */
function extractFunctionEntries(src: string): Record<string, string> {
  const entries: Record<string, string> = {};
  // Match  key: (params) => `template body with ${...} expressions`
  const re = /(\w+)\s*:\s*\([^)]*\)\s*=>\s*`([^`]*)`/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src)) !== null) {
    // Normalise ${…} to %s so param-name differences (versionNum vs v) don't fail.
    entries[m[1]] = m[2].replace(/\$\{[^}]+\}/g, '%s');
  }
  return entries;
}

const prodStrings = extractStringEntries(prodSrc);
const prodFns = extractFunctionEntries(prodSrc);
const e2eStrings = extractStringEntries(e2eSrc);
const e2eFns = extractFunctionEntries(e2eSrc);

describe('testIds parity guard (prod <-> e2e)', () => {
  it('all production string testids exist in e2e _testids.ts', () => {
    for (const [key, val] of Object.entries(prodStrings)) {
      expect(e2eStrings[key], `missing/incorrect string key "${key}"`).toBe(val);
    }
  });

  it('all production function testids produce matching templates in e2e', () => {
    for (const [key, template] of Object.entries(prodFns)) {
      expect(e2eFns[key], `missing/incorrect function key "${key}"`).toBe(template);
    }
  });

  it('e2e _testids has no extra string keys not in production', () => {
    for (const key of Object.keys(e2eStrings)) {
      expect(prodStrings[key], `e2e-only string key "${key}"`).toBeDefined();
    }
  });

  it('e2e _testids has no extra function keys not in production', () => {
    for (const key of Object.keys(e2eFns)) {
      expect(prodFns[key], `e2e-only function key "${key}"`).toBeDefined();
    }
  });

  it('detail() is present in production (sanity check)', () => {
    expect(typeof summaryTestIds.detail).toBe('function');
    expect(summaryTestIds.detail(123)).toBe('summary-detail-123');
  });

  it('detailMemberRow() is present and produces expected testid', () => {
    expect(typeof summaryTestIds.detailMemberRow).toBe('function');
    expect(summaryTestIds.detailMemberRow('user-1')).toBe('summary-detail-member-row-user-1');
  });
});
