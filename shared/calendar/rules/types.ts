export interface IRuleFieldDefinition {
  id: string;
  type: "checkbox" | "select" | "number";
  defaultValue: unknown;
}

export interface IRuleTranslations {
  label: string;
  fields: Record<string, string>;
  fieldLabels: Record<string, string>;
  messages: Record<string, string>;
}

export interface IRuleDefinitionMeta {
  id: string;
  fields: IRuleFieldDefinition[];
  translations: Record<string, IRuleTranslations>;
}

export function computeDefaultConfig(fields: IRuleFieldDefinition[]): Record<string, unknown> {
  return Object.fromEntries(fields.map((f) => [f.id, f.defaultValue]));
}
