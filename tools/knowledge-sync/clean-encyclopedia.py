#!/usr/bin/env python3
"""
تنظيف ملف الموسوعة الجفرية قبل الاستيراد
- يقسم الملف حسب "## الجذر N" (أو "# الجذر N")
- يحذف التكرار داخل كل قسم
- يولّد كلمات مفتاحية تلقائية
- يُنتج JSON جاهزاً للاستيراد في التطبيق
"""

import json
import re
import sys
from pathlib import Path

ROOT_MARKER = re.compile(r'^#{1,3}\s*الجذر\s+(\d+|الأول|الثاني|الثالث|الرابع|الخامس|السادس|السابع|الثامن|التاسع)', re.MULTILINE)

ARABIC_NUM = {
    'الأول': 1, 'الثاني': 2, 'الثالث': 3, 'الرابع': 4, 'الخامس': 5,
    'السادس': 6, 'السابع': 7, 'الثامن': 8, 'التاسع': 9,
}

ELEMENT_MAP = {
    'ناري': 'ناري', 'ترابي': 'ترابي', 'هوائي': 'هوائي', 'مائي': 'مائي',
}

PLANETS = ['عطارد', 'القمر', 'الزهرة', 'الشمس', 'المريخ', 'المشتري', 'زحل', 'أورانوس', 'نبتون', 'بلوتو']
SIGNS = ['الحمل', 'الثور', 'الجوزاء', 'السرطان', 'الأسد', 'العذراء', 'الميزان', 'العقرب', 'القوس', 'الجدي', 'الدلو', 'الحوت']


def norm_ar(t: str) -> str:
    if not t:
        return ''
    return (t.replace('إ', 'ا').replace('أ', 'ا').replace('آ', 'ا')
             .replace('ى', 'ي').replace('ة', 'ه').replace('ؤ', 'و').replace('ئ', 'ي')
             .strip().lower())


def dedupe_paragraphs(text: str) -> str:
    """يحذف الفقرات المكررة (بمقارنة أول 150 حرفاً مطبَّعة)"""
    paragraphs = re.split(r'\n\s*\n', text)
    seen = set()
    out = []
    for p in paragraphs:
        key = norm_ar(p)[:150]
        if key and key in seen:
            continue
        seen.add(key)
        if p.strip():
            out.append(p.strip())
    return '\n\n'.join(out)


def extract_keywords(text: str, max_kw: int = 30) -> list:
    """يستخرج كلمات مفتاحية من النص"""
    kws = set()
    
    # اسم الكوكب
    for p in PLANETS:
        if p in text:
            kws.add(p)
            kws.add(f'كوكب {p}')
    
    # اسم البرج
    for s in SIGNS:
        if s in text:
            kws.add(s)
            kws.add(f'برج {s}')
    
    # الطبع
    for e in ELEMENT_MAP:
        if e in text:
            kws.add(e)
            kws.add(f'طبع {e}')
    
    # جذور مذكورة
    for m in re.finditer(r'الجذر\s+(\d)', text):
        num = m.group(1)
        kws.add(f'الجذر {num}')
        kws.add(f'root{num}')
        kws.add(f'root_{num}')
    
    # بيوت
    for m in re.finditer(r'البيت\s+(\d+)', text):
        num = m.group(1)
        kws.add(f'البيت {num}')
        kws.add(f'house_{num}')
    
    return sorted(kws)[:max_kw]


def split_by_root(text: str) -> dict:
    """يقسم النص حسب ## الجذر N"""
    matches = list(ROOT_MARKER.finditer(text))
    if not matches:
        return {}
    
    sections = {}
    for i, m in enumerate(matches):
        start = m.start()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(text)
        chunk = text[start:end].strip()
        
        # استخرج الرقم
        root_label = m.group(1)
        root_num = ARABIC_NUM.get(root_label) if not root_label.isdigit() else int(root_label)
        
        if root_num is None:
            continue
        
        # إن كان هناك قسم سابق لنفس الجذر — دمجه (لا نستبدل)
        if root_num in sections:
            sections[root_num] += '\n\n' + chunk
        else:
            sections[root_num] = chunk
    
    return sections


def build_entity(root_num: int, content: str, source_file: str) -> dict:
    """يبني كيان JSON موحّد من قسم جذر"""
    clean = dedupe_paragraphs(content)
    keywords = extract_keywords(clean)
    
    # عنوان
    title = f'الجذر {root_num} — المصدر الموسوعي'
    
    # ملخص (أول 300 حرف)
    summary = clean[:300].replace('\n', ' ').strip() + '...'
    
    return {
        'id': f'encyclopedia_root_{root_num}',
        'entityType': 'root',
        'entityNumber': root_num,
        'titleAr': title,
        'fullText': clean,
        'summary': summary,
        'keywords': keywords,
        'metadata': {
            'source': source_file,
            'rootNumber': root_num,
            'extractedAt': __import__('datetime').datetime.now().isoformat(),
        },
    }


def main():
    if len(sys.argv) < 2:
        print('الاستخدام: python3 clean-encyclopedia.py <input-file> [output-json]')
        print('مثال: python3 clean-encyclopedia.py ~/storage/downloads/jafrencyclopediaFULL_v2.md')
        sys.exit(1)
    
    input_path = Path(sys.argv[1]).expanduser()
    if not input_path.exists():
        print(f'❌ الملف غير موجود: {input_path}')
        sys.exit(1)
    
    output_path = Path(sys.argv[2]).expanduser() if len(sys.argv) > 2 else \
                  input_path.parent / 'encyclopedia_clean.json'
    
    print(f'📖 قراءة: {input_path}')
    raw = input_path.read_text(encoding='utf-8')
    print(f'   الحجم: {len(raw):,} حرف')
    
    print('\n🔍 تقسيم حسب الجذور...')
    sections = split_by_root(raw)
    print(f'   وجدت {len(sections)} جذر')
    
    if not sections:
        print('⚠️ لم يُعثر على أي قسم "## الجذر N"')
        sys.exit(1)
    
    print('\n🧹 تنظيف + استخراج كلمات مفتاحية...')
    entities = []
    for root_num in sorted(sections.keys()):
        ent = build_entity(root_num, sections[root_num], input_path.name)
        entities.append(ent)
        print(f'   الجذر {root_num}: {len(ent["fullText"]):,} حرف · {len(ent["keywords"])} كلمة مفتاحية')
    
    result = {
        'entities': entities,
        'metadata': {
            'generatedAt': __import__('datetime').datetime.now().isoformat(),
            'sourceFile': input_path.name,
            'totalRoots': len(entities),
        },
    }
    
    output_path.write_text(
        json.dumps(result, ensure_ascii=False, indent=2),
        encoding='utf-8'
    )
    
    print(f'\n✅ حُفظ: {output_path}')
    print(f'   حجم: {output_path.stat().st_size:,} بايت')
    print(f'\n▶️ انسخه إلى ~/storage/downloads/ واستورده من التطبيق')


if __name__ == '__main__':
    main()
