// ================================================================
// المستورد الرئيسي - يجمع كل المصادر والعلاقات
// ================================================================

import { KnowledgeBase } from '../KnowledgeBase';
import { FLAGS } from '../../config/featureFlags';
import {
  importRoots, importPlanets, importSigns, importHouses,
  importElements, importLetters, importRemainders,
} from './coreImporters';
import {
  importResonance, importCompounds, importWafq, importRemedies,
} from './advancedImporters';
import {
  importMedicalRoots, importMedicalRemainders,
} from './medicalImporters';
import { importRelations } from './relationsImporter';

export const importAll = async (): Promise<void> => {
  console.log('📥 بدء استيراد كل المصادر...');
  const startTime = Date.now();

  // 1. الأساسيات
  console.log('   ⏳ الجذور...');
  KnowledgeBase.importEntities(importRoots());
  console.log('   ⏳ الكواكب...');
  KnowledgeBase.importEntities(importPlanets());
  console.log('   ⏳ الأبراج...');
  KnowledgeBase.importEntities(importSigns());
  console.log('   ⏳ البيوت...');
  KnowledgeBase.importEntities(importHouses());
  console.log('   ⏳ الطبائع...');
  KnowledgeBase.importEntities(importElements());
  console.log('   ⏳ الحروف...');
  KnowledgeBase.importEntities(importLetters());
  console.log('   ⏳ البواقي...');
  KnowledgeBase.importEntities(importRemainders());

  // 2. المتقدمات
  console.log('   ⏳ الرنين...');
  KnowledgeBase.importEntities(importResonance());
  console.log('   ⏳ التراكيب...');
  KnowledgeBase.importEntities(importCompounds());
  console.log('   ⏳ الأوفاق...');
  KnowledgeBase.importEntities(importWafq());
  console.log('   ⏳ الترياقات...');
  KnowledgeBase.importEntities(importRemedies());

  // 3. الطب التكاملي
  console.log('   ⏳ الجذور الطبية...');
  if (FLAGS.MEDICAL_MODULE) KnowledgeBase.importEntities(importMedicalRoots());
  console.log('   ⏳ البواقي الطبية...');
  if (FLAGS.MEDICAL_MODULE) KnowledgeBase.importEntities(importMedicalRemainders());

  // 4. ⭐ العلاقات (مهم!)
  console.log('   ⏳ العلاقات...');
  KnowledgeBase.importRelations(importRelations());

  // 5. حفظ
  console.log('   ⏳ حفظ الفهارس...');
  await KnowledgeBase.persist();

  const elapsed = Date.now() - startTime;
  console.log(`✅ اكتمل الاستيراد في ${elapsed}ms`);

  const stats = KnowledgeBase.stats();
  console.log(`📊 إحصائيات: ${stats.totalEntities} كيان، ${stats.totalRelations} علاقة`);
};
