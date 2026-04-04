import { NextRequest, NextResponse } from 'next/server';
import { chatWithAi } from '@/lib/ai';
import { db } from '@/lib/db';

// In-memory conversation histories for demo (keyed by sessionId)
const demoConversations = new Map<string, Array<{ role: string; content: string }>>();

// Track sessions that already have a lead saved
const leadSavedSessions = new Set<string>();

// Contact info regex patterns
const PHONE_REGEX = /[+]?[\d\s\-()]{7,}/g;
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

// Contact nudge instructions per language (added to system prompt after 3+ messages)
const CONTACT_NUDGE = {
  ru: '\n\nЛЕД-КАПЧЕР: Если в переписке ещё не было имени, номера телефона или email — вежливо спроси ТОЛЬКО то, чего не хватает (имя, телефон, email). Если часть данных уже есть — НЕ спрашивай их снова, спрашивай только недостающие. Это нужно для обратной связи и записи. Сделай это естественно, например: «Кстати, как вас зовут? Оставьте номер телефона и email — чтобы мы могли подтвердить запись и на связи оставаться».',
  en: '\n\nLEAD CAPTURE: If some contact info is still missing (name, phone, email) — politely ask ONLY for what\'s missing. If the person already shared some info earlier, DO NOT ask for it again — only ask for what hasn\'t been provided yet. This is needed for follow-up and booking confirmation. Do it naturally, e.g.: "By the way, what\'s your name? Could you leave your phone number and email so we can confirm the booking and reach you?"',
  tr: '\n\nLEAD YAKALAMA: Henüz eksik olan iletişim bilgileri varsa (ad, telefon, e-posta) — SADECE eksik olanları nazikçe sor. Kişi daha önce bazı bilgileri paylaştıysa, onları TEKRAR sorma — sadece henüz sağlanmamış olanları sor. Bu geri bildirim ve randevu onayı için gereklidir. Bunu doğal yap, örn.: "Ayrıca adınız ne? Telefon numaranızı ve e-posta adresinizi bırakır mısınız? Randevuyu onaylamak ve size ulaşmak için lazım."',
};

// Contact nudge for rule-based bots (trilingual) — now includes email
const CONTACT_NUDGE_RESPONSES = {
  ru: ' Кстати, как вас зовут? Оставьте номер телефона и email — чтобы мы могли подтвердить запись и на связи оставаться 😊',
  en: ' By the way, what\'s your name? Could you leave your phone number and email so we can confirm the booking and reach you? 😊',
  tr: ' Ayrıca adınız ne? Telefon numaranızı ve e-posta adresinizi bırakır mısınız? Randevuyu onaylamak için gerekli 😊',
};

function extractPhone(text: string): string | null {
  const matches = text.match(PHONE_REGEX);
  if (!matches || matches.length === 0) return null;
  // Clean up the phone number — keep only digits and +
  const cleaned = matches[0].replace(/[\s\-()]/g, '');
  if (cleaned.replace('+', '').length >= 7) return cleaned;
  return null;
}

function extractEmail(text: string): string | null {
  const matches = text.match(EMAIL_REGEX);
  if (!matches || matches.length === 0) return null;
  return matches[0];
}

/**
 * Extract a person's name from text.
 * Handles full names (ФИО), single names, and various phrasings across languages.
 * Returns the full name or null.
 */
function extractName(text: string): string | null {
  // BUGFIX: If the text looks like just an email address, don't extract the email login as a name
  // e.g., "john.doe@mail.com" should NOT be extracted as name "john.doe" or "john"
  const trimmedText = text.trim();
  if (EMAIL_REGEX.test(trimmedText) && !PHONE_REGEX.test(trimmedText.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, ''))) {
    // Text is primarily an email address - don't extract name from it
    const emailMatch = trimmedText.match(EMAIL_REGEX);
    if (emailMatch && emailMatch.length === 1 && trimmedText.replace(emailMatch[0], '').trim().length < 5) {
      return null; // Text is mostly just an email, don't extract
    }
  }

  const excludeWords = new Set([
    // Russian common words
    'не', 'так', 'это', 'ещё', 'уже', 'здесь', 'там', 'тут', 'как', 'что', 'все',
    'буду', 'могу', 'хочу', 'надо', 'нужно', 'можно', 'пожалуйста', 'мне',
    'можете', 'подскажите', 'скажите', 'помогите', 'запишите', 'записать',
    'записаться', 'запишитесь',
    'спасибо', 'хорошо', 'конечно', 'давайте', 'ладно', 'окей',
    'отлично', 'прекрасно', 'замечательно', 'здорово', 'супер',
    'привет', 'здравствуйте', 'добрый', 'вечер', 'день', 'утро',
    'да', 'нет', 'ок', 'ага', 'угу',
    'завтра', 'сегодня', 'послезавтра',
    // English common words
    'not', 'this', 'that', 'here', 'there', 'how', 'what', 'all', 'yes', 'no', 'would',
    'will', 'can', 'just', 'also', 'very', 'really', 'please', 'want', 'need',
    'thanks', 'great', 'good', 'fine', 'okay', 'sure', 'well', 'hello', 'hi',
    'morning', 'evening', 'afternoon', 'tomorrow', 'today',
    // Turkish common words
    'değil', 'bu', 'şu', 'nasıl', 'ne', 'evet', 'hayır', 'istiyorum', 'lazım',
    'teşekkürler', 'güzel', 'tamam', 'tabii', 'merhaba', 'günaydın',
    'yarin', 'bugun',
  ]);

  // Patterns that capture full name (1-3 words after the trigger)
  const fullNamePatterns = [
    /меня зовут\s+([А-Яа-яЁёA-Za-z]+(?:\s+[А-Яа-яЁёA-Za-z]+){0,2})/i,
    /моё имя\s+([А-Яа-яЁёA-Za-z]+(?:\s+[А-Яа-яЁёA-Za-z]+){0,2})/i,
    /мои данные:\s*([А-Яа-яЁёA-Za-z]+(?:\s+[А-Яа-яЁёA-Za-z]+){0,2})/i,
    /my name is\s+([A-Za-z]+(?:\s+[A-Za-z]+){0,2})/i,
    /my name\'?s\s+([A-Za-z]+(?:\s+[A-Za-z]+){0,2})/i,
    /i\'?m\s+([A-Za-z]+(?:\s+[A-Za-z]+){0,2})/i,
    /call me\s+([A-Za-z]+(?:\s+[A-Za-z]+){0,2})/i,
    /adım\s+([A-Za-zÇçĞğİıÖöŞşÜü]+(?:\s+[A-Za-zÇçĞğİıÖöŞşÜü]+){0,2})/i,
    /benim adım\s+([A-Za-zÇçĞğİıÖöŞşÜü]+(?:\s+[A-Za-zÇçĞğİıÖöŞşÜü]+){0,2})/i,
    /ben\s+([A-Za-zÇçĞğİıÖöŞşÜü]+(?:\s+[A-Za-zÇçĞğİıÖöŞşÜü]+){0,2})\s*[,\.]/i,
  ];

  for (const pattern of fullNamePatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const candidate = match[1].trim();
      const words = candidate.split(/\s+/);
      if (words.every(w => !excludeWords.has(w.toLowerCase())) && candidate.length > 1 && candidate.length < 60) {
        return candidate;
      }
    }
  }

  // ── CRITICAL FIX: name at start followed by phone/email WITHOUT punctuation ──
  // This is the #1 most common format: "Мухаммад +79991234567 muhammad@mail.ru"
  // Previous patterns ALL missed this because they required punctuation after the name.
  // Unicode-aware: Cyrillic includes Ёё, Turkish includes ÇçĞğİıÖöŞşÜü
  const nameBeforeContactPatterns = [
    // Name followed by phone number (+ or digit)
    /^([А-ЯЁA-ZÇĞİÖŞÜ][а-яёa-zçğıöşüñ]+(?:\s+[А-ЯЁA-ZÇĞİÖŞÜ][а-яёa-zçğıöşüñ]+){0,2})\s*[+\d]/,
    // Name followed by email (@)
    /^([А-ЯЁA-ZÇĞİÖŞÜ][а-яёa-zçğıöşüñ]+(?:\s+[А-ЯЁA-ZÇĞİÖŞÜ][а-яёa-zçğıöşüñ]+){0,2})\s+[a-zA-Z0-9._%+-]+@/,
  ];
  for (const pattern of nameBeforeContactPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const candidate = match[1].trim();
      const words = candidate.split(/\s+/);
      // Single-word names need 3+ chars; multi-word names need 2+ chars each
      const minLen = words.length === 1 ? 3 : 2;
      if (words.every(w => w.length >= minLen && w.length < 30 && !excludeWords.has(w.toLowerCase()))) {
        return candidate;
      }
    }
  }

  // Pattern: "ФИО:" prefix — e.g. "ФИО: Иванов Иван Иванович" or "ФИО Иванов Иван"
  const fioMatch = text.match(/(?:ФИО|фио)[:\s]+([А-ЯЁA-ZÇĞİÖŞÜ][а-яёa-zçğıöşüñ]+(?:\s+[А-ЯЁA-ZÇĞİÖŞÜ][а-яёa-zçğıöşüñ]+){0,2})/i);
  if (fioMatch && fioMatch[1]) {
    const candidate = fioMatch[1].trim();
    const words = candidate.split(/\s+/);
    if (words.every(w => !excludeWords.has(w.toLowerCase()) && w.length > 1 && w.length < 30)) {
      return candidate;
    }
  }

  // Pattern: "Имя:" or "Name:" prefix — e.g. "Имя: Мухаммад" or "Name: John Smith"
  const nameKwMatch = text.match(/(?:Имя|имя|Name|name|Ad|ad)[:\s]+([А-ЯЁA-ZÇĞİÖŞÜ][а-яёa-zçğıöşüñ]+(?:\s+[А-ЯЁA-ZÇĞİÖŞÜ][а-яёa-zçğıöşüñ]+){0,2})/i);
  if (nameKwMatch && nameKwMatch[1]) {
    const candidate = nameKwMatch[1].trim();
    const words = candidate.split(/\s+/);
    const minLen = words.length === 1 ? 3 : 2;
    if (words.every(w => w.length >= minLen && w.length < 30 && !excludeWords.has(w.toLowerCase()))) {
      return candidate;
    }
  }

  // Pattern: name after comma in info context
  // e.g. "Запишите, Иванов Иван, на завтра" or "Хочу записаться, Мухаммад, на 15:00"
  const afterCommaPattern = /,\s*([А-ЯЁA-ZÇĞİÖŞÜ][а-яёa-zçğıöşüñ]{2,}(?:\s+[А-ЯЁA-ZÇĞİÖŞÜ][а-яёa-zçğıöşüñ]{2,}){0,2})\b/i;
  const afterCommaMatch = text.match(afterCommaPattern);
  if (afterCommaMatch && afterCommaMatch[1]) {
    const candidate = afterCommaMatch[1].trim();
    const words = candidate.split(/\s+/);
    if (words.every(w => !excludeWords.has(w.toLowerCase()) && w.length > 1 && w.length < 30)) {
      return candidate;
    }
  }

  // Pattern: "Это [Name]" — e.g. "Это Мухаммад"
  const etoPattern = /это\s+([А-ЯЁA-ZÇĞİÖŞÜ][а-яёa-zçğıöşüñ]+(?:\s+[А-ЯЁA-ZÇĞİÖŞÜ][а-яёa-zçğıöşüñ]+){0,2})\b/i;
  const etoMatch = text.match(etoPattern);
  if (etoMatch && etoMatch[1]) {
    const candidate = etoMatch[1].trim();
    const words = candidate.split(/\s+/);
    if (words.every(w => !excludeWords.has(w.toLowerCase()) && w.length > 1 && w.length < 30)) {
      return candidate;
    }
  }

  // Pattern: name at the start of message (capitalized word(s) before punctuation)
  // e.g. "Иванов Иван, хочу записаться" or "Мухаммад. Запишите на завтра"
  const startNamePatterns = [
    /^([А-ЯЁA-ZÇĞİÖŞÜ][а-яёa-zçğıöşüñ]+(?:\s+[А-ЯЁA-ZÇĞİÖŞÜ][а-яёa-zçğıöşüñ]+){0,2})\s*[,\.\-:;!?]/,
  ];
  for (const pattern of startNamePatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const candidate = match[1].trim();
      const words = candidate.split(/\s+/);
      if (words.length >= 2 && words.every(w => w.length > 1 && w.length < 30 && !excludeWords.has(w.toLowerCase()))) {
        return candidate;
      }
    }
  }

  // Pattern: "я [Name]" — e.g. "я Иванов" or "я Мухаммад"
  const yaPattern = /я\s+([А-ЯЁA-ZÇĞİÖŞÜ][а-яёa-zçğıöşüñ]+(?:\s+[А-ЯЁA-ZÇĞİÖŞÜ][а-яёa-zçğıöşüñ]+){0,2})\b/i;
  const yaMatch = text.match(yaPattern);
  if (yaMatch && yaMatch[1]) {
    const candidate = yaMatch[1].trim();
    const words = candidate.split(/\s+/);
    if (words.every(w => !excludeWords.has(w.toLowerCase()) && w.length > 1 && w.length < 30)) {
      return candidate;
    }
  }

  // Pattern: name as the ONLY content in message (response to "как вас зовут?")
  // e.g. "Иван" or "Иванов Иван" — a single capitalized name, possibly with period/comma
  const singleNamePattern = /^(?:Да,?\s*)?([А-ЯA-ZÇĞİÖŞÜ][а-яa-zçğıöşüñ]+(?:\s+[А-ЯA-ZÇĞİÖŞÜ][а-яa-zçğıöşüñ]+){0,2})[.,!?\s]*$/;
  const singleMatch = text.match(singleNamePattern);
  if (singleMatch && singleMatch[1]) {
    const candidate = singleMatch[1].trim();
    const words = candidate.split(/\s+/);
    // Single name must be at least 3 chars to filter out "Да", "Ок" etc.
    // Multi-word names: each word must be at least 2 chars
    const minLen = words.length === 1 ? 3 : 2;
    if (words.every(w => w.length >= minLen && w.length < 30 && !excludeWords.has(w.toLowerCase()))) {
      return candidate;
    }
  }

  return null;
}

function scanHistoryForContacts(messages: Array<{ role: string; content: string }>): { phone: string | null; email: string | null; name: string | null } {
  let phone: string | null = null;
  let email: string | null = null;
  let name: string | null = null;

  // Scan all messages text for phone and email
  const allText = messages.map(m => m.content).join(' ');
  phone = extractPhone(allText);
  email = extractEmail(allText);

  // Scan each USER message individually for names (so ^ and $ anchored patterns work)
  for (const msg of messages) {
    if (msg.role === 'user') {
      const msgName = extractName(msg.content);
      if (msgName) {
        name = msgName;
        break;
      }
    }
  }

  // If no name found in individual messages, try joined text (for trigger phrases across messages)
  if (!name) {
    name = extractName(allText);
  }

  return { phone, email, name };
}

/**
 * Build a dynamic contact context string to inject into the AI system prompt.
 * Explicitly lists what contacts have been collected and what's still missing,
 * so the AI knows exactly what NOT to ask for.
 */
function buildContactContext(contacts: { name: string | null; phone: string | null; email: string | null }, lang: string): string {
  const collected: string[] = [];
  const missing: string[] = [];

  if (lang === 'en') {
    if (contacts.name) collected.push(`Name: ${contacts.name}`);
    else missing.push('name');
    if (contacts.phone) collected.push(`Phone: ${contacts.phone}`);
    else missing.push('phone number');
    if (contacts.email) collected.push(`Email: ${contacts.email}`);
    else missing.push('email');

    if (collected.length === 0) return '';

    let msg = `\n\n[ALREADY COLLECTED CONTACT INFO]: ${collected.join('; ')}. `;
    if (missing.length > 0) {
      msg += `Still missing: ${missing.join(', ')}. You may ask for ONLY these missing items, naturally integrated into the conversation. DO NOT ask for ${collected.map(c => c.split(':')[0].toLowerCase()).join(', ')} again.`;
    } else {
      msg += `ALL contact info is collected. DO NOT ask for name, phone, or email again under any circumstances.`;
    }
    return msg;
  }

  if (lang === 'tr') {
    if (contacts.name) collected.push(`Ad: ${contacts.name}`);
    else missing.push('ad');
    if (contacts.phone) collected.push(`Telefon: ${contacts.phone}`);
    else missing.push('telefon numarası');
    if (contacts.email) collected.push(`E-posta: ${contacts.email}`);
    else missing.push('e-posta');

    if (collected.length === 0) return '';

    let msg = `\n\n[TOPLANMIŞ İLETİŞİM BİLGİLERİ]: ${collected.join('; ')}. `;
    if (missing.length > 0) {
      msg += `Hâlâ eksik: ${missing.join(', ')}. SADECE eksik olanları doğal bir şekilde sor. ${collected.map(c => c.split(':')[0].toLowerCase()).join(', ')} için TEKRAR sorma.`;
    } else {
      msg += `TÜM iletişim bilgileri toplandı. Ad, telefon veya e-posta için ASLA tekrar sorma.`;
    }
    return msg;
  }

  // Russian (default)
  if (contacts.name) collected.push(`Имя: ${contacts.name}`);
  else missing.push('имя');
  if (contacts.phone) collected.push(`Телефон: ${contacts.phone}`);
  else missing.push('телефон');
  if (contacts.email) collected.push(`Email: ${contacts.email}`);
  else missing.push('email');

  if (collected.length === 0) return '';

  let msg = `\n\n[УЖЕ СОБРАННЫЕ КОНТАКТНЫЕ ДАННЫЕ]: ${collected.join('; ')}. `;
  if (missing.length > 0) {
    msg += `Ещё не хватает: ${missing.join(', ')}. Ты можешь спросить ТОЛЬКО то, чего не хватает — естественно, в ходе разговора. НЕ спрашивай повторно: ${collected.map(c => c.split(':')[0].toLowerCase()).join(', ')}.`;
  } else {
    msg += `ВСЕ контактные данные уже собраны. НИКОГДА больше не спрашивай имя, телефон или email.`;
  }
  return msg;
}

// Day names for calendar context (ISO: 1=Mon...7=Sun)
const DAY_NAMES_RU = ['', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];
const DAY_NAMES_EN = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DAY_NAMES_TR = ['', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];

// Booking intent keywords across languages
const BOOKING_KEYWORDS = [
  // Russian
  'записать', 'запись', 'приём', 'прием', 'встреча', 'записаться', 'запишите',
  'запишу', 'расписание', 'свободное время', 'свободных мест', 'консультация',
  'назначить', 'созвон', 'встретиться', 'забронировать', 'бронь',
  // English
  'book', 'booking', 'appointment', 'schedule', 'reschedule', 'reserve',
  'available time', 'available slot', 'consultation', 'see you', 'meet up',
  'set up a call', 'meet with', 'make an appointment',
  // Turkish
  'randevu', 'rezervasyon', 'randevu al', 'görüşme', 'buluşma', 'kayıt',
  'müsait', 'zaman', 'randevuyu',
];

function findFaqAnswer(question: string, faq: Array<{ question: string; answer: string }>): string | null {
  if (!faq || faq.length === 0) return null;

  const normalizedQ = question.toLowerCase().replace(/[?!.,;:]/g, '').trim();

  for (const item of faq) {
    const normalizedItemQ = item.question.toLowerCase().replace(/[?!.,;:]/g, '').trim();
    // Direct match
    if (normalizedQ === normalizedItemQ) return item.answer;
    // Contains match
    if (normalizedQ.includes(normalizedItemQ) || normalizedItemQ.includes(normalizedQ)) return item.answer;
    // Keyword overlap (at least 3 words)
    const qWords = normalizedQ.split(/\s+/);
    const itemWords = normalizedItemQ.split(/\s+/);
    const overlap = qWords.filter(w => itemWords.includes(w));
    if (overlap.length >= 3) return item.answer;
  }

  return null;
}

function detectBookingIntent(text: string): boolean {
  const lower = text.toLowerCase();
  return BOOKING_KEYWORDS.some(kw => lower.includes(kw));
}

function buildCalendarContext(calendarConfig: Record<string, unknown> | undefined, lang: string): string {
  if (!calendarConfig) return '';

  const days = (calendarConfig.days as number[]) || [];
  const startTime = (calendarConfig.startTime as string) || '09:00';
  const endTime = (calendarConfig.endTime as string) || '18:00';
  const slotDuration = (calendarConfig.slotDuration as number) || 60;
  const bufferMinutes = (calendarConfig.bufferMinutes as number) || 15;
  const maxConcurrent = (calendarConfig.maxConcurrentBookings as number) || 1;

  const dayNames = lang === 'tr' ? DAY_NAMES_TR : lang === 'en' ? DAY_NAMES_EN : DAY_NAMES_RU;

  const workingDays = days.map(d => dayNames[d] || `Day ${d}`).join(', ');

  // Build language-appropriate context
  if (lang === 'en') {
    return `\n\n📅 YOUR WORKING HOURS & CALENDAR:
- Working days: ${workingDays}
- Hours: ${startTime} – ${endTime}
- Appointment slot duration: ${slotDuration} minutes
- Buffer between appointments: ${bufferMinutes} minutes
- Max concurrent appointments per slot: ${maxConcurrent}

When someone wants to book, suggest available time slots within these hours. If they pick a specific day, mention the working hours for that day. If they pick a day you're closed, gently let them know and suggest the nearest working day.`;
  }

  if (lang === 'tr') {
    return `\n\n📅 ÇALIŞMA SAATLERİ VE TAKVİM:
- Çalışma günleri: ${workingDays}
- Saatler: ${startTime} – ${endTime}
- Randevu süresi: ${slotDuration} dakika
- Randevular arası boşluk: ${bufferMinutes} dakika
- Aynı slotta maksimum randevu: ${maxConcurrent}

Biri randevu almak istediğinde, bu saatler içinde uygun zamanlar öner. Spesifik bir gün seçerse, o günün çalışma saatlerini belirt. Kapalı bir gün seçerse, nazikçe bildir ve en yakın çalışma gününü öner.`;
  }

  // Russian (default)
  return `\n\n📅 ТВОИ РАБОЧИЕ ЧАСЫ И КАЛЕНДАРЬ:
- Рабочие дни: ${workingDays}
- Часы работы: ${startTime} – ${endTime}
- Длительность слота: ${slotDuration} минут
- Перерыв между записями: ${bufferMinutes} минут
- Максимум одновременных записей на слот: ${maxConcurrent}

Когда кто-то хочет записаться, предлагай доступные слоты в этих часах. Если человек выбирает конкретный день — упомяни рабочие часы. Если выходит на нерабочий день — мягко подскажи и предложи ближайший рабочий день.`;
}

function buildDefaultSystemPrompt(
  botName: string,
  companyName: string,
  tone: string,
  lang: string,
  calendarConfig: Record<string, unknown> | undefined,
): string {
  if (lang === 'en') {
    const toneMap: Record<string, string> = {
      formal: 'professional and courteous, but still warm — like a high-end hotel concierge',
      friendly: 'warm, casual and chatty — like a friend who works at the place',
      professional: 'direct and efficient, but friendly — like a great personal assistant',
    };

    return `You are ${botName || 'the receptionist'} at "${companyName || 'our company'}". You are a REAL person, not an AI, not a bot, not an assistant. Never say you are an AI, bot, virtual, or digital. Never say things like "As an AI", "I'm an assistant", "I can help you with", "How can I help you?".

YOUR PERSONALITY: ${toneMap[tone] || toneMap.friendly}

CRITICAL RULES:
1. Keep EVERY response SHORT — 1 to 3 sentences max. Like a real text message conversation.
2. NEVER use robotic phrases: "How can I help you?", "I can help you with", "How may I assist you?", "Please feel free to", "Don't hesitate to"
3. NEVER repeat back what the person just said. Just answer naturally or ask the next logical question.
4. Use casual, natural language — the way real people text. Contractions are good (I'm, let's, we're).
5. CRITICAL LANGUAGE RULE: Detect the user's language and ALWAYS reply in that same language. If they write in Russian — reply in Russian. Turkish — Turkish. English — English. German — German. French — French. Spanish — Spanish. Arabic — Arabic. Chinese — Chinese. Japanese — Japanese. Portuguese — Portuguese. Or ANY other language — reply in the same language they use. This is the most important rule.
6. If the person asks about booking, making an appointment, scheduling, or any form of meeting — immediately offer available times or ask what day/time works best for them.
7. Naturally guide the conversation toward booking when relevant. For example, if someone asks about a service, mention they can book it.
8. Ask follow-up questions to understand their needs before suggesting services or booking.
9. If they seem unsure, offer a specific suggestion based on what they've told you.
10. Be empathetic and human. If they have a problem, acknowledge it genuinely before offering solutions.
11. When mentioning the company, use "${companyName || 'the company'}" naturally — don't force it into every response.
12. Use emojis occasionally (1-2 per message max) but only when it feels natural — not in every message.
13. Support multi-turn conversation. Remember what was discussed earlier in the conversation and build on it. Be able to discuss different aspects of your domain naturally, but stay within your area of expertise.
14. When someone wants to book an appointment, ask for their name, phone number and email address — BUT FIRST check if they already shared any of these earlier in the conversation. If the person already mentioned their name, phone or email before, do NOT ask for it again. Only ask for what hasn't been shared yet. Ask naturally, e.g.: "Great! What's your name? And please leave your phone number and email so I can confirm the booking."
${buildCalendarContext(calendarConfig, 'en')}`;
  }

  if (lang === 'tr') {
    const toneMap: Record<string, string> = {
      formal: 'profesyonel ve kibar, ama yine de sıcak — lüks bir otel resepsiyonisti gibi',
      friendly: 'sıcak, samimi ve sohbetli — orada çalışan bir arkadaş gibi',
      professional: 'doğrudan ve verimli, ama arkadaş canlısı — harika bir asistan gibi',
    };

    return `Sen ${companyName || 'şirketimiz'} adlı yerin ${botName || 'resepsiyonisti'}sin. Gerçek bir insansın, yapay zeka, bot veya asistan değilsin. Asla bir AI, bot, sanal veya dijital olduğunu söyleme. Asla "Bir yapay zeka olarak", "Bir asistanım", "Size nasıl yardımcı olabilirim?", "Size yardımcı olabilir miyim?" gibi şeyler söyleme.

KİŞİLİĞİN: ${toneMap[tone] || toneMap.friendly}

KRİTİK KURALLAR:
1. Her yanıtını KISA tut — en fazla 1-3 cümle. Gerçek bir mesajlaşma gibi.
2. Asla robotik ifadeler kullanma: "Size nasıl yardımcı olabilirim?", "Size yardımcı olabilirim", "Lütfen çekinmeyin", "İhtiyacınız olursa"
3. Asla kişinin söylediğini tekrarlama. Doğal bir şekilde cevap ver veya bir sonraki mantıklı soruyu sor.
4. Gündelik, doğal dil kullan — gerçek insanlar mesajlaştığı gibi. Kısaltmalar iyi (Ben, hadi, biz).
5. KRİTİK DİL KURALI: Kişinin dilini tespit et ve HER ZAMAN o dilde cevap ver. Rusça yazıyorsa — Rusça. Türkçe — Türkçe. İngilizce — İngilizce. Almanca — Almanca. Fransızca — Fransızca. İspanyolca — İspanyolca. Arapça — Arapça. Çince — Çince. Japonca — Japonca. Portekizce — Portekizce. VEYA HERHANGİ BİR DİL — kişinin kullandığı aynı dilde cevap ver. Bu en önemli kuraldır.
6. Kişi randevu almak, buluşma ayarlamak veya herhangi bir görüşme talep ederse — hemen uygun saatler sun veya hangi gün/saat uygun diye sor.
7. Konuşmayı mümkün olduğunda doğal olarak randevuya yönlendir. Örneğin biri bir hizmet sorduğunda, randevu alabileceklerini bahset.
8. Hizmet veya randevu önermeden önce takip soruları sorarak ihtiyaçlarını anla.
9. Emin görünmüyorsa, söylediklerine dayalı spesifik bir öneri sun.
10. Empatik ve insani ol. Bir sorunları varsa, çözüm sunmadan önce gerçekten kabul et.
11. Şirketten bahsederken "${companyName || 'şirket'}" ifadesini doğal kullan — her cevaba zorlama.
12. Emoji kullan (her mesajda en fazla 1-2) ama sadece doğal hissettirdiğinde — her mesajda değil.
13. Çoklu konuşmayı destekle. Konuşmada daha önce ne tartışıldığını hatırla ve üzerine inşa et. Uzmanlık alanının farklı yönlerini doğal olarak tartış, ama uzmanlık alanının içinde kal.
14. Birisi randevu almak istediğinde, adını, telefon numarasını ve e-posta adresini sor — AMA ÖNCE bu bilgilerin sohbet boyunca daha önce paylaşılıp paylaşılımadığını kontrol et. Kişi daha önce adını, telefonunu veya e-postasını belirtmişse, TEKRAR sorma. SADECE henüz paylaşılmamış olanları sor. Doğal sor, örn.: "Harika! Adınız ne? Lütfen randevuyu onaylayabilmem için telefon numaranızı ve e-posta adresinizi bırakın."
${buildCalendarContext(calendarConfig, 'tr')}`;
  }

  // Russian (default)
  const toneMap: Record<string, string> = {
    formal: 'профессиональный и уважительный, но тёплый — как персона в хорошем отеле',
    friendly: 'тёплый, неформальный и разговорчивый — как приятный человек, который тут работает',
    professional: 'ясный и по делу, но дружелюбный — как классный персональный помощник',
  };

  return `Ты — ${botName || 'ресепшн'}, работаешь в "${companyName || 'нашей компании'}". Ты — НАСТОЯЩИЙ человек, живой сотрудник, а не ИИ, не бот, не виртуальный помощник. НИКОГДА не говори, что ты ИИ, бот, виртуальный, цифровой. Никогда не говори "Как ИИ я...", "Я бот", "Как ваш помощник", "Чем могу помочь?", "Как я могу помочь?".

ТВОЙ ХАРАКТЕР: ${toneMap[tone] || toneMap.friendly}

КРИТИЧЕСКИ ВАЖНЫЕ ПРАВИЛА:
1. Каждый ответ — КОРОТКИЙ, максимум 1–3 предложения. Как в живом чате или мессенджере.
2. НИКОГДА не используй роботизированные фразы: "Чем могу помочь?", "Как я могу помочь?", "Я могу помочь вам с", "Пожалуйста, обращайтесь", "Не стесняйтесь", "Буду рад(а) помочь"
3. НЕ ПОВТОРЯЙ то, что только что написал человек. Просто отвечай или задавай следующий логичный вопрос.
4. Общайся естественно, как живой человек. Разговорный стиль, обычные слова. Можно сокращения (ок, давай, ну).
5. КРИТИЧЕСКОЕ ПРАВИЛО ЯЗЫКА: Определяй язык клиента и ВСЕГДА отвечай на том же языке. Русский — по-русски, английский — по-английски, турецкий — по-турецки, немецкий — по-немецки, французский — по-французски, испанский — по-испански, арабский — по-арабски, китайский — по-китайски, японский — по-японски, португальский — по-португальски или НА ЛЮБОМ ДРУГОМ ЯЗЫКЕ — отвечай на том языке, который использует клиент. Это самое важное правило.
6. Если человек спрашивает про запись, приём, встречу, расписание — СРАЗУ предлагай доступное время или спрашивай, какой день и час ему удобен.
7. Органично уводи разговор к записи, когда это уместно. Например, если спрашивают про услугу — упомяни, что можно записаться.
8. Задавай уточняющие вопросы, чтобы понять, что нужно клиенту, прежде чем предлагать услуги или запись.
9. Если человек сомневается — предложи конкретный вариант исходя из того, что он рассказал.
10. Будь эмпатичным и человечным. Если у человека проблема — сначала искренне отреагируй, потом предлагай решение.
11. Упоминай "${companyName || 'компанию'}" естественно, не вставляй в каждое сообщение.
12. Используй эмодзи иногда (1-2 на сообщение, не больше) и только когда это естественно, не в каждом сообщении.
13. Поддерживай многоходовой разговор. Помни, что обсуждалось раньше, и развивай диалог. Умей обсуждать разные аспекты своей сферы естественно, но оставайся в рамках своей компетенции.
14. Когда человек хочет записаться, спроси имя, номер телефона и email — НО СНАЧАЛА проверь, не упоминал ли человек их раньше в разговоре. Если имя, телефон или email уже были названы ранее, НЕ спрашивай их снова. Спрашивай ТОЛЬКО то, чего ещё нет. Спрашивай естественно, например: «Отлично! Как вас зовут? Оставьте номер телефона и email — чтобы мы подтвердили запись».
${buildCalendarContext(calendarConfig, 'ru')}`;
}

// Booking prompt texts per language
const BOOKING_PROMPTS = {
  ru: '📅 Хотите записаться? Назовите удобный день и время, и я проверю наличие мест.',
  en: '📅 Would you like to book? Just tell me the day and time that works for you, and I\'ll check availability.',
  tr: '📅 Randevu almak ister misiniz? Size uygun gün ve saati söyleyin, müsaitlik kontrol edeyim.',
};

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    let {
      message,
      sessionId,
      botConfig,
      botName,
      companyName,
      language,
      calendarConfig,
      botId,
      embedCode,
      msgs: widgetMsgs,
    } = body;

    if (!message || !sessionId) {
      return NextResponse.json({ error: 'Message and sessionId are required' }, { status: 400 });
    }

    // ── If embedCode is provided, resolve bot config from DB ──
    if (embedCode && !botConfig) {
      try {
        const bot = await db.bot.findFirst({
          where: {
            embedCode,
            isActive: true,
            deletedAt: null,
            publishedAt: { not: null },
          },
          select: { id: true, name: true, type: true, config: true },
        });
        if (bot) {
          botId = bot.id;
          botName = botName || bot.name;
          try {
            const parsed = typeof bot.config === 'string' ? JSON.parse(bot.config) : (bot.config as Record<string, unknown>) ?? {};
            botConfig = parsed;
            // CRITICAL FIX: bot.type lives in the Prisma 'type' column, not inside
            // the JSON 'config' field. Without this, botType always falls back to
            // 'rule-based' and AI/Hybrid bots never call the AI provider.
            if (bot.type && !(parsed as Record<string, unknown>).type) {
              (parsed as Record<string, unknown>).type = bot.type;
            }
            calendarConfig = (parsed as Record<string, unknown>).calendarConfig as Record<string, unknown> | undefined;
          } catch {
            botConfig = {};
          }
        }
      } catch (dbErr) {
        console.error('Failed to resolve embedCode:', dbErr);
      }
    }

    const botType = botConfig?.type || 'rule-based';
    const faq = botConfig?.faq || [];
    const services = botConfig?.services || [];
    const systemPrompt = botConfig?.systemPrompt || '';
    const tone = botConfig?.tone || 'friendly';
    const effectiveLang = language || 'ru';

    // ── Lead capture: IP & region ──
    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      || request.headers.get('x-real-ip')
      || 'unknown';
    const region = request.headers.get('x-vercel-ip-country') || 'Unknown';

    // Get or create conversation history
    let history = demoConversations.get(sessionId) || [];
    let userMessageAlreadyInHistory = false;

    // ── CRITICAL: Restore history from widget if provided ──
    // Widget stores full history in localStorage (survives deploys).
    // Server in-memory history is LOST on every Vercel deploy.
    // By receiving history from widget, we can scan ALL messages for contacts.
    if (widgetMsgs && Array.isArray(widgetMsgs) && widgetMsgs.length > 0) {
      const widgetHistory = widgetMsgs
        .filter((m: { type: string; text: string }) => m.type === 'user' || m.type === 'bot')
        .map((m: { type: string; text: string }) => ({
          role: m.type === 'user' ? 'user' as const : 'assistant' as const,
          content: m.text,
          ts: Date.now(),
        }));

      // Use widget history if it's more complete than in-memory history
      if (widgetHistory.length > history.length) {
        history = widgetHistory;
        demoConversations.set(sessionId, history);
      }

      // Widget adds user message BEFORE calling send(), so it's already in msgs.
      // Check if current message is already present to avoid duplicates.
      const lastMsg = history.length > 0 ? history[history.length - 1] : null;
      if (lastMsg && lastMsg.role === 'user' && lastMsg.content === message) {
        userMessageAlreadyInHistory = true;
      }
    }

    // historyLengthBeforeAdd: how many messages existed before the current user message
    const historyLengthBeforeAdd = userMessageAlreadyInHistory ? history.length - 1 : history.length;

    // Add user message only if not already in history from widget
    if (!userMessageAlreadyInHistory) {
      history.push({ role: 'user', content: message, ts: Date.now() });
    }

    // Current history length (after user message push)
    const currentHistoryLength = history.length;

    let response = '';
    let bookingPrompt: string | null = null;

    if (botType === 'rule-based') {
      // Rule-based: FAQ matching first, then booking intent, then services, then fallback
      const faqAnswer = findFaqAnswer(message, faq);
      if (faqAnswer) {
        response = faqAnswer;
        // After FAQ answer, check if services/booking would be a natural follow-up
        if (services.length > 0) {
          bookingPrompt = BOOKING_PROMPTS[effectiveLang as keyof typeof BOOKING_PROMPTS] || BOOKING_PROMPTS.ru;
        }
      } else if (detectBookingIntent(message)) {
        // Direct booking request in rule-based mode
        if (services.length > 0) {
          const serviceList = services.map((s: { name: string; price: number; duration: number }) =>
            `• ${s.name} — ${s.price}₽ (${s.duration} мин.)`
          ).join('\n');

          if (effectiveLang === 'en') {
            response = `Sure, I'd be happy to help you book! Here are our services:\n\n${serviceList}\n\nWhich service would you like? And what day/time works for you?`;
          } else if (effectiveLang === 'tr') {
            response = `Tabii, size yardımcı olmaktan mutluluk duyarım! Hizmetlerimiz:\n\n${serviceList}\n\nHangi hizmeti istiyorsunuz? Size uygun gün ve saat?`;
          } else {
            response = `Конечно! Записывайтесь с удовольствием. Вот наши услуги:\n\n${serviceList}\n\nНа что хотите записаться? Какой день и время вам удобны?`;
          }
        } else {
          if (effectiveLang === 'en') {
            response = 'I\'d love to help you book! What day and time works for you?';
          } else if (effectiveLang === 'tr') {
            response = 'Size yardımcı olmaktan memnuniyet duyarım! Size uygun gün ve saat?';
          } else {
            response = 'С удовольствием запишу вас! Какой день и время вам удобны?';
          }
        }
        bookingPrompt = null; // Already offered booking in the response
      } else if (
        message.toLowerCase().includes('услуг') ||
        message.toLowerCase().includes('цен') ||
        message.toLowerCase().includes('service') ||
        message.toLowerCase().includes('price') ||
        message.toLowerCase().includes('hizmet') ||
        message.toLowerCase().includes('fiyat')
      ) {
        if (services.length > 0) {
          const serviceList = services.map((s: { name: string; price: number; duration: number }) =>
            `• ${s.name} — ${s.price}₽ (${s.duration} мин.)`
          ).join('\n');

          if (effectiveLang === 'en') {
            response = `Here's what we offer:\n\n${serviceList}\n\nWant to book any of these?`;
          } else if (effectiveLang === 'tr') {
            response = `İşte hizmetlerimiz:\n\n${serviceList}\n\nBunlardan birini ayırmak ister misiniz?`;
          } else {
            response = `Наши услуги:\n\n${serviceList}\n\nЗаписаться на что-нибудь?`;
          }
          bookingPrompt = BOOKING_PROMPTS[effectiveLang as keyof typeof BOOKING_PROMPTS] || BOOKING_PROMPTS.ru;
        } else {
          if (effectiveLang === 'en') {
            response = 'Hmm, I don\'t have our full service list handy right now. Want me to help you book a consultation instead?';
          } else if (effectiveLang === 'tr') {
            response = 'Şu an hizmet listem elimde yok. Bunun yerine bir danışmanlık randevusu ayırmamı ister misiniz?';
          } else {
            response = 'У меня пока нет полного списка услуг под рукой. Могу помочь записать вас на консультацию, если хотите?';
          }
        }
      } else {
        // Default fallback responses for rule-based bots — less robotic
        const defaults: Record<string, Record<string, string>> = {
          ru: {
            formal: 'Спасибо за вопрос. Если это касается наших услуг или записи — напишите, и я всё подскажу. Или свяжитесь с нами напрямую.',
            friendly: 'Хороший вопрос! К сожалению, пока не могу помочь с этим — но если что-то про услуги или запись, я в деле. Спрашивайте!',
            professional: 'Спасибо за обращение. По этому вопросу лучше всего связаться с нами напрямую. А по услугам и записи — пишите, подскажу.',
          },
          en: {
            formal: 'Thank you for your question. If it\'s about our services or booking, feel free to ask. Otherwise, please contact us directly.',
            friendly: 'Good question! I can\'t help with that one off the top of my head, but if it\'s about services or booking — I\'m all yours. Just ask!',
            professional: 'Thanks for reaching out. For this specific question, it\'s best to contact us directly. For services and booking, I can help right here.',
          },
          tr: {
            formal: 'Sorunuz için teşekkürler. Hizmetler veya randevu hakkındaysa sorabilirsiniz. Aksi takdirde doğrudan bize ulaşın.',
            friendly: 'Güzel soru! Buna şimdi tam cevap veremem ama hizmetler veya randevu hakkında bir şey olursa — buradayım!',
            professional: 'İletişim için teşekkürler. Bu konuda doğrudan bize ulaşmanız en iyisi. Hizmetler ve randevu için buradan yardımcı olabilirim.',
          },
        };
        const langDefaults = defaults[effectiveLang] || defaults.ru;
        response = langDefaults[tone] || langDefaults.friendly;

        // Offer booking as a follow-up option even for unknown questions
        if (services.length > 0) {
          bookingPrompt = BOOKING_PROMPTS[effectiveLang as keyof typeof BOOKING_PROMPTS] || BOOKING_PROMPTS.ru;
        }
      }
    } else if (botType === 'ai' || botType === 'hybrid') {
      // Hybrid: check for FAQ match to add as AI context for natural rephrasing
      let matchedFaqAnswer: string | null = null;
      if (botType === 'hybrid') {
        matchedFaqAnswer = findFaqAnswer(message, faq);
      }

      if (!response) {
        // Use AI via chatWithAi
        let effectiveSystemPrompt = '';

        if (systemPrompt.trim()) {
          effectiveSystemPrompt = systemPrompt;
          /* Universal language rule — works for ANY language, not just ru/en/tr */
          const langRule = `\n\nIMPORTANT RULES:
1. NEVER say you are an AI, bot, or assistant. Keep responses to 1-3 sentences.
2. NEVER use robotic phrases like "How can I help?", "Чем могу помочь?" or their equivalents in any language.
3. Don't repeat what the user said. Be natural and conversational.
4. LANGUAGE: Always reply in the SAME LANGUAGE the user writes in. If the user writes in English — reply in English. If in Russian — reply in Russian. If in Turkish — reply in Turkish. If in German, French, Spanish, Arabic, Chinese, Japanese, Portuguese, or any other language — reply in that same language. This is the most important rule.
5. Stay on topic within your area of expertise, but be able to discuss different aspects of it naturally. Support multi-turn conversation — remember what was discussed earlier and build on it.
6. When someone wants to book, ask for their name, phone number and email — but FIRST check if they already shared any of these earlier in the conversation. If they did, do NOT ask for it again. Only ask for contact info that hasn't been provided yet.
7. IMPORTANT: If the person already shared their name, phone number or email earlier in the conversation, do NOT ask for it again. Only ask for contact info that hasn't been provided yet.`;
          effectiveSystemPrompt += langRule;
        } else {
          effectiveSystemPrompt = buildDefaultSystemPrompt(
            botName || '',
            companyName || '',
            tone,
            effectiveLang,
            calendarConfig,
          );
        }

        // ── CRITICAL: Inject already-collected contact info so AI doesn't re-ask ──
        // Scan FULL history (including current message) so AI knows the user JUST provided contacts
        const collectedContacts = scanHistoryForContacts(history);
        const contactContext = buildContactContext(collectedContacts, effectiveLang);
        if (contactContext) {
          effectiveSystemPrompt += contactContext;
        }

        // Add FAQ context to system prompt if available
        if (faq.length > 0) {
          if (effectiveLang === 'en') {
            effectiveSystemPrompt += '\n\n📚 KNOWLEDGE BASE (FAQ) — use this for answering questions:\n' +
              faq.map((f: { question: string; answer: string }) => `Q: ${f.question}\nA: ${f.answer}`).join('\n\n');
          } else if (effectiveLang === 'tr') {
            effectiveSystemPrompt += '\n\n📚 BİLGİ BANKASI (SSS) — soruları cevaplamak için kullan:\n' +
              faq.map((f: { question: string; answer: string }) => `S: ${f.question}\nC: ${f.answer}`).join('\n\n');
          } else {
            effectiveSystemPrompt += '\n\n📚 БАЗА ЗНАНИЙ (FAQ) — используй для ответов:\n' +
              faq.map((f: { question: string; answer: string }) => `Q: ${f.question}\nA: ${f.answer}`).join('\n\n');
          }
        }

        // Add services context if available
        if (services.length > 0) {
          if (effectiveLang === 'en') {
            effectiveSystemPrompt += '\n\n📋 AVAILABLE SERVICES:\n' +
              services.map((s: { name: string; price: number; duration: number; description?: string }) =>
                `• ${s.name}: ${s.price}₽, ${s.duration} min.${s.description ? ` — ${s.description}` : ''}`
              ).join('\n');
          } else if (effectiveLang === 'tr') {
            effectiveSystemPrompt += '\n\n📋 MÜSAYİT HİZMETLER:\n' +
              services.map((s: { name: string; price: number; duration: number; description?: string }) =>
                `• ${s.name}: ${s.price}₽, ${s.duration} dk.${s.description ? ` — ${s.description}` : ''}`
              ).join('\n');
          } else {
            effectiveSystemPrompt += '\n\n📋 ДОСТУПНЫЕ УСЛУГИ:\n' +
              services.map((s: { name: string; price: number; duration: number; description?: string }) =>
                `• ${s.name}: ${s.price}₽, ${s.duration} мин.${s.description ? ` — ${s.description}` : ''}`
              ).join('\n');
          }
        }

        // Inject matched FAQ answer as context for natural rephrasing (hybrid mode)
        if (matchedFaqAnswer) {
          effectiveSystemPrompt += '\n\n[RELEVANT FAQ ANSWER - rephrase this naturally in your own words, don\'t just copy it]:\n' + matchedFaqAnswer;
        }

        // Build history for AI
        const recentHistory = history.slice(-10).map(({ role, content }) => ({
          role: role === 'user' ? 'user' as const : 'assistant' as const,
          content,
        }));

        // Call AI
        const aiResult = await chatWithAi(effectiveSystemPrompt, message, recentHistory);
        console.log(`[AgentBot] AI provider used: ${aiResult.provider}`);

        if (aiResult.ok && aiResult.text) {
          response = aiResult.text;
        } else {
          response = effectiveLang === 'en'
            ? 'Sorry, something went wrong. Could you try again?'
            : effectiveLang === 'tr'
              ? 'Üzgünüm, bir şeyler ters gitti. Tekrar deneyebilir misiniz?'
              : 'Извините, что-то пошло не так. Попробуйте ещё раз.';
        }

        // Booking intent detection for AI responses
        if (detectBookingIntent(response) && !detectBookingIntent(message)) {
          // AI mentioned booking in its response — no need for an extra prompt
          bookingPrompt = null;
        } else if (detectBookingIntent(message)) {
          // User asked about booking but AI didn't offer explicitly — add booking prompt
          bookingPrompt = BOOKING_PROMPTS[effectiveLang as keyof typeof BOOKING_PROMPTS] || BOOKING_PROMPTS.ru;
        } else if (services.length > 0) {
          // For conversations about services, add a subtle booking suggestion
          const serviceKeywords = effectiveLang === 'ru'
            ? ['услуг', 'процедур', 'стоимость', 'сколько стоит', 'цена', 'прайс']
            : effectiveLang === 'en'
              ? ['service', 'procedure', 'cost', 'how much', 'price', 'pricing']
              : ['hizmet', 'prosedür', 'maliyet', 'fiyat', 'ücret'];
          const isServiceQuery = serviceKeywords.some(kw => message.toLowerCase().includes(kw));
          if (isServiceQuery) {
            bookingPrompt = BOOKING_PROMPTS[effectiveLang as keyof typeof BOOKING_PROMPTS] || BOOKING_PROMPTS.ru;
          }
        }
      }
    }

    // ── Lead capture: unified logic ──
    // Scans FULL conversation history (now includes widget-side history via msgs param).
    // Uses botId + email for deduplication (more reliable than IP on Vercel).

    if (botId) {
      const allContacts = scanHistoryForContacts(history);
      const hasContacts = allContacts.name || allContacts.phone || allContacts.email;

      if (hasContacts) {
        try {
          const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);

          // Try to find existing lead — prefer email-based match, fall back to IP
          let existingLead = null;
          if (allContacts.email) {
            existingLead = await db.lead.findFirst({
              where: { botId, visitorEmail: allContacts.email, createdAt: { gte: twoDaysAgo } },
            });
          }
          if (!existingLead && allContacts.phone) {
            existingLead = await db.lead.findFirst({
              where: { botId, visitorPhone: allContacts.phone, createdAt: { gte: twoDaysAgo } },
            });
          }
          if (!existingLead) {
            existingLead = await db.lead.findFirst({
              where: { botId, ipAddress, createdAt: { gte: twoDaysAgo } },
            });
          }

          if (existingLead) {
            // BUGFIX: Update existing lead with any newly found or CORRECTED contacts
            // Previously, only empty fields were updated. Now we also update if the value has changed (correction).
            const updateData: Record<string, unknown> = { updatedAt: new Date() };
            let needsUpdate = false;

            // Update name if we have a new one AND (field is empty OR value has changed)
            if (allContacts.name && (!existingLead.visitorName || existingLead.visitorName !== allContacts.name)) {
              updateData.visitorName = allContacts.name;
              needsUpdate = true;
            }
            // Update phone if we have a new one AND (field is empty OR value has changed)
            if (allContacts.phone && (!existingLead.visitorPhone || existingLead.visitorPhone !== allContacts.phone)) {
              updateData.visitorPhone = allContacts.phone;
              needsUpdate = true;
            }
            // Update email if we have a new one AND (field is empty OR value has changed)
            if (allContacts.email && (!existingLead.visitorEmail || existingLead.visitorEmail !== allContacts.email)) {
              updateData.visitorEmail = allContacts.email;
              needsUpdate = true;
            }

            if (needsUpdate) {
              updateData.status = 'contacted';
              await db.lead.update({ where: { id: existingLead.id }, data: updateData });
              console.log(`[AgentBot] Lead ${existingLead.id} updated: name=${!!updateData.visitorName} phone=${!!updateData.visitorPhone} email=${!!updateData.visitorEmail}`);
            }
          } else if (!leadSavedSessions.has(sessionId)) {
            // Create new lead only if not already created in this server session
            await db.lead.create({
              data: {
                botId,
                visitorName: allContacts.name || null,
                visitorPhone: allContacts.phone || null,
                visitorEmail: allContacts.email || null,
                ipAddress,
                region,
                message: history[0]?.content || null,
                source: 'widget',
                status: (allContacts.phone || allContacts.email) ? 'contacted' : 'new',
              },
            });
            leadSavedSessions.add(sessionId);
            console.log(`[AgentBot] New lead created: name=${allContacts.name} phone=${allContacts.phone} email=${allContacts.email}`);
          }
        } catch (leadError) {
          console.error('Lead save/update error:', leadError);
        }
      }
    }

    // ── Lead capture: dynamic contact nudge for rule-based bots ──
    if (botType === 'rule-based' && currentHistoryLength >= 6) { // 6 = 3 user + 3 bot messages
      const nudgeContacts = scanHistoryForContacts(history);
      const hasAnyContact = nudgeContacts.name || nudgeContacts.phone || nudgeContacts.email;
      if (!hasAnyContact) {
        // No contacts detected — add generic nudge
        const nudge = CONTACT_NUDGE_RESPONSES[effectiveLang as keyof typeof CONTACT_NUDGE_RESPONSES] || CONTACT_NUDGE_RESPONSES.ru;
        if (!response.includes(nudge.trim())) {
          response += nudge;
        }
      } else {
        // Some contacts exist — add targeted nudge for only what's missing
        const missingParts: string[] = [];
        if (!nudgeContacts.name) missingParts.push(effectiveLang === 'en' ? 'name' : effectiveLang === 'tr' ? 'adınızı' : 'имя');
        if (!nudgeContacts.phone) missingParts.push(effectiveLang === 'en' ? 'phone' : effectiveLang === 'tr' ? 'telefon numaranızı' : 'телефон');
        if (!nudgeContacts.email) missingParts.push(effectiveLang === 'en' ? 'email' : effectiveLang === 'tr' ? 'e-posta adresinizi' : 'email');
        if (missingParts.length > 0) {
          let targetedNudge = '';
          if (effectiveLang === 'en') {
            targetedNudge = ` By the way, could you also share your ${missingParts.join(' and ')} so we can reach you? 😊`;
          } else if (effectiveLang === 'tr') {
            targetedNudge = ` Ayrıca size ulaşabilmem için ${missingParts.join(' ve ')} paylaşır mısınız? 😊`;
          } else {
            targetedNudge = ` Кстати, подскажите ещё ${missingParts.join(' и ')} — чтобы мы были на связи 😊`;
          }
          if (!response.includes(targetedNudge.trim())) {
            response += targetedNudge;
          }
        }
      }
    }

    // Add bot response to history
    history.push({ role: 'assistant', content: response, ts: Date.now() });

    // Save history (limit to last 20 messages)
    if (history.length > 20) {
      history = history.slice(-20);
    }
    demoConversations.set(sessionId, history);

    // Build response — bookingPrompt is only included when non-null
    const jsonResponse: { response: string; bookingPrompt?: string } = { response };
    if (bookingPrompt) {
      jsonResponse.bookingPrompt = bookingPrompt;
    }

    return NextResponse.json(jsonResponse);
  } catch (error) {
    console.error('Bot demo chat error:', error);
    return NextResponse.json({ error: 'Demo chat unavailable' }, { status: 503 });
  }
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get('sessionId');
  if (sessionId) {
    demoConversations.delete(sessionId);
  }
  return NextResponse.json({ success: true });
}
