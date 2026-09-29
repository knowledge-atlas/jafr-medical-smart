// ================================================================
// الواجهة الموحدة لقاعدة المعرفة
// ================================================================

export { KnowledgeBase } from './KnowledgeBase';
export { importAll } from './importers/DataImporter';
export type {
  KnowledgeEntity,
  KnowledgeRelation,
  SearchResult,
  SearchOptions,
  EntityType,
  SourceType,
  IndexStats,
} from './types';
