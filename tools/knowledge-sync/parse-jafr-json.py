#!/usr/bin/env python3
"""
يحوّل jafr_encyclopedia_FULL_v2.json إلى كيانات متوافقة مع التطبيق
"""
import json, sys, re
from pathlib import Path
from datetime import datetime


def norm_ar(t):
    if not t: return ''
    return str(t).replace('إ','ا').replace('أ','ا').replace('آ','ا').replace('ى','ي').replace('ة','ه').strip()


def extract_keywords(text, extra=None):
    """يستخرج كلمات مفتاحية عامة"""
    kws = set()
    if extra:
        for e in extra:
            if e: kws.add(str(e).strip())
    
    # أضف من النص: كلمات عربية طولها 3+
    if text:
        for w in re.findall(r'[\u0600-\u06FF]{3,}', text):
            if len(w) <= 20 and len(kws) < 40:
                kws.add(w)
    return sorted(kws)


def parse_letter(item, idx):
    glyph = item.get('glyph', '')
    abjad = item.get('abjad_value', 0)
    element = item.get('element_model_cycle', '')
    cycle = item.get('cycle_position', 0)
    expanded = item.get('expanded_value_model', 0)
    
    title = f"حرف {glyph}"
    text = f"""الحرف: {glyph}
القيمة الأبجدية: {abjad}
العنصر المرتبط: {element}
الموضع في الدورة: {cycle}
القيمة الموسعة: {expanded}"""
    
    return {
        'id': f'jafr_letter_{idx+1:02d}',
        'entityType': 'letter',
        'entityNumber': idx + 1,
        'titleAr': title,
        'fullText': text,
        'summary': f'{glyph} = {abjad} ({element})',
        'keywords': extract_keywords(text, [glyph, str(abjad), element, f'حرف {glyph}']),
        'metadata': {'source': 'jafr_encyclopedia', 'abjad': abjad, 'element': element},
    }


def parse_root(item):
    num = item.get('number', 0)
    title_short = item.get('title', '')
    ref_text = item.get('reference_text', '') or ''
    operational = item.get('operational', {}) or {}
    
    title = f"الجذر {num} — {title_short}"
    
    # اجمع النص
    parts = [ref_text]
    if operational:
        parts.append('\n\n### البيانات التشغيلية:')
        if isinstance(operational, dict):
            for k, v in operational.items():
                parts.append(f"{k}: {v}")
    
    full = '\n'.join(parts)
    
    keywords = extract_keywords(full, [
        f'الجذر {num}', f'الجذر{num}', f'root_{num}', f'root{num}',
        title_short, f'Root {num}'
    ])
    
    return {
        'id': f'jafr_root_{num}',
        'entityType': 'root',
        'entityNumber': num,
        'titleAr': title,
        'fullText': full,
        'summary': ref_text[:300].replace('\n', ' ') + '...' if len(ref_text) > 300 else ref_text,
        'keywords': keywords,
        'metadata': {'source': 'jafr_encyclopedia', 'rootNumber': num, 'shortTitle': title_short},
    }


def parse_resonance_pair(item, idx):
    a = item.get('root_a') or item.get('a') or item.get('from') or ''
    b = item.get('root_b') or item.get('b') or item.get('to') or ''
    verdict = item.get('verdict') or item.get('type') or ''
    strength = item.get('strength') or item.get('weight') or ''
    note = item.get('note') or item.get('description') or ''
    
    title = f"رنين {a} ↔ {b}"
    text = f"""الجذر {a} ↔ الجذر {b}
الحالة: {verdict}
القوة: {strength}
{note}"""
    
    return {
        'id': f'jafr_resonance_{idx+1:02d}',
        'entityType': 'resonance',
        'entityNumber': idx + 1,
        'titleAr': title,
        'fullText': text,
        'summary': note[:200] if note else f'{verdict} ({strength})',
        'keywords': extract_keywords(text, [f'رنين {a} و {b}', f'{a}_{b}', str(a), str(b), verdict, 'رنين']),
        'metadata': {'source': 'jafr_encyclopedia', 'rootA': a, 'rootB': b, 'verdict': verdict},
    }


def parse_module(item, idx):
    mid = item.get('id', '')
    name = item.get('name', '')
    contains = item.get('contains', []) or []
    
    text = f"الوحدة {mid}: {name}\n\nالمحتوى:\n" + '\n'.join(f'• {c}' for c in contains)
    
    return {
        'id': f'jafr_module_{mid}',
        'entityType': 'custom',
        'entityNumber': idx + 1,
        'titleAr': f"وحدة {mid}: {name}",
        'fullText': text,
        'summary': name,
        'keywords': extract_keywords(text, [mid, name] + contains),
        'metadata': {'source': 'jafr_encyclopedia', 'moduleId': mid},
    }


def parse_remedy_map(remedy_map):
    """remedy_map = {"1": {...}, "2": {...}} → 9 entities"""
    out = []
    for k, v in remedy_map.items():
        if not isinstance(v, (dict, list, str)):
            continue
        if isinstance(v, dict):
            text = '\n'.join(f'{kk}: {vv}' for kk, vv in v.items())
        elif isinstance(v, list):
            text = '\n'.join(f'• {x}' for x in v)
        else:
            text = str(v)
        
        num = int(k) if str(k).isdigit() else 0
        out.append({
            'id': f'jafr_remedy_{num}',
            'entityType': 'remedy',
            'entityNumber': num,
            'titleAr': f'ترياق الجذر {num}',
            'fullText': text,
            'summary': text[:200].replace('\n', ' '),
            'keywords': extract_keywords(text, [f'الجذر {num}', f'ترياق {num}', 'ترياق']),
            'metadata': {'source': 'jafr_encyclopedia', 'rootNumber': num},
        })
    return out


def parse_inference_rule(item, idx):
    rid = item.get('id') or item.get('rule_id') or f'R{idx+1}'
    desc = item.get('description') or item.get('text') or item.get('rule') or str(item)
    condition = item.get('condition') or item.get('if') or ''
    result = item.get('result') or item.get('then') or ''
    
    text = f"قاعدة {rid}\n\n{desc}"
    if condition: text += f"\n\nالشرط: {condition}"
    if result: text += f"\n\nالنتيجة: {result}"
    
    return {
        'id': f'jafr_rule_{rid}',
        'entityType': 'custom',
        'entityNumber': idx + 1,
        'titleAr': f'قاعدة استدلال {rid}',
        'fullText': text,
        'summary': desc[:200],
        'keywords': extract_keywords(text, [str(rid), 'قاعدة', 'استدلال']),
        'metadata': {'source': 'jafr_encyclopedia', 'ruleId': rid},
    }


def parse_layer(item, idx):
    if isinstance(item, str):
        text = item
        title = item[:60]
    elif isinstance(item, dict):
        lid = item.get('id') or item.get('layer') or f'L{idx+1}'
        name = item.get('name') or item.get('title') or ''
        desc = item.get('description') or ''
        text = f"{name}\n{desc}".strip()
        title = f"طبقة {lid}: {name}" if name else f"طبقة {idx+1}"
    else:
        text = str(item)
        title = f"طبقة {idx+1}"
    
    return {
        'id': f'jafr_layer_{idx+1:02d}',
        'entityType': 'custom',
        'entityNumber': idx + 1,
        'titleAr': title,
        'fullText': text,
        'summary': text[:200],
        'keywords': extract_keywords(text, ['طبقة', f'طبقة {idx+1}']),
        'metadata': {'source': 'jafr_encyclopedia'},
    }


def parse_confidence(item, idx):
    if isinstance(item, dict):
        text = '\n'.join(f'{k}: {v}' for k, v in item.items())
        title = item.get('label') or item.get('name') or f'مستوى {idx+1}'
    else:
        text = str(item)
        title = f'مستوى ثقة {idx+1}'
    
    return {
        'id': f'jafr_confidence_{idx+1}',
        'entityType': 'custom',
        'entityNumber': idx + 1,
        'titleAr': f'مستوى الثقة: {title}',
        'fullText': text,
        'summary': text[:200],
        'keywords': extract_keywords(text, ['ثقة', 'confidence']),
        'metadata': {'source': 'jafr_encyclopedia'},
    }


def main():
    if len(sys.argv) < 2:
        print("Usage: python3 parse-jafr-json.py <input.json> [output.json]")
        sys.exit(1)
    
    inp = Path(sys.argv[1]).expanduser()
    out = Path(sys.argv[2]).expanduser() if len(sys.argv) > 2 else \
          inp.parent / 'jafr_encyclopedia_clean.json'
    
    print(f'📖 قراءة: {inp}')
    data = json.load(open(inp, encoding='utf-8'))
    
    entities = []
    now = datetime.now().isoformat()
    src = inp.name
    
    # ═══ الحروف 28 ═══
    if 'letters' in data:
        for i, l in enumerate(data['letters']):
            entities.append(parse_letter(l, i))
        print(f'✅ الحروف: {len(data["letters"])}')
    
    # ═══ الجذور 9 ═══
    if 'roots' in data:
        for r in data['roots']:
            entities.append(parse_root(r))
        print(f'✅ الجذور: {len(data["roots"])}')
    
    # ═══ الرنين 36 ═══
    if 'resonance_pairs_36' in data:
        for i, pair in enumerate(data['resonance_pairs_36']):
            entities.append(parse_resonance_pair(pair, i))
        print(f'✅ الرنين: {len(data["resonance_pairs_36"])}')
    
    # ═══ الوحدات 13 ═══
    if 'encyclopedia_modules' in data:
        for i, m in enumerate(data['encyclopedia_modules']):
            entities.append(parse_module(m, i))
        print(f'✅ الوحدات: {len(data["encyclopedia_modules"])}')
    
    # ═══ الترياقات ═══
    if 'remedy_map' in data and isinstance(data['remedy_map'], dict):
        remed = parse_remedy_map(data['remedy_map'])
        entities.extend(remed)
        print(f'✅ الترياقات: {len(remed)}')
    
    # ═══ قواعد الاستدلال 7 ═══
    if 'inference_rules' in data:
        for i, r in enumerate(data['inference_rules']):
            entities.append(parse_inference_rule(r, i))
        print(f'✅ قواعد: {len(data["inference_rules"])}')
    
    # ═══ الطبقات 22 ═══
    if 'layer_order' in data:
        for i, l in enumerate(data['layer_order']):
            entities.append(parse_layer(l, i))
        print(f'✅ الطبقات: {len(data["layer_order"])}')
    
    # ═══ مقاييس الثقة 11 ═══
    if 'confidence_scale' in data:
        for i, c in enumerate(data['confidence_scale']):
            entities.append(parse_confidence(c, i))
        print(f'✅ مقاييس الثقة: {len(data["confidence_scale"])}')
    
    # ═══ المعادلات — كيان واحد ═══
    if 'formulas' in data and isinstance(data['formulas'], dict):
        f = data['formulas']
        text = '\n'.join(f'{k}: {json.dumps(v, ensure_ascii=False) if not isinstance(v, str) else v}' 
                         for k, v in f.items())
        entities.append({
            'id': 'jafr_formulas',
            'entityType': 'custom',
            'entityNumber': 0,
            'titleAr': 'المعادلات والصيغ',
            'fullText': text,
            'summary': 'صيغ الأبجد + الحسابات',
            'keywords': extract_keywords(text, ['معادلة', 'أبجد', 'formula', 'mod7', 'mod12', 'mod28']),
            'metadata': {'source': 'jafr_encyclopedia'},
        })
        print(f'✅ المعادلات: 1')
    
    # ═══ ضع sourceFile على كل الكيانات ═══
    for e in entities:
        e['sourceFile'] = src
        e['importedAt'] = now
        e['type'] = 'external'
        if 'metadata' not in e:
            e['metadata'] = {}
        e['metadata']['sourceFile'] = src
    
    # ═══ اكتب الناتج ═══
    result = {
        'entities': entities,
        'metadata': {
            'generatedAt': now,
            'sourceFile': src,
            'total': len(entities),
        }
    }
    
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding='utf-8')
    
    size_kb = out.stat().st_size / 1024
    print(f'\n✨ الإجمالي: {len(entities)} كيان')
    print(f'💾 حُفظ: {out} ({size_kb:.1f} KB)')
    print(f'\n▶️ انسخ إلى ~/storage/downloads/ واستورده من التطبيق')


if __name__ == '__main__':
    main()
