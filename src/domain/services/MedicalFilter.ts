// Deprecated stub — emptied for Play Store compliance
const _noop = (text: string): string => text;

export const medicalFilter = {
  filter: _noop,
  sanitize: _noop,
  hasMedicalContent: (_text: string): boolean => false,
  strip: _noop,
};

export const MedicalFilter = medicalFilter;
export default medicalFilter;
