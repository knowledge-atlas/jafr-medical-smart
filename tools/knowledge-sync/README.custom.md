# 📚 دليل إضافة مصادرك المخصصة

## الطريقة السريعة — سكريبت تفاعلي
node tools/knowledge-sync/add-source.mjs

## الطريقة اليدوية — حرّر sources.custom.json

### مثال 1: مقالة Wikipedia
{
  "id": "my-wiki-source",
  "type": "wikipedia",
  "enabled": true,
  "queries": [{
    "entityType": "medical",
    "titleAr": "الطب النبوي",
    "searchTerm": "الطب النبوي",
    "lens": "custom",
    "lensLabel": "مخصص",
    "keywords": ["طب", "نبوي", "علاج"]
  }]
}

### مثال 2: JSON خارجي
{
  "id": "my-json-api",
  "type": "json",
  "enabled": true,
  "url": "https://api.example.com/knowledge"
}

### مثال 3: ملف محلي
{
  "id": "my-local",
  "type": "local",
  "enabled": true,
  "path": "/path/to/file.json"
}

## أنواع الكيانات
root, planet, sign, house, element, letter, remainder,
compound, resonance, medical, remedy, wafq

## العدسات
- general = عام
- falaki = فلكي
- ramzi = رمزي
- lughawi = لغوي
- tarikhi = تاريخي
- custom = مخصص

## بعد الإضافة:
node tools/knowledge-sync/run.mjs
