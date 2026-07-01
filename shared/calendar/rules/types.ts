export interface IRuleFieldDefinition {
  id: string;
  type: "checkbox" | "select" | "number" | "event-multiselect" | "event-constraints";
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
  hidden?: boolean;
}

export function computeDefaultConfig(fields: IRuleFieldDefinition[]): Record<string, unknown> {
  return Object.fromEntries(fields.map((f) => [f.id, f.defaultValue]));
}
