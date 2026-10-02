export { DeepDiveReport } from './DeepDiveReport';
export { CompatibilityEngine } from './CompatibilityEngine';
export { BrandDiagnostic } from './BrandDiagnostic';
export { TemporalTracker } from './TemporalTracker';
export { RemedyTracker } from './RemedyTracker';

export type { DeepDiveOutput } from './DeepDiveReport';
export type { CompatibilityOutput, CompatibilityDimension } from './CompatibilityEngine';
export type { BrandDiagnosticOutput, BrandDimension, BrandAlternative } from './BrandDiagnostic';
export type { TemporalOutput, DailyReading, DayQuality } from './TemporalTracker';
export type { RemedyTrackerOutput, Remedy, RemedyLogEntry, RemedyProgress, RemedyFrequency } from './RemedyTracker';
export type { ReportSection, ProductMeta } from './types';
