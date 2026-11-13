import { useCallback } from "react";
import { queryOptions, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  ColumnTarget,
  ImportSettings,
} from "../../components/FormComponents/ContactImport/contactImportModel";

export type TemplateSettings = Omit<ImportSettings, "onMatch">;

/** A saved contact import column mapping, offered again for a file with the same columns. */
export interface ContactImportTemplate {
  id: string;
  name: string;
  savedAt: string;
  /** Normalized column name → the CADE field it was mapped to ("skip" included). */
  columns: Record<string, ColumnTarget>;
  /** Never onMatch: what happens to matching contacts is chosen fresh for every import. */
  settings: TemplateSettings;
}

export type ContactImportTemplateInput = Pick<ContactImportTemplate, "name" | "columns" | "settings">;

const EMPTY: ContactImportTemplate[] = [];

// How alike a file's columns must be to a saved mapping's for it to be offered (shared ÷ all names).
const MIN_COLUMN_OVERLAP = 0.8;

// gcTime is Infinity because the cache is the only copy of what's been saved this session.
// Mocked: no BE support yet — swap the queryFn for executeGraphQL(FETCH_CONTACT_IMPORT_TEMPLATES) and
// saveTemplate's cache write for executeGraphQL(SAVE_CONTACT_IMPORT_TEMPLATE, { template })
export const importTemplatesQuery = queryOptions({
  queryKey: ["contactImportTemplates"],
  queryFn: async (): Promise<ContactImportTemplate[]> => [],
  staleTime: Infinity,
  gcTime: Infinity,
});

/** The saved mapping whose column names best match the file's, or null when none is close. */
export const findTemplateFor = (
  templates: ContactImportTemplate[],
  columnKeys: string[],
): ContactImportTemplate | null => {
  const fileKeys = new Set(columnKeys.filter(Boolean));
  let best: ContactImportTemplate | null = null;
  let bestScore = 0;
  for (const template of templates) {
    const keys = Object.keys(template.columns);
    const shared = keys.filter((key) => fileKeys.has(key)).length;
    const score = shared / new Set([...keys, ...Array.from(fileKeys)]).size;
    if (score >= MIN_COLUMN_OVERLAP && score > bestScore) {
      best = template;
      bestScore = score;
    }
  }
  return best;
};

export const useImportTemplates = () => {
  const queryClient = useQueryClient();
  const { data = EMPTY, isLoading } = useQuery(importTemplatesQuery);

  /** Saving under a name that's already used replaces that mapping. */
  const saveTemplate = useCallback(
    async (input: ContactImportTemplateInput): Promise<ContactImportTemplate> => {
      const all = await queryClient.ensureQueryData(importTemplatesQuery);
      const name = input.name.trim();
      const existing = all.find((t) => t.name.toLowerCase() === name.toLowerCase());
      const template: ContactImportTemplate = {
        ...input,
        settings: {
          defaultClassification: input.settings.defaultClassification,
          defaultAddressType: input.settings.defaultAddressType,
        },
        name,
        id: existing?.id ?? `import-template-${Date.now()}`,
        savedAt: new Date().toISOString(),
      };
      queryClient.setQueryData(
        importTemplatesQuery.queryKey,
        existing ? all.map((t) => (t.id === existing.id ? template : t)) : [...all, template],
      );
      return template;
    },
    [queryClient],
  );

  const findTemplate = useCallback((columnKeys: string[]) => findTemplateFor(data, columnKeys), [data]);

  return { templates: data, loading: isLoading, saveTemplate, findTemplate };
};

export default useImportTemplates;
