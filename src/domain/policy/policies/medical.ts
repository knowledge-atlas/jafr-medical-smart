// Deprecated stub — emptied for Play Store compliance
export const medicalPolicy = {
  id: 'medical',
  enabled: false,
  apply: (_input: string): { allowed: boolean; reason: string } => ({ allowed: true, reason: '' }),
};
export default medicalPolicy;
