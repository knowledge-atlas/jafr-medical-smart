# Knowledge Sync — استيراد المعرفة الخارجية

## الاستخدام
1. حرّر `sources.json` — أضف مصادرك
2. نفّذ: `node tools/knowledge-sync/run.mjs`
3. تحقق من: `src/data/external/entities.json`
4. أعد بناء التطبيق — KB سيحمّل البيانات تلقائياً

## أنواع المصادر المدعومة
- **wikipedia** — Wikipedia Arabic API
- **json** — أي URL يرجع JSON
- **local** — ملف JSON محلي

## Entity Types المدعومة
root, planet, sign, house, element, letter, remainder,
compound, resonance, medical, remedy, wafq
