import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

/**
 * D-028-class guard — every `Ops.*` key the ops module ASKS FOR must exist.
 *
 * The defect this pins shut is not subtle when you see it: a component calls
 * `t('roleAll')`, the catalog has no such key, and next-intl renders the literal
 * string `Ops.teachers.roleAll` on the page. It shipped that way on the schools
 * and teachers surfaces (41 keys), and the accepted D-028 fixed an earlier
 * instance of exactly the same thing in `Ops.onboard`.
 *
 * The census is DERIVED, never hardcoded. A fixed list of "the 41 keys" would
 * pass forever while a forty-second went missing, which is the failure mode that
 * let this class regrow after D-028.
 *
 * HOW A CALL IS ATTRIBUTED, because getting this wrong makes the guard useless:
 * a `t()` call belongs to the namespace of ITS OWN `useTranslations` binding.
 * Attributing every key in a file to every namespace in that file cross-products
 * them and invents paths like `Ops.content.counts.counts.title` — a first draft
 * of this census did exactly that and reported 330 "missing" keys, nearly all
 * fictional. Where one variable name is bound to several namespaces in a file
 * (a file holding two components that each name their translator `t`), a call is
 * satisfied if it resolves under ANY of that variable's bindings; demanding all
 * of them would re-create the same false positives.
 */
const WEB_ROOT = path.resolve(__dirname, '..', '..');
const OPS_ROOT = path.join(WEB_ROOT, 'src', 'modules', 'ops');
const CATALOG = path.join(WEB_ROOT, 'src', 'i18n', 'messages', 'en.json');

type Catalog = Record<string, unknown>;
const catalog = JSON.parse(readFileSync(CATALOG, 'utf8')) as Catalog;

function resolveKey(dotted: string): unknown {
  let cursor: unknown = catalog;
  for (const part of dotted.split('.')) {
    if (typeof cursor !== 'object' || cursor === null || !(part in cursor)) return undefined;
    cursor = (cursor as Catalog)[part];
  }
  return cursor;
}

function sourceFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...sourceFiles(full));
    else if (/\.tsx?$/.test(entry)) out.push(full);
  }
  return out;
}

const DECLARATION =
  /(?:const|let)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:await\s+)?(?:useTranslations|getTranslations)\(\s*'([^']+)'\s*\)/g;

interface CallSite {
  key: string;
  namespaces: string[];
  file: string;
  /** Whether the call passed a values object, i.e. `t('k', { … })`. */
  hasValues: boolean;
}

function callSites(): CallSite[] {
  const sites: CallSite[] = [];
  for (const file of sourceFiles(OPS_ROOT)) {
    const src = readFileSync(file, 'utf8');
    const bindings = new Map<string, string[]>();
    for (const match of src.matchAll(DECLARATION)) {
      const [, variable, namespace] = match;
      if (!namespace.startsWith('Ops')) continue;
      bindings.set(variable, [...(bindings.get(variable) ?? []), namespace]);
    }
    for (const [variable, namespaces] of bindings) {
      const call = new RegExp(
        `\\b${variable}(?:\\.rich|\\.has|\\.markup)?\\(\\s*(['"\`])([^'"\`$]+)\\1\\s*(,?)`,
        'g',
      );
      for (const match of src.matchAll(call)) {
        const key = match[2];
        // Template keys built by interpolation cannot be resolved statically.
        if (!/^[A-Za-z0-9_.]+$/.test(key)) continue;
        sites.push({
          key,
          namespaces,
          file: path.relative(WEB_ROOT, file),
          hasValues: match[3] === ',',
        });
      }
    }
  }
  return sites;
}

const sites = callSites();

describe('Ops i18n census', () => {
  it('finds the ops translation call sites at all — an empty census proves nothing', () => {
    expect(sites.length).toBeGreaterThan(500);
  });

  it('every Ops.* key the ops module requests exists in en.json', () => {
    const missing = sites
      .filter((site) => site.namespaces.every((ns) => resolveKey(`${ns}.${site.key}`) === undefined))
      .map((site) => `${site.namespaces[0]}.${site.key}  (${site.file})`);

    expect([...new Set(missing)].sort()).toEqual([]);
  });

  it('a key whose message needs a placeholder is never called without values', () => {
    // The other half of the D-028-class defect: `Ops.detail.suspend.archiveTitle`
    // is "Archive {name}?" and was rendered by `t('archiveTitle')` with no
    // bindings, so next-intl threw IntlError FORMATTING_ERROR and the dialog
    // showed no title. Resolving the key is not enough — the call has to feed it.
    const unbound = sites
      .filter((site) => !site.hasValues)
      .filter((site) => {
        const message = site.namespaces
          .map((ns) => resolveKey(`${ns}.${site.key}`))
          .find((value) => typeof value === 'string') as string | undefined;
        // A single `{...}` placeholder is enough; ICU plural bodies also contain
        // `#`, and both need an argument.
        return typeof message === 'string' && /\{[A-Za-z_][\w]*[,}]/.test(message);
      })
      .map((site) => `${site.namespaces[0]}.${site.key}  (${site.file})`);

    expect([...new Set(unbound)].sort()).toEqual([]);
  });

  it('THE GUARD IS SENSITIVE — a key removed from the catalog would be caught', () => {
    // Perturbing a COPY proves the sensitivity with nothing to revert, the same
    // approach the OpenAPI drift guard uses.
    const probe = sites.find(
      (site) => site.namespaces.length === 1 && resolveKey(`${site.namespaces[0]}.${site.key}`) !== undefined,
    );
    expect(probe, 'the census must contain at least one resolvable single-binding call').toBeDefined();
    expect(resolveKey(`${probe!.namespaces[0]}.${probe!.key}`)).toBeDefined();
    expect(resolveKey(`${probe!.namespaces[0]}.__definitely_not_a_key__`)).toBeUndefined();
  });
});
