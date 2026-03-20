import { ModuleConfig } from "../../src/config/directoryConfig";

export const createEmptyFormData = (config: ModuleConfig) => {
  const formData: any = {};
  
  config.fields.forEach(field => {
    if (field.defaultValue !== undefined) {
      formData[field.id] = field.defaultValue;
    } else if (field.type === 'multi-badge' || field.type === 'multi-select') {
      formData[field.id] = [];
    } else if (field.type === 'number') {
      formData[field.id] = 0;
    } else {
      formData[field.id] = '';
    }
  });
  
  return formData;
};