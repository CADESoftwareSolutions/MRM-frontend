import React from "react";
import { useForm, Controller } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, FileText, X } from "lucide-react";
import { FieldConfig, ModuleConfig } from "../../src/config/directoryConfig";
import { ContactsTab, Contact } from "./ContactsTab";
import { NettingTab, NettingEntry } from "./NettingTab";

interface FormProps {
  config: ModuleConfig;
  initialData?: any;
  onSave: (data: any) => void;
  onCancel: () => void;
  mode?: "add" | "edit";
  saveError?: string | null;
  onClearSaveError?: () => void;
  partyId?: number;
  contacts?: Contact[];
  onAddContact?: (contact: Omit<Contact, "id">) => Promise<void>;
  onUpdateContact?: (id: number, contact: Omit<Contact, "id">) => Promise<void>;
  onDeleteContact?: (id: number) => Promise<void>;
  nettingEntries?: NettingEntry[];
  onNettingChange?: (entries: NettingEntry[]) => void;
  allParties?: Array<{ id: string; name: string }>;
  /** Custom React nodes injected by field id — rendered in place of fields with type "custom" */
  customContent?: Record<string, React.ReactNode>;
  /** When true, renders without the Card wrapper (for use inside a SideSheet) */
  bare?: boolean;
}

const INPUT_TYPES: Record<string, string> = {
  text: "text",
  email: "email",
  phone: "tel",
  number: "number",
  date: "date",
};

export const Form: React.FC<FormProps> = ({
  config,
  initialData,
  onSave,
  onCancel,
  mode = "add",
  saveError,
  onClearSaveError,
  partyId,
  contacts = [],
  onAddContact,
  onUpdateContact,
  onDeleteContact,
  nettingEntries = [],
  onNettingChange,
  allParties = [],
  customContent = {},
  bare = false,
}) => {
  const configDefaults = config.fields.reduce<Record<string, any>>((acc, f) => {
    if (f.defaultValue !== undefined) acc[f.id] = f.defaultValue;
    return acc;
  }, {});

  const [activeTab, setActiveTab] = React.useState(config.tabs[0].id);
  const showOuterSave = !config.tabs.find((t) => t.id === activeTab)
    ?.noOuterSave;

  const {
    control,
    handleSubmit,
    watch,
    formState: { errors, isSubmitted },
  } = useForm({
    defaultValues: { ...configDefaults, ...(initialData || {}) },
  });

  const watchedValues = watch();

  const shouldShowField = (field: FieldConfig): boolean => {
    if (!field.dependsOn) return true;
    const val = watchedValues[field.dependsOn];
    return Array.isArray(val)
      ? val.includes(field.dependsOnValue)
      : val === field.dependsOnValue;
  };

  const getFieldRules = (f: FieldConfig) => {
    if (!f.required) return {};
    if (f.type === "multi-badge") {
      return {
        validate: (v: string[]) =>
          (v && v.length > 0) || `${f.label} is required`,
      };
    }
    return { required: `${f.label} is required` };
  };

  const commonClasses = "bg-white/5 border-purple-300/30 text-white h-9";

  const renderField = (field: FieldConfig) => {
    if (!shouldShowField(field)) return null;

    // Custom content injected from parent
    if (field.type === "custom") {
      return (
        <div
          key={field.id}
          className={field.gridColumn === "span 2" ? "col-span-2" : ""}
        >
          {customContent[field.id] ?? null}
        </div>
      );
    }

    return (
      <div
        key={field.id}
        className={field.gridColumn === "span 2" ? "col-span-2" : ""}
      >
        <Label className="text-white font-semibold flex items-center gap-1 mb-1.5 text-sm">
          {field.label}
          {field.required && (
            <span className="text-red-500 text-sm font-bold">*</span>
          )}
        </Label>
        {field.helpText && (
          <p className="form-help-text text-xs mb-2">{field.helpText}</p>
        )}

        {INPUT_TYPES[field.type] !== undefined && (
          <Controller
            name={field.id}
            control={control}
            rules={getFieldRules(field)}
            render={({ field: f }) => (
              <Input
                type={INPUT_TYPES[field.type]}
                value={f.value ?? ""}
                onChange={f.onChange}
                onBlur={f.onBlur}
                placeholder={field.placeholder}
                className={`${commonClasses} ${errors[field.id] ? "border-red-500" : ""}`}
              />
            )}
          />
        )}

        {field.type === "textarea" && (
          <Controller
            name={field.id}
            control={control}
            rules={getFieldRules(field)}
            render={({ field: f }) => (
              <Textarea
                value={f.value ?? ""}
                onChange={f.onChange}
                rows={field.rows || 4}
                placeholder={field.placeholder}
                className="bg-white/5 border-purple-300/30 text-white min-h-[100px]"
              />
            )}
          />
        )}

        {(field.type === "select" || field.type === "boolean") && (
          <Controller
            name={field.id}
            control={control}
            rules={getFieldRules(field)}
            render={({ field: f }) => (
              <Select value={f.value || undefined} onValueChange={f.onChange}>
                <SelectTrigger
                  style={{ width: "100%" }}
                  className={`${commonClasses} cursor-pointer data-[placeholder]:text-white/70 ${errors[field.id] ? "border-red-500" : ""}`}
                >
                  <SelectValue
                    placeholder={
                      field.placeholder || `Select ${field.label.toLowerCase()}`
                    }
                  />
                </SelectTrigger>
                <SelectContent
                  className="bg-[#1a1a2e] border-purple-300/30 max-h-[300px] overflow-y-auto z-50"
                  position="popper"
                  sideOffset={4}
                >
                  {field.options?.map((option) => {
                    const val =
                      typeof option === "string" ? option : option.value;
                    const label =
                      typeof option === "string" ? option : option.label;
                    return (
                      <SelectItem
                        key={val}
                        value={val}
                        className="hover:bg-purple-400/30 focus:bg-purple-400/40 data-[highlighted]:bg-purple-400/30 cursor-pointer text-white"
                      >
                        {label}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            )}
          />
        )}

        {field.type === "multi-badge" && (
          <Controller
            name={field.id}
            control={control}
            rules={getFieldRules(field)}
            defaultValue={field.defaultValue || []}
            render={({ field: f }) => (
              <div className="flex flex-wrap gap-2">
                {field.options?.map((option) => {
                  const val =
                    typeof option === "string" ? option : option.value;
                  const label =
                    typeof option === "string" ? option : option.label;
                  const isSelected = (f.value || []).includes(val);
                  return (
                    <Badge
                      key={val}
                      onClick={() => {
                        if (field.singleSelect) {
                          if (!isSelected) f.onChange([val]);
                        } else {
                          const next = isSelected
                            ? f.value.filter((v: any) => v !== val)
                            : [...(f.value || []), val];
                          f.onChange(next);
                        }
                      }}
                      className={`cursor-pointer transition-all ${
                        isSelected
                          ? "bg-purple-600 text-white hover:bg-purple-700"
                          : "bg-white/10 text-purple-200 hover:bg-white/20"
                      }`}
                    >
                      {label}
                    </Badge>
                  );
                })}
              </div>
            )}
          />
        )}

        {errors[field.id] && (
          <p className="text-red-400 text-xs mt-1">
            {errors[field.id]?.message as string}
          </p>
        )}
      </div>
    );
  };

  const groupFieldsBySection = (fields: FieldConfig[]) => {
    const sections: Record<string, FieldConfig[]> = {};
    fields.forEach((field) => {
      const section = field.section || "default";
      if (!sections[section]) sections[section] = [];
      sections[section].push(field);
    });
    return sections;
  };

  const renderTabContent = (tabId: string) => {
    const tabFields = config.fields.filter((field) => field.tab === tabId);
    const sections = groupFieldsBySection(tabFields);
    return (
      <div className="space-y-5">
        {Object.entries(sections).map(([sectionId, fields]) => (
          <div
            key={sectionId}
            className={
              sectionId !== "default"
                ? "border-t border-purple-300/30 pt-4"
                : ""
            }
          >
            {sectionId !== "default" && (
              <h3 className="text-sm font-semibold text-white/90 uppercase tracking-wider mb-3">
                {sectionId.replace(/-/g, " ")}
              </h3>
            )}
            <div className={`grid gap-x-4 gap-y-3 ${fields.every((f) => f.type === "boolean") ? "grid-cols-3" : "grid-cols-2"}`}>
              {fields.map((field) => renderField(field))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const formBody = (
    <>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="flex w-full bg-white/5 border border-purple-300/20 rounded-xl gap-1 h-auto p-1">
          {config.tabs.map((tab) => {
            const classifications = watchedValues.classifications ?? [];
            if (tab.id === "vendor" && !classifications.includes("VENDOR")) return null;
            if (tab.id === "netting" && watchedValues.ownerNettingApplies !== "Yes") return null;
            return (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="flex-1 rounded-lg px-4 py-2 text-sm font-medium text-purple-200/70 hover:text-purple-100 hover:bg-purple-500/30 cursor-pointer transition-all data-[state=active]:bg-purple-600 data-[state=active]:text-white data-[state=active]:shadow-none"
              >
                {tab.label}
              </TabsTrigger>
            );
          })}
        </TabsList>

        {config.tabs.map((tab) => (
          <TabsContent key={tab.id} value={tab.id} className="mt-4">
            {tab.id === "vendor" && (
              <div className="flex items-center gap-2 mb-6 p-3 bg-blue-500/10 border border-blue-300/30 rounded-lg">
                <AlertCircle className="w-5 h-5 text-blue-300" />
                <p className="text-sm text-blue-200">
                  A/P Vendor information only appears for contacts with VENDOR
                  classification
                </p>
              </div>
            )}
            {tab.id === "contacts" ? (
              <ContactsTab
                partyId={partyId}
                contacts={contacts}
                onAdd={onAddContact!}
                onUpdate={onUpdateContact!}
                onDelete={onDeleteContact!}
              />
            ) : tab.id === "netting" ? (
              <NettingTab
                partyId={partyId}
                entries={nettingEntries}
                allParties={allParties}
                onChange={onNettingChange ?? (() => {})}
              />
            ) : (
              renderTabContent(tab.id)
            )}
          </TabsContent>
        ))}
      </Tabs>

      {saveError && (
        <div className="mt-6 p-3 bg-red-500/10 border border-red-500/40 rounded-lg flex items-center justify-between">
          <p className="text-sm text-red-300">{saveError}</p>
          <button
            onClick={onClearSaveError}
            className="text-red-400 hover:text-red-200 ml-4"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {isSubmitted && Object.keys(errors).length > 0 && (
        <div className="mt-6 p-3 bg-red-500/10 border border-red-500/40 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm text-red-300 font-medium">
              Please fill in the required fields:
            </p>
            <ul className="mt-1 space-y-0.5">
              {Object.entries(errors).map(([, err]) => (
                <li
                  key={err?.message as string}
                  className="text-xs text-red-400"
                >
                  {err?.message as string}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {showOuterSave && (
        <div className="flex gap-3 mt-5 pt-4 border-t border-purple-300/30">
          <Button
            className="flex-1 bg-purple-600 hover:bg-purple-700 cursor-pointer"
            onClick={handleSubmit(onSave)}
          >
            {mode === "add"
              ? `Save ${(config as any).itemName || config.title}`
              : "Save Changes"}
          </Button>
          <Button
            variant="outline"
            className="flex-1 border-purple-300/30 text-purple-600 hover:bg-purple-500/20 cursor-pointer"
            onClick={onCancel}
          >
            Cancel
          </Button>
        </div>
      )}
    </>
  );

  if (bare) {
    return formBody;
  }

  return (
    <Card className="bg-white/10 backdrop-blur-md border-purple-300/30">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <FileText className="w-6 h-6" />
            {mode === "add"
              ? `Add New ${config.title}`
              : `Edit ${config.title}`}
          </CardTitle>
          <Button
            variant="ghost"
            onClick={onCancel}
            className="text-purple-300 hover:text-purple-100 hover:bg-purple-500/20 cursor-pointer"
          >
            Back to List
          </Button>
        </div>
      </CardHeader>
      <CardContent>{formBody}</CardContent>
    </Card>
  );
};

export default Form;
