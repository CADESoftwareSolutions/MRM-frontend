import React, { useState } from "react";
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
import { AlertCircle, FileText } from "lucide-react";
import {
  FieldConfig,
  ModuleConfig,
} from "../../pages/Dashboard/DashboardDirectory/Directory/directoryConfig";

interface FormProps {
  config: ModuleConfig;
  initialData?: any;
  onSave: (data: any) => void;
  onCancel: () => void;
  mode?: "add" | "edit";
}

export const Form: React.FC<FormProps> = ({
  config,
  initialData = {},
  onSave,
  onCancel,
  mode = "add",
}) => {
  const [formData, setFormData] = useState(initialData);

  const handleChange = (fieldId: string, value: any) => {
    setFormData((prev) => ({ ...prev, [fieldId]: value }));
  };

  const toggleArrayValue = (array: any[], value: any) => {
    if (array.includes(value)) {
      return array.filter((v) => v !== value);
    }
    return [...array, value];
  };

  const handleMultiSelect = (fieldId: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [fieldId]: toggleArrayValue(prev[fieldId] || [], value),
    }));
  };

  const shouldShowField = (field: FieldConfig): boolean => {
    console.log(field);
    if (!field.dependsOn) return true;
    const dependentValue = formData?.[field.dependsOn];
    if (Array.isArray(dependentValue)) {
      console.log(dependentValue, field.dependsOnValue);
      return dependentValue.includes(field.dependsOnValue);
    }

    return dependentValue === field.dependsOnValue;
  };

  const renderField = (field: FieldConfig) => {
    if (!shouldShowField(field)) return null;

    const value = formData?.[field.id];
    const commonClasses = "bg-white/5 border-purple-300/30 text-white h-10  ";
    return (
      <div
        key={field.id}
        className={`${field.gridColumn === "span 2" ? "col-span-2" : ""}`}
      >
        <Label className="text-purple-100 font-semibold flex items-center gap-1 mb-2.5 text-sm">
          {field.label}
          {field.required && (
            <span className="text-red-500 text-base font-bold">*</span>
          )}
        </Label>
        {field.helpText && (
          <p className="text-xs text-purple-300/70 mb-2">{field.helpText}</p>
        )}

        {field.type === "text" && (
          <Input
            value={value || ""}
            onChange={(e) => handleChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            className={commonClasses}
          />
        )}

        {field.type === "email" && (
          <Input
            type="email"
            value={value || ""}
            onChange={(e) => handleChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            className={commonClasses}
          />
        )}

        {field.type === "phone" && (
          <Input
            type="tel"
            value={value || ""}
            onChange={(e) => handleChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            className={commonClasses}
          />
        )}

        {field.type === "number" && (
          <Input
            type="number"
            value={value || ""}
            onChange={(e) => handleChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            className={commonClasses}
          />
        )}

        {field.type === "select" && (
          <Select
            value={value || ""}
            onValueChange={(val) => handleChange(field.id, val)}
          >
            <SelectTrigger
              className={`${commonClasses} cursor-pointer data-[placeholder]:text-white/70`}
            >
              <SelectValue
                placeholder={
                  field.placeholder || `Select ${field.label.toLowerCase()}`
                }
              />
            </SelectTrigger>
            <SelectContent
              className="bg-[#1a1a2e] border-purple-300/30 text-black max-h-[300px] overflow-y-auto z-50 "
              position="popper"
              sideOffset={4}
            >
              {field.options?.map((option) => {
                const optionValue =
                  typeof option === "string" ? option : option.value;
                const optionLabel =
                  typeof option === "string" ? option : option.label;
                return (
                  <SelectItem
                    key={optionValue}
                    value={optionValue}
                    className="hover:bg-purple-400/30 focus:bg-purple-400/40 data-[highlighted]:bg-purple-400/30 cursor-pointer text-white"
                  >
                    {optionLabel}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        )}

        {field.type === "multi-badge" && (
          <div className="flex flex-wrap gap-2">
            {field.options?.map((option) => {
              const optionValue =
                typeof option === "string" ? option : option.value;
              const optionLabel =
                typeof option === "string" ? option : option.label;
              const isSelected = (value || []).includes(optionValue);

              return (
                <Badge
                  key={optionValue}
                  onClick={() => handleMultiSelect(field.id, optionValue)}
                  className={`cursor-pointer transition-all ${
                    isSelected
                      ? "bg-purple-600 text-white hover:bg-purple-700"
                      : "bg-white/10 text-purple-200 hover:bg-white/20"
                  }`}
                >
                  {optionLabel}
                </Badge>
              );
            })}
          </div>
        )}

        {field.type === "textarea" && (
          <Textarea
            value={value || ""}
            onChange={(e) => handleChange(field.id, e.target.value)}
            rows={field.rows || 4}
            placeholder={field.placeholder}
            className="bg-white/5 border-purple-300/30 text-white min-h-[100px]"
          />
        )}
      </div>
    );
  };

  const groupFieldsBySection = (fields: FieldConfig[]) => {
    const sections: { [key: string]: FieldConfig[] } = {};

    fields.forEach((field) => {
      const section = field.section || "default";
      if (!sections[section]) {
        sections[section] = [];
      }
      sections[section].push(field);
    });

    return sections;
  };

  const renderTabContent = (tabId: string) => {
    const tabFields = config.fields.filter((field) => field.tab === tabId);
    const sections = groupFieldsBySection(tabFields);
    return (
      <div className="space-y-10">
        {Object.entries(sections).map(([sectionId, fields]) => (
          <div
            key={sectionId}
            className={
              sectionId !== "default"
                ? "border-t border-purple-300/30 pt-8"
                : ""
            }
          >
            {sectionId !== "default" && (
              <h3 className="text-lg font-semibold text-purple-100 mb-6 capitalize">
                {sectionId.replace(/-/g, " ")}
              </h3>
            )}
            <div className="grid grid-cols-2 gap-x-6 gap-y-6">
              {fields.map((field) => renderField(field))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const handleSubmit = () => {
    const missingFields = config.fields
      .filter((f) => f.required && !formData[f.id])
      .map((f) => f.label);

    if (missingFields.length > 0) {
      alert(`Please fill in required fields: ${missingFields.join(", ")}`);
      return;
    }

    onSave(formData);
  };

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
      <CardContent>
        <Tabs defaultValue={config.tabs[0].id} className="w-full">
          <TabsList className={`flex w-full bg-purple-900/30`}>
            {config.tabs.map((tab) => (
              <TabsTrigger
                key={tab.id}
                value={tab.id}
                className="flex-1 data-[state=active]:bg-purple-600 text-purple-100 cursor-pointer"
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {config.tabs.map((tab) => (
            <TabsContent key={tab.id} value={tab.id} className="mt-6">
              {tab.id === "vendor" && (
                <div className="flex items-center gap-2 mb-6 p-3 bg-blue-500/10 border border-blue-300/30 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-blue-300" />
                  <p className="text-sm text-blue-200">
                    A/P Vendor information only appears for contacts with VENDOR
                    classification
                  </p>
                </div>
              )}
              {renderTabContent(tab.id)}
            </TabsContent>
          ))}
        </Tabs>

        <div className="flex gap-3 mt-8 pt-6 border-t border-purple-300/30">
          <Button
            className="flex-1 bg-purple-600 hover:bg-purple-700 cursor-pointer"
            onClick={handleSubmit}
          >
            {mode === "add" ? `Add ${config.title}` : "Save Changes"}
          </Button>
          <Button
            variant="outline"
            className="flex-1 border-purple-300/30 text-purple-900 hover:bg-purple-500/20 cursor-pointer"
            onClick={onCancel}
          >
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default Form;
