import React from "react";
import { useForm, Controller } from "react-hook-form";
import { useAtomValue } from "jotai";
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
import { AlertCircle, FileText, Lock, X } from "lucide-react";
import { FieldConfig, ModuleConfig } from "../../src/config/contactsConfig";
import { ContactsTab, Contact } from "./ContactsTab";
import { NettingTab, NettingEntry } from "./NettingTab";
import { CountyCombobox } from "./CountyCombobox";
import { Combobox } from "./Combobox";
import { DatePicker } from "@/components/ui/date-picker";
import type { StateCountyReference } from "@/hooks/useStateCountyReference";
import { Z_INDEX } from "@/lib/zIndex";
import { themeAtom } from "@/atoms/NavigationAtom";

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
  /** Runtime options loaded from reference data, keyed by field id. */
  dynamicOptions?: Record<string, FieldConfig["options"]>;
  /** State/county reference data for county-combobox fields. */
  stateCountyReference?: StateCountyReference[];
  /** When true, renders without the Card wrapper (for use inside a SideSheet) */
  bare?: boolean;
  /** When true, renders the Save/Cancel pair as a small right-aligned pair instead of the full-
   * width prominent bar — for a Form embedded inline inside another Form's own tab content
   * (e.g. LegalDescriptionForm inside a Lease/Deed/Well's Legal Descriptions tab), where a
   * second full-width bar right above the outer form's own Save/Cancel reads as a stacked
   * duplicate of it. */
  compactActions?: boolean;
  /** Overrides the Save button's text (default: "Save <itemName>" when adding, "Save Changes"
   * when editing). */
  submitLabel?: string;
  /** Field ids to watch — onFieldsChange fires with the current value of just these fields
   * whenever any of them changes, letting a parent mirror a few live fields elsewhere (e.g. this
   * form's own State/County) without re-rendering on every keystroke across the whole form. */
  watchFields?: string[];
  onFieldsChange?: (values: Record<string, any>) => void;
  /** Rendered under the card title (e.g. a created/updated audit line). Not shown when bare. */
  headerContent?: React.ReactNode;
  /** Right-hand panel beside a tab's content, keyed by tab id. Wraps below the content on
   * narrow screens. */
  sidePanels?: Record<string, React.ReactNode>;
  /** Replaces a tab's field grid with custom content, keyed by tab id. */
  tabContent?: Record<string, React.ReactNode>;
  /** Small pill after a tab's label (e.g. a document count), keyed by tab id. Empty values hide it. */
  tabBadges?: Record<string, React.ReactNode>;
  /** Controlled active tab, so a parent can switch tabs (e.g. from a link inside a tab). Omit to
   * let the form manage it. */
  activeTab?: string;
  onActiveTabChange?: (tabId: string) => void;
  /** Extra controls rendered with a field, keyed by field id, given the field's live value and
   * setter. A multi-badge field renders it at the end of its badge row; other types below the input. */
  fieldAddons?: Record<
    string,
    (field: { value: any; onChange: (value: any) => void }) => React.ReactNode
  >;
  /** Replaces a field's input control, keyed by field id. The label, help text, validation rules
   * and error message stay the Form's. */
  fieldRenderers?: Record<string, (field: FieldRenderProps) => React.ReactNode>;
  /** Rendered at the top of a tab, above its content and side panel (e.g. a notice), keyed by tab id. */
  tabIntro?: Record<string, React.ReactNode>;
  /** Problems the parent found outside the form's own fields (e.g. an incomplete address), keyed
   * by tab id. The tab gets the error dot and each message joins the error summary. */
  externalErrors?: Record<string, string[]>;
}

export interface FieldRenderProps {
  value: any;
  onChange: (value: any) => void;
  onBlur: () => void;
  invalid: boolean;
  /** Every field's live value, for a control that depends on another field. */
  values: Record<string, any>;
}

const AUTO_TAG =
  "inline-flex h-[18px] items-center rounded-[5px] px-1.5 text-[10px] font-bold tracking-wider bg-blue-500/20 text-blue-300";

const isEmptyValue = (v: any) => v === undefined || v === null || v === "";

export interface FormHandle {
  /** True once any editable field (custom/readonly fields don't count) currently holds a
   * non-empty value. Deliberately NOT react-hook-form's own formState.isDirty — that tracks
   * "changed from its starting value," which a Select/DatePicker/county-combobox can flip on
   * its own via their internal onChange plumbing without the user actually having filled
   * anything in, giving false positives for "does this draft have anything worth saving." This
   * checks the literal current values instead, so it's unambiguous either way. */
  hasAnyValue: () => boolean;
  /** Triggers the same validate-then-onSave flow the Save button does, without the user
   * clicking it — e.g. so a parent can "save" an embedded Legal Description/Recordation form
   * the user filled in but forgot to explicitly submit before saving the record it belongs to.
   * Resolves to false if validation failed — react-hook-form's handleSubmit never calls onSave
   * in that case, it just resolves, so this form's own inline "Please fill in the required
   * fields" summary is now showing (same as a real button click would leave it) but nothing
   * was persisted. The caller must treat that as a failure, not silently proceed. Resolves to
   * true once onSave has actually run to completion. */
  submit: () => Promise<boolean>;
}

const INPUT_TYPES: Record<string, string> = {
  text: "text",
  email: "email",
  phone: "tel",
  number: "number",
};

const FormImpl: React.ForwardRefRenderFunction<FormHandle, FormProps> = (
  {
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
    dynamicOptions = {},
    stateCountyReference = [],
    bare = false,
    compactActions = false,
    submitLabel,
    watchFields,
    onFieldsChange,
    headerContent,
    sidePanels = {},
    tabContent = {},
    tabBadges = {},
    activeTab: controlledActiveTab,
    onActiveTabChange,
    fieldAddons = {},
    fieldRenderers = {},
    tabIntro = {},
    externalErrors,
  },
  ref,
) => {
  const isLight = useAtomValue(themeAtom) === "light";
  // index.css has no light-theme override for amber, so it's picked here.
  const warnTextClass = isLight ? "text-amber-700" : "text-amber-300";

  const configDefaults = config.fields.reduce<Record<string, any>>((acc, f) => {
    if (f.defaultValue !== undefined) acc[f.id] = f.defaultValue;
    return acc;
  }, {});

  const [internalActiveTab, setInternalActiveTab] = React.useState(
    config.tabs[0].id,
  );
  const activeTab = controlledActiveTab ?? internalActiveTab;
  const setActiveTab = (tabId: string) => {
    if (controlledActiveTab === undefined) setInternalActiveTab(tabId);
    onActiveTabChange?.(tabId);
  };
  const showOuterSave = !config.tabs.find((t) => t.id === activeTab)
    ?.noOuterSave;

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    clearErrors,
    unregister,
    formState: { errors, isSubmitted, isSubmitting },
  } = useForm({
    defaultValues: { ...configDefaults, ...(initialData || {}) },
  });

  const watchedValues = watch();

  // Editable field ids only — "custom" (e.g. nested TractPickerField/MultiRecordationField
  // content) and "readonly" (e.g. Deed #) fields aren't something a user "filled in" here.
  const editableFieldIds = new Set(
    config.fields
      .filter((f) => f.type !== "custom" && f.type !== "readonly")
      .map((f) => f.id),
  );

  React.useImperativeHandle(ref, () => ({
    hasAnyValue: () =>
      Object.entries(watchedValues).some(([id, v]) => {
        if (!editableFieldIds.has(id)) return false;
        if (Array.isArray(v)) return v.length > 0;
        return v !== undefined && v !== null && v !== "";
      }),
    submit: async () => {
      let valid = false;
      await handleSubmit(
        async (data) => {
          valid = true;
          await onSave(data);
        },
        () => {
          valid = false;
        },
      )();
      return valid;
    },
  }));

  // Key off the watched fields' actual values, not a fresh watchFields
  // array reference, so this only fires when one of those specific values really changes.
  const watchFieldsKey = watchFields
    ? watchFields.map((f) => watchedValues[f]).join("\u0000")
    : undefined;
  React.useEffect(() => {
    if (!watchFields || !onFieldsChange) return;
    onFieldsChange(
      watchFields.reduce<Record<string, any>>((acc, f) => {
        acc[f] = watchedValues[f];
        return acc;
      }, {}),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchFieldsKey]);

  const autoFillFields = config.fields.filter((f) => f.autoFill);
  const autoFillSourceKey = autoFillFields
    .map((f) => watchedValues[f.autoFill!.from])
    .join("\u0000");
  // Seeded with the loaded values so opening a record never rewrites them; only a later change
  // to the source field fills anything.
  const autoFillPrevSources = React.useRef<Record<string, any>>(
    Object.fromEntries(
      autoFillFields.map((f) => [f.id, watchedValues[f.autoFill!.from]]),
    ),
  );
  React.useEffect(() => {
    autoFillFields.forEach((f) => {
      const { from, value: derive } = f.autoFill!;
      const source = watchedValues[from];
      const prevSource = autoFillPrevSources.current[f.id];
      if (source === prevSource) return;
      autoFillPrevSources.current[f.id] = source;
      const next = derive(source);
      if (next === undefined) return;
      const current = watchedValues[f.id];
      // Still following the old source value (or never set) means the user hasn't overridden it.
      const userOverrode =
        !isEmptyValue(current) && current !== derive(prevSource);
      if (!userOverrode && current !== next) {
        setValue(f.id, next, {
          shouldDirty: true,
          shouldValidate: isSubmitted,
        });
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoFillSourceKey]);

  const isAutoFilled = (field: FieldConfig) => {
    if (!field.autoFill) return false;
    const value = watchedValues[field.id];
    return (
      !isEmptyValue(value) &&
      value === field.autoFill.value(watchedValues[field.autoFill.from])
    );
  };

  const getFieldOptions = (field: FieldConfig) =>
    dynamicOptions[field.id] ?? field.options ?? [];

  const clearCountyFieldsForState = (stateFieldId: string) => {
    config.fields.forEach((candidate) => {
      if (
        candidate.type === "county-combobox" &&
        (candidate.countyStateField ?? "state") === stateFieldId
      ) {
        setValue(candidate.id, "");
      }
    });
  };

  const getCountiesForField = (field: FieldConfig) => {
    const stateFieldId = field.countyStateField ?? "state";
    const stateCode = watchedValues[stateFieldId];
    if (!stateCode) return [];
    return (
      stateCountyReference.find((state) => state.code === stateCode)
        ?.counties ?? []
    );
  };

  const shouldShowField = (field: FieldConfig): boolean => {
    if (!field.dependsOn) return true;
    const val = watchedValues[field.dependsOn];
    // dependsOnValue may be a single value or an array of values to OR-match against.
    const targets = Array.isArray(field.dependsOnValue)
      ? field.dependsOnValue
      : [field.dependsOnValue];
    return Array.isArray(val)
      ? val.some((v) => targets.includes(v))
      : targets.includes(val);
  };

  // A field hidden by a dependsOn switch (e.g. tractsConfig.ts's per-tractType duplicate field
  // ids — Block is required for Block/Section/Survey but not for Metes and Bounds, as two
  // separate entries sharing one id) can leave a stale "X is required" error behind: useForm's
  // default shouldUnregister:false means an error isn't cleared just because the field that
  // produced it stopped rendering. Sweep those away whenever a dependsOn value changes so
  // switching away from a type doesn't keep showing an error for a field that no longer shows.
  React.useEffect(() => {
    const stale = config.fields
      .filter((f) => !shouldShowField(f) && errors[f.id])
      .map((f) => f.id);
    if (stale.length > 0) clearErrors(stale);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedValues, errors]);

  // A field id that's REQUIRED somewhere but has NO visible instance at all for the current
  // dependsOn value (e.g. tractsConfig.ts's legalDescription, required but only shown for
  // Metes and Bounds/Freeform — there's no "hidden, not-required" sibling the way Block/
  // Section/Survey has) stays registered with its last rules/value forever otherwise: not
  // just a stale error message, but a stale REQUIRED rule that can never be satisfied again
  // once its only Controller unmounts, permanently blocking every future submit.
  // Unregistering it (rather than just clearing its error) drops the rule and value together,
  // so switching away from the type that showed it behaves like it was never filled in.
  // Deliberately narrowed to ids that are required SOMEWHERE (everRequiredIds) rather than
  // every vanished field: unregister also discards the field's value, and most dependsOn
  // fields across the app (e.g. leasesConfig's payment-type-specific amounts) are never
  // required at all — unregistering those too would wipe a value just because the user
  // clicked through other options before settling back on the original one, for no
  // corresponding validation benefit.
  const everRequiredIds = new Set(
    config.fields.filter((f) => f.required).map((f) => f.id),
  );
  const shownIds = new Set(
    config.fields.filter((f) => shouldShowField(f)).map((f) => f.id),
  );
  const vanishedIds = Array.from(
    new Set(
      config.fields
        .filter(
          (f) =>
            !shouldShowField(f) &&
            !shownIds.has(f.id) &&
            everRequiredIds.has(f.id),
        )
        .map((f) => f.id),
    ),
  );
  // Keyed on which ids are hidden, not on every render: unregister() itself re-renders the form,
  // so re-running it while the same fields stay hidden loops forever — which also starves Next's
  // route transitions, so leaving a page with a form open never completes.
  const vanishedKey = vanishedIds.join("\u0000");
  React.useEffect(() => {
    if (vanishedIds.length > 0) unregister(vanishedIds);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vanishedKey]);

  const getFieldRules = (f: FieldConfig) => {
    // Explicit `required: false` (not `{}`) when not required: react-hook-form's own register
    // merges each call's options onto whatever was already registered for that name rather than
    // replacing them (`{...oldRules, ...newRules}` internally) — an empty object here would
    // leave a PRIOR `required` rule in place. That prior rule is real, not hypothetical: a
    // duplicate field id gated by different dependsOnValue (tractsConfig.ts's per-tractType
    // Block/Section/Survey/etc.) renders at the same key, so switching tractType re-registers
    // the SAME Controller with new rules rather than mounting a fresh one — without an explicit
    // false here, a field required under one type would stay silently required forever after
    // switching to a type where it's optional.
    const lengthRule =
      f.maxLength && f.maxLengthMode !== "warn"
        ? {
            maxLength: {
              value: f.maxLength,
              message: `${f.label} must be ${f.maxLength} characters or fewer`,
            },
          }
        : {};
    const validators: Record<
      string,
      (v: any, values: Record<string, any>) => true | string
    > = {};
    if (f.validate)
      validators.custom = (v) => f.validate!(v, initialData?.[f.id]);
    if (f.requiredWhen) {
      validators.requiredWhen = (v, values) =>
        !f.requiredWhen!(values) ||
        !isEmptyValue(v) ||
        `${f.label} is required`;
    }
    const extraRules = Object.keys(validators).length
      ? { ...lengthRule, validate: validators }
      : lengthRule;
    if (!f.required) return { required: false, ...extraRules };
    if (f.type === "multi-badge") {
      return {
        ...extraRules,
        validate: {
          ...validators,
          required: (v: string[]) =>
            (v && v.length > 0) || `${f.label} is required`,
        },
      };
    }
    return { required: `${f.label} is required`, ...extraRules };
  };

  const renderFieldAddon = (field: FieldConfig) =>
    fieldAddons[field.id]?.({
      value: watchedValues[field.id],
      onChange: (value: any) =>
        setValue(field.id, value, {
          shouldDirty: true,
          shouldValidate: isSubmitted,
        }),
    });

  // A required field on a tab the user isn't looking at (e.g. Basic Information's State/County
  // while they're on Recordation) fails silently into the bottom error summary otherwise —
  // nothing on the tab strip itself points back to which tab it's actually on.
  const tabHasError = (tabId: string) =>
    (isSubmitted &&
      config.fields.some((f) => f.tab === tabId && errors[f.id])) ||
    Boolean(externalErrors?.[tabId]?.length);
  const externalMessages = Object.values(externalErrors ?? {}).flat();

  const commonClasses = "bg-white/5 border-purple-300/30 text-white h-9";

  // Callers (renderTabContent) already filter to visibleFields via shouldShowField before
  // calling this, so it can assume field is visible rather than re-checking.
  const renderField = (field: FieldConfig) => {
    // Custom content injected from parent
    if (field.type === "custom") {
      return (
        <div
          key={field.id}
          className={
            field.gridColumn === "span 6"
              ? "col-span-6"
              : field.gridColumn === "span 3"
                ? "col-span-3"
                : field.gridColumn === "span 2"
                  ? "col-span-2"
                  : ""
          }
        >
          {customContent[field.id] ?? null}
        </div>
      );
    }

    const renderControl = fieldRenderers[field.id] as
      | ((field: FieldRenderProps) => React.ReactNode)
      | undefined;
    const controlType = renderControl ? null : field.type;

    return (
      <div
        key={field.id}
        className={
          field.gridColumn === "span 6"
            ? "col-span-6"
            : field.gridColumn === "span 3"
              ? "col-span-3"
              : field.gridColumn === "span 2"
                ? "col-span-2"
                : ""
        }
      >
        {!field.hideLabel && (
          <Label className="text-white font-semibold flex items-center gap-1 mb-1 text-sm">
            {field.label}
            {(field.required || field.requiredWhen?.(watchedValues)) && (
              <span className="text-red-500 text-sm font-bold">*</span>
            )}
            {isAutoFilled(field) && (
              <span
                className={`${AUTO_TAG} ml-1`}
                title={`Filled in from ${config.fields.find((f) => f.id === field.autoFill!.from)?.label ?? field.autoFill!.from}`}
              >
                AUTO
              </span>
            )}
          </Label>
        )}
        {field.helpText && !field.helpBelow && (
          <p className="form-help-text text-xs mb-1">{field.helpText}</p>
        )}

        {renderControl && (
          <Controller
            name={field.id}
            control={control}
            rules={getFieldRules(field)}
            render={({ field: f }) => (
              <>
                {renderControl({
                  value: f.value,
                  onChange: f.onChange,
                  onBlur: f.onBlur,
                  invalid: Boolean(errors[field.id]),
                  values: watchedValues,
                })}
              </>
            )}
          />
        )}

        {controlType === "readonly" && (
          <p className="h-9 flex items-center px-3 rounded-md bg-white/5 border border-purple-300/20 text-white/70 text-sm">
            {field.lockIcon && (
              <Lock
                className="w-3.5 h-3.5 mr-2 shrink-0 text-purple-300"
                aria-hidden="true"
              />
            )}
            {watchedValues[field.id] ??
              field.placeholder ??
              "Assigned after save"}
          </p>
        )}

        {controlType && INPUT_TYPES[controlType] !== undefined && (
          <Controller
            name={field.id}
            control={control}
            rules={getFieldRules(field)}
            render={({ field: f }) => {
              const warnsOnLength = field.maxLengthMode === "warn";
              const input = (
                <Input
                  type={INPUT_TYPES[field.type]}
                  value={f.value ?? ""}
                  onChange={f.onChange}
                  onBlur={f.onBlur}
                  placeholder={field.placeholder}
                  maxLength={
                    warnsOnLength ? field.hardMaxLength : field.maxLength
                  }
                  className={`${commonClasses} ${field.maxLength ? "pr-16" : ""} ${errors[field.id] ? "border-red-500 ring-1 ring-red-500" : ""}`}
                />
              );
              if (!field.maxLength) return input;
              const length = String(f.value ?? "").length;
              const over = length > field.maxLength;
              return (
                <>
                  <div className="relative">
                    {input}
                    <span
                      className={`pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs tabular-nums ${
                        over
                          ? warnsOnLength
                            ? warnTextClass
                            : "text-red-400"
                          : "text-white/50"
                      }`}
                    >
                      {length} / {field.maxLength}
                    </span>
                  </div>
                  {warnsOnLength && over && (
                    <p className={`text-xs mt-1 ${warnTextClass}`}>
                      {field.maxLengthWarning ??
                        `Over ${field.maxLength} characters.`}
                    </p>
                  )}
                </>
              );
            }}
          />
        )}

        {controlType === "date" && (
          <Controller
            name={field.id}
            control={control}
            rules={getFieldRules(field)}
            render={({ field: f }) => (
              <DatePicker
                value={f.value ?? ""}
                onChange={f.onChange}
                onBlur={f.onBlur}
                placeholder={field.placeholder}
                className={commonClasses}
                invalid={Boolean(errors[field.id])}
              />
            )}
          />
        )}

        {controlType === "textarea" && (
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
                className="bg-white/5 border-purple-300/30 text-white min-h-[100px] resize-y"
                style={
                  field.textareaMinHeight
                    ? { minHeight: `${field.textareaMinHeight}px` }
                    : undefined
                }
              />
            )}
          />
        )}

        {(controlType === "select" || controlType === "boolean") && (
          <Controller
            name={field.id}
            control={control}
            rules={getFieldRules(field)}
            render={({ field: f }) => (
              <Select
                value={f.value || undefined}
                onValueChange={(nextValue) => {
                  if (nextValue !== f.value) {
                    f.onChange(nextValue);
                    clearCountyFieldsForState(field.id);
                  }
                }}
              >
                <SelectTrigger
                  style={{ width: "100%" }}
                  className={`${commonClasses} cursor-pointer data-[placeholder]:text-white/70 ${errors[field.id] ? "border-red-500 ring-1 ring-red-500" : ""}`}
                >
                  <SelectValue
                    placeholder={
                      field.placeholder || `Select ${field.label.toLowerCase()}`
                    }
                  />
                </SelectTrigger>
                <SelectContent
                  // Select portals to <body> as its own top-level sibling, so a plain z-50
                  // here would render invisibly behind any full-viewport modal (Z_INDEX.modal)
                  // instead of on top of it — Z_INDEX.modalDropdown is defined to always clear it.
                  style={{ zIndex: Z_INDEX.modalDropdown }}
                  className="bg-[#1a1a2e] border-purple-300/30 max-h-[300px] overflow-y-auto"
                  position="popper"
                  sideOffset={4}
                >
                  {getFieldOptions(field).map((option) => {
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

        {controlType === "county-combobox" && (
          <Controller
            name={field.id}
            control={control}
            rules={getFieldRules(field)}
            render={({ field: f }) => {
              const counties = getCountiesForField(field);
              const stateFieldId = field.countyStateField ?? "state";
              const hasState = Boolean(watchedValues[stateFieldId]);
              return (
                <CountyCombobox
                  value={f.value ?? ""}
                  onChange={f.onChange}
                  onBlur={f.onBlur}
                  counties={counties}
                  showCode={field.showCountyCode}
                  disabled={!hasState}
                  placeholder={
                    hasState
                      ? field.placeholder ||
                        `Select ${field.label.toLowerCase()}`
                      : "Select state first"
                  }
                  className={`${commonClasses} ${errors[field.id] ? "border-red-500" : ""}`}
                  invalid={Boolean(errors[field.id])}
                />
              );
            }}
          />
        )}

        {controlType === "combobox" && (
          <Controller
            name={field.id}
            control={control}
            rules={getFieldRules(field)}
            render={({ field: f }) => (
              <Combobox
                value={f.value ?? ""}
                onChange={f.onChange}
                onBlur={f.onBlur}
                // Same {value,label}[] | string[] normalization the select branch above uses —
                // dynamicOptions can hand either shape, so this can't assume plain strings.
                options={getFieldOptions(field).map((option) =>
                  typeof option === "string" ? option : option.value,
                )}
                placeholder={
                  field.placeholder || `Select ${field.label.toLowerCase()}`
                }
                className={`${commonClasses} cursor-pointer ${errors[field.id] ? "border-red-500" : ""}`}
                invalid={Boolean(errors[field.id])}
              />
            )}
          />
        )}

        {controlType === "multi-badge" && (
          <Controller
            name={field.id}
            control={control}
            rules={getFieldRules(field)}
            defaultValue={field.defaultValue || []}
            render={({ field: f }) => (
              <div className="flex flex-wrap gap-2">
                {getFieldOptions(field).map((option) => {
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
                {renderFieldAddon(field)}
              </div>
            )}
          />
        )}

        {controlType !== "multi-badge" && fieldAddons[field.id] && (
          <div className="mt-1">{renderFieldAddon(field)}</div>
        )}

        {field.helpText && field.helpBelow && (
          <p className="form-help-text text-xs mt-1">{field.helpText}</p>
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
      <div className="space-y-3">
        {Object.entries(sections).map(([sectionId, fields]) => {
          // A section whose fields are all conditionally hidden (dependsOn didn't match)
          // would otherwise render as a bare header over an empty body.
          const visibleFields = fields.filter(shouldShowField);
          if (visibleFields.length === 0) return null;

          // Opt-in: a section where every field declares layoutColumn renders as two
          // independent columns (e.g. a tall custom field beside several short ones)
          // instead of the normal auto-flow grid, which can't align a tall cell next
          // to a stack of short ones in the same row.
          const hasLayoutColumns = visibleFields.some((f) => f.layoutColumn);

          return (
            <div
              key={sectionId}
              className={
                sectionId !== "default"
                  ? "border-t border-purple-300/30 pt-2"
                  : ""
              }
            >
              {sectionId !== "default" &&
                !visibleFields.some((f) => f.hideSectionHeader) && (
                  <h3 className="text-sm font-semibold text-white/90 uppercase tracking-wider mb-1.5">
                    {sectionId.replace(/-/g, " ")}
                  </h3>
                )}
              {hasLayoutColumns ? (
                <div className="grid grid-cols-2 gap-x-4">
                  <div className="space-y-2">
                    {visibleFields
                      .filter((f) => f.layoutColumn === "left")
                      .map((field) => renderField(field))}
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 content-start">
                    {visibleFields
                      .filter((f) => f.layoutColumn === "right")
                      .map((field) => renderField(field))}
                  </div>
                </div>
              ) : (
                <div
                  className={`grid gap-x-4 gap-y-2 ${
                    visibleFields.some((f) => f.sectionColumns === 6)
                      ? "grid-cols-6"
                      : visibleFields.some((f) => f.sectionColumns === 3) ||
                          visibleFields.every((f) => f.type === "boolean")
                        ? "grid-cols-3"
                        : "grid-cols-2"
                  }`}
                >
                  {visibleFields.map((field) => renderField(field))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const withSidePanel = (tabId: string, content: React.ReactNode) => {
    const panel = sidePanels[tabId];
    if (panel === undefined || panel === null) return content;
    return (
      <div className="flex flex-wrap items-start gap-5">
        <div className="min-w-0 grow-[999] basis-[560px]">{content}</div>
        <aside className="max-w-full grow basis-80 space-y-3">{panel}</aside>
      </div>
    );
  };

  const saveButtonLabel = isSubmitting
    ? "Saving..."
    : (submitLabel ??
      (mode === "add"
        ? `Save ${(config as any).itemName || config.title}`
        : "Save Changes"));

  const formBody = (
    <>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        {config.tabs.length > 1 && (
          <TabsList className="flex w-full bg-white/5 border border-purple-300/20 rounded-xl gap-1 h-auto p-1">
            {config.tabs.map((tab) => {
              const classifications = watchedValues.classifications ?? [];
              if (tab.id === "vendor" && !classifications.includes("VENDOR"))
                return null;
              if (
                tab.id === "netting" &&
                watchedValues.ownerNettingApplies !== "Yes"
              )
                return null;
              const hasError = tabHasError(tab.id);
              return (
                <TabsTrigger
                  key={tab.id}
                  value={tab.id}
                  className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium hover:text-white hover:bg-purple-500/30 cursor-pointer transition-all data-[state=active]:bg-purple-600 data-[state=active]:text-white data-[state=active]:shadow-none ${
                    hasError ? "text-red-400" : "text-purple-100"
                  }`}
                >
                  <span className="inline-flex items-center gap-1.5">
                    {tab.label}
                    {tabBadges[tab.id] !== undefined &&
                      tabBadges[tab.id] !== null &&
                      tabBadges[tab.id] !== "" && (
                        <span className="rounded-md bg-white/10 px-1.5 text-[11px] leading-[18px] tabular-nums">
                          {tabBadges[tab.id]}
                        </span>
                      )}
                    {hasError && (
                      <span
                        className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0"
                        aria-hidden="true"
                      />
                    )}
                  </span>
                </TabsTrigger>
              );
            })}
          </TabsList>
        )}

        {config.tabs.map((tab) => (
          // forceMount + hidden (rather than Radix's default unmount-when-inactive) keeps every
          // tab's fields registered with react-hook-form at all times. Otherwise a required field
          // on a tab the user never clicks into (e.g. "Lease Type" on Terms & Payments) never
          // registers, its validation never runs, and it silently submits as undefined.
          <TabsContent
            key={tab.id}
            value={tab.id}
            forceMount
            hidden={activeTab !== tab.id}
            className="mt-2"
          >
            {tabIntro[tab.id] !== undefined && tabIntro[tab.id] !== null && (
              <div className="mb-3">{tabIntro[tab.id]}</div>
            )}
            {withSidePanel(
              tab.id,
              tabContent[tab.id] !== undefined
                ? tabContent[tab.id]
                : tab.id === "contacts"
                  ? activeTab === "contacts" && (
                      <ContactsTab
                        partyId={partyId}
                        contacts={contacts}
                        onAdd={onAddContact!}
                        onUpdate={onUpdateContact!}
                        onDelete={onDeleteContact!}
                      />
                    )
                  : tab.id === "netting"
                    ? activeTab === "netting" && (
                        <NettingTab
                          partyId={partyId}
                          entries={nettingEntries}
                          allParties={allParties}
                          onChange={onNettingChange ?? (() => {})}
                        />
                      )
                    : renderTabContent(tab.id),
            )}
          </TabsContent>
        ))}
      </Tabs>

      {saveError && (
        <div className="mt-3 p-3 bg-red-500/10 border border-red-500/40 rounded-lg flex items-center justify-between">
          <p className="text-sm text-red-300">{saveError}</p>
          <button
            onClick={onClearSaveError}
            className="text-red-400 hover:text-red-200 ml-4"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {((isSubmitted && Object.keys(errors).length > 0) ||
        externalMessages.length > 0) && (
        <div className="mt-3 p-3 bg-red-500/10 border border-red-500/40 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm text-red-300 font-medium">
              Please fill in the required fields:
            </p>
            <ul className="mt-1 space-y-0.5">
              {externalMessages.map((message) => (
                <li key={message} className="text-xs text-red-400">
                  {message}
                </li>
              ))}
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

      {showOuterSave && compactActions && (
        <div className="flex justify-end gap-2 mt-3">
          <Button
            variant="outline"
            size="sm"
            className="border-purple-300/30 text-purple-600 hover:bg-purple-500/20 cursor-pointer"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            disabled={isSubmitting}
            className="bg-purple-600 hover:bg-purple-700 cursor-pointer"
            onClick={handleSubmit(onSave)}
          >
            {saveButtonLabel}
          </Button>
        </div>
      )}

      {showOuterSave && !compactActions && (
        <div className="flex gap-3 mt-3 pt-3 border-t border-purple-300/30">
          <Button
            disabled={isSubmitting}
            className="flex-1 bg-purple-600 hover:bg-purple-700 cursor-pointer"
            onClick={handleSubmit(onSave)}
          >
            {saveButtonLabel}
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

  const cardTitle = (
    <CardTitle className="text-white flex items-center gap-2">
      <FileText className="w-6 h-6" />
      {mode === "add"
        ? `Add New ${(config as any).itemName || config.title}`
        : `Edit ${(config as any).itemName || config.title}`}
    </CardTitle>
  );

  return (
    <Card className="bg-white/10 backdrop-blur-md border-purple-300/30 gap-3 py-4">
      <CardHeader>
        <div
          className={`flex justify-between ${headerContent ? "items-start gap-3" : "items-center"}`}
        >
          {headerContent ? (
            <div className="min-w-0">
              {cardTitle}
              {headerContent}
            </div>
          ) : (
            cardTitle
          )}
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

export const Form = React.forwardRef(FormImpl);

export default Form;
