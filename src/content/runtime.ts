import { parse as parseYaml } from 'yaml';
import { Case, type CaseT } from './schema';

/**
 * Browser-side: parse a YAML string and validate against the Case schema.
 * Server/Node side uses src/content/loader.ts.
 */
export function loadCaseFromYaml(yamlText: string): CaseT {
  const raw = parseYaml(yamlText);
  return Case.parse(raw);
}
