/**
 * Report Reorganizer v2 — يدعم النص متعدد الأسطر
 */

export function reorganizeReport(rawText: string): string {
  if (!rawText) return rawText;
  let text = rawText;
  text = mergeParagraphLines(text);
  text = reorganizeShadowSections(text);
  text = reorganizeElementSections(text);
  text = reorganizeMedicalSection(text);
  return text;
}

// ═══════════════════════════════════════════════════════════
// 0) دمج الأسطر المتصلة في فقرة واحدة
// ═══════════════════════════════════════════════════════════
function mergeParagraphLines(text: string): string {
  const lines = text.split('\n');
  const output: string[] = [];
  let buffer = '';

  const flush = () => {
    if (buffer.trim().length > 0) {
      output.push(buffer.trim());
    }
    buffer = '';
  };

  for (const line of lines) {
    const trimmed = line.trim();

    // إذا كان السطر فارغاً أو بداية جديدة → ادفع الفقرة
    if (
      trimmed.length === 0 ||
      /^[◈【#━─>•\-\*]/.test(trimmed) ||
      /^\d+\.\s/.test(trimmed) ||
      trimmed.startsWith('╭') ||
      trimmed.startsWith('╰') ||
      trimmed.startsWith('├') ||
      trimmed.startsWith('│') ||
      trimmed.startsWith('|') ||
      trimmed.startsWith('أما ') ||
      trimmed.startsWith('وأما ') ||
      trimmed.startsWith('ونقطة ') ||
      trimmed.startsWith('ومحرك ')
    ) {
      flush();
      output.push(line);
    } else {
      // سطر استكمالي — نضمّه للفقرة
      if (buffer.length > 0) {
        buffer += ' ' + trimmed;
      } else {
        buffer = trimmed;
      }
    }
  }

  flush();
  return output.join('\n');
}

// ═══════════════════════════════════════════════════════════
// 1) الظاهر/الباطن/الضعف — مع **إبراز الكلمات**
// ═══════════════════════════════════════════════════════════
function reorganizeShadowSections(text: string): string {
  const lines = text.split('\n');
  const output: string[] = [];

  const rules: Array<{ pattern: RegExp; prefix: string }> = [
    {
      pattern: /^أما ظاهره الجفري فهو[:：]?\s*(.+)$/,
      prefix: '- 🟢 **الظاهر (ما يراه الناس):**',
    },
    {
      pattern: /^أما ظاهره(?: هو)?[:：]?\s*(.+)$/,
      prefix: '- 🟢 **الظاهر:**',
    },
    {
      pattern: /^وأما باطنه الجفري فهو[^:：]*[:：]?\s*(.+)$/,
      prefix: '- 🔴 **الباطن (العمق المخفي):**',
    },
    {
      pattern: /^وأما باطنه(?: فهو)?[:：]?\s*(.+)$/,
      prefix: '- 🔴 **الباطن:**',
    },
    {
      pattern: /^ونقطة ضعفه الجفرية هي[:：]?\s*(.+)$/,
      prefix: '- ⚠️ **نقطة الضعف (الظل):**',
    },
    {
      pattern: /^ونقطة ضعفه(?: هي)?[:：]?\s*(.+)$/,
      prefix: '- ⚠️ **نقطة الضعف:**',
    },
    {
      pattern: /^ومحرك خلله الجفري هو[:：]?\s*(.+)$/,
      prefix: '- 🎯 **محرك الخلل:**',
    },
    {
      pattern: /^ومحرك خلله(?: هو)?[:：]?\s*(.+)$/,
      prefix: '- 🎯 **محرك الخلل:**',
    },
    {
      pattern: /^ظاهره[:：]\s*(.+)$/,
      prefix: '- 🟢 **الظاهر:**',
    },
    {
      pattern: /^باطنه[:：]\s*(.+)$/,
      prefix: '- 🔴 **الباطن:**',
    },
  ];

  for (const line of lines) {
    const trimmed = line.trim();
    let handled = false;

    for (const rule of rules) {
      const m = trimmed.match(rule.pattern);
      if (m) {
        const content = boldenKeywords(m[1]);
        output.push(`${rule.prefix} ${content}`);
        handled = true;
        break;
      }
    }

    if (!handled) output.push(line);
  }

  return output.join('\n');
}

/**
 * إبراز الكلمات المفتاحية داخل النص
 */
function boldenKeywords(text: string): string {
  const keywords = [
    'هدوء', 'لباقة', 'مرونة', 'تعاون', 'دبلوماسية',
    'حساسية', 'نقد', 'رفض', 'قلق', 'فقدان', 'توتر',
    'تردد', 'اعتماد', 'تنازل', 'انسحاب', 'صمت',
    'خوف', 'كتم', 'تأجيل', 'ذوبان', 'تعلق',
    'عمق', 'حدس', 'ذاكرة', 'حماية', 'رعاية',
    'قسوة', 'هوس', 'سيطرة', 'غيرة', 'شك',
    'جرأة', 'مبادرة', 'حسم', 'صراحة', 'غضب',
    'شجاعة', 'قيادة', 'حضور', 'سرعة', 'إلهام',
    'استعجال', 'تهور', 'صدام', 'احتراق',
  ];

  let result = text;
  for (const kw of keywords) {
    const re = new RegExp(`(${kw})`, 'g');
    result = result.replace(re, '**$1**');
  }
  return result;
}

// ═══════════════════════════════════════════════════════════
// 2) الطبائع والأبراج → جداول
// ═══════════════════════════════════════════════════════════
const SECTION_TITLES = [
  'طبع الجذر',
  'الطبع الداخلي',
  'الكوكب الداخلي',
  'البرج الداخلي',
  'البيت الداخلي',
  'البرج الخارجي',
  'الكوكب الخارجي',
  'الطبع المكتسب',
  'الطبع الناري',
  'الطبع الترابي',
  'الطبع الهوائي',
  'الطبع المائي',
];

const FIELD_KEYS = [
  'الوظيفة الأساسية',
  'الصفات الإيجابية',
  'الصفات السلبية',
  'الظل',
  'العمق الداخلي',
  'ما يخفيه',
  'ما تخفيه',
  'القوة الأساسية',
  'نقطة الضعف',
  'نقطة الانهيار',
  'الترياق',
  'البيئة المناسبة',
  'البيئة الضاغطة',
  'نمط التفكير',
  'نمط التوتر',
  'محرك الفشل',
  'الحروف المنتمية له',
  'النص النهائي',
  'القطبية',
  'الأثر التشغيلي',
  'الطبع الغالب',
  'الهوية العامة',
  'الوظيفة',
];

function reorganizeElementSections(text: string): string {
  const lines = text.split('\n');
  const output: string[] = [];
  let i = 0;

  while (i < lines.length) {
    const trimmed = lines[i].trim();

    const headerMatch = trimmed.match(/^◈\s+([^:：]+)[:：]\s*(.+)$/);
    if (headerMatch) {
      const title = headerMatch[1].trim();
      const value = headerMatch[2].trim();

      const isElement = SECTION_TITLES.some((t) => title.includes(t));
      if (!isElement) {
        output.push(lines[i]);
        i++;
        continue;
      }

      const rows: Array<[string, string]> = [];
      let elementName = value;
      let j = i + 1;

      // السطر التالي قد يكون اسم العنصر
      if (j < lines.length) {
        const nextLine = lines[j].trim();
        const isKV = FIELD_KEYS.some((k) => nextLine.startsWith(k));
        if (nextLine && !isKV && nextLine.length < 120 && !nextLine.startsWith('◈')) {
          elementName = nextLine;
          j++;
        }
      }

      // جمع key:value (يمتد لعدة أسطر إذا لم يبدأ بمفتاح جديد)
      let currentKey: string | null = null;
      let currentValue = '';

      while (j < lines.length) {
        const l = lines[j].trim();

        if (
          l.match(/^◈\s/) ||
          l.match(/^【/) ||
          l.match(/^━{5,}/) ||
          l.match(/^─{5,}/) ||
          l.match(/^#{1,3}\s/)
        ) {
          break;
        }

        if (l.length === 0) {
          j++;
          continue;
        }

        // key: value
        const kvMatch = l.match(/^([^:：]{2,60})[:：]\s*(.+)$/);
        if (kvMatch) {
          const key = kvMatch[1].trim();
          const val = kvMatch[2].trim();
          if (FIELD_KEYS.some((fk) => key.includes(fk) || fk.includes(key))) {
            if (currentKey) {
              rows.push([currentKey, currentValue.trim()]);
            }
            currentKey = key;
            currentValue = val;
            j++;
            continue;
          }
        }

        // سطر استكمالي — نضمّه للقيمة الحالية
        if (currentKey) {
          currentValue += ' ' + l;
          j++;
          continue;
        }

        // نقاط
        if (l.startsWith('•')) {
          const items: string[] = [];
          while (j < lines.length && lines[j].trim().startsWith('•')) {
            items.push(lines[j].trim().replace(/^•\s*/, ''));
            j++;
          }
          rows.push(['نقاط', items.join(' · ')]);
          continue;
        }

        j++;
      }

      if (currentKey) {
        rows.push([currentKey, currentValue.trim()]);
      }

      if (rows.length > 0) {
        output.push('');
        output.push(`### ◈ ${title}: ${elementName}`);
        output.push('');
        for (const [k, v] of rows) {
          // عنوان فرعي بارز
          output.push(`#### 📌 ${k}`);
          output.push('');
          output.push(v);
          output.push('');
        }
      } else {
        output.push(`### ◈ ${title}: ${elementName}`);
      }

      i = j;
      continue;
    }

    output.push(lines[i]);
    i++;
  }

  return output.join('\n');
}

// ═══════════════════════════════════════════════════════════
// 3) القسم الطبي
// ═══════════════════════════════════════════════════════════
function reorganizeMedicalSection(text: string): string {
  const medicalStartPattern = /━━━\s*الجذر الطبي\s*\d+[^━]*━{3,}/;
  const medicalMatch = text.match(medicalStartPattern);
  if (!medicalMatch) return text;

  const startIndex = medicalMatch.index!;
  const before = text.slice(0, startIndex);
  const medicalBody = text.slice(startIndex);

  const lines = medicalBody.split('\n');
  const bioFields: Array<[string, string]> = [];
  const psychoFields: Array<[string, string]> = [];
  const wellnessFields: Array<[string, string]> = [];
  const remaining: string[] = [];
  let medicalTitle = '';

  const bioKeys = ['الناقل العصبي', 'المستقبلات', 'الغدة', 'الهرمون', 'العضو', 'الجهاز'];
  const psychoKeys = ['النمط النفسي', 'نمط التعلق', 'الظاهر', 'الباطن', 'الخلل', 'الأعراض', 'نقطة الانهيار', 'المآل'];
  const wellnessKeys = ['العلاج النفسي', 'العلاج الحركي', 'الغذاء', 'النوم', 'الرياضة', 'المكمل', 'الترياق', 'الدواء', 'الجرعة'];

  let currentCategory: 'bio' | 'psycho' | 'wellness' | 'other' = 'other';
  let currentKey: string | null = null;

  const flushKey = () => {
    currentKey = null;
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();

    const titleMatch = line.match(/^━━━\s*(.+?)\s*━{3,}$/);
    if (titleMatch) {
      medicalTitle = titleMatch[1].trim();
      continue;
    }

    const kvMatch = line.replace(/^◈\s*/, '').match(/^([^:：]+)[:：]\s*(.+)$/);
    if (kvMatch) {
      const key = kvMatch[1].trim();
      const value = kvMatch[2].trim();

      if (bioKeys.some((k) => key.includes(k))) {
        bioFields.push([key, value]);
        currentCategory = 'bio';
      } else if (psychoKeys.some((k) => key.includes(k))) {
        psychoFields.push([key, value]);
        currentCategory = 'psycho';
      } else if (wellnessKeys.some((k) => key.includes(k))) {
        wellnessFields.push([key, value]);
        currentCategory = 'wellness';
      } else {
        remaining.push(line);
      }
      currentKey = key;
      continue;
    }

    if (line.length > 0 && !line.match(/^━{5,}/)) {
      // نضم إلى آخر حقل في الفئة الحالية
      if (currentKey && currentCategory !== 'other') {
        const target =
          currentCategory === 'bio' ? bioFields :
          currentCategory === 'psycho' ? psychoFields :
          wellnessFields;
        if (target.length > 0) {
          target[target.length - 1][1] += ' ' + line;
        }
      } else {
        remaining.push(line);
      }
    }
  }

  const output: string[] = [];
  output.push('');
  output.push(`## 🏥 ${medicalTitle || 'الموسوعة الطبية والرمزية'}`);
  output.push('');

  if (bioFields.length > 0) {
    output.push('### 🧬 المحور البيولوجي والعصبي');
    output.push('');
    for (const [k, v] of bioFields) output.push(`- **${k}:** ${v}`);
    output.push('');
  }

  if (psychoFields.length > 0) {
    output.push('### 🧠 المحور النفسي والسلوكي');
    output.push('');
    for (const [k, v] of psychoFields) output.push(`- **${k}:** ${v}`);
    output.push('');
  }

  if (wellnessFields.length > 0) {
    output.push('### 🌿 بروتوكول التوازن والشفاء');
    output.push('');
    for (const [k, v] of wellnessFields) output.push(`- **${k}:** ${v}`);
    output.push('');
  }

  if (remaining.length > 0) {
    output.push('### 📋 ملاحظات إضافية');
    output.push('');
    for (const line of remaining) output.push(line);
    output.push('');
  }

  return before + output.join('\n');
}
