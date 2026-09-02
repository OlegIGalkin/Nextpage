interface MessageTemplates {
  useSource: string
  sourceTitle: string
  sourceSnippet: string
  sourceFallback: string
  queryMessage: string
}

const ENGLISH: MessageTemplates = {
  useSource: 'Use the source',
  sourceTitle: 'Source Title',
  sourceSnippet: 'Source Snippet',
  sourceFallback: 'Source',
  queryMessage: 'My message to you is'
}

const TEMPLATES: Record<string, MessageTemplates> = {
  en: ENGLISH,
  zh: {
    useSource: '请使用来源',
    sourceTitle: '来源标题',
    sourceSnippet: '来源摘要',
    sourceFallback: '来源',
    queryMessage: '我要对你说的是'
  },
  es: {
    useSource: 'Usa la fuente',
    sourceTitle: 'Título de la fuente',
    sourceSnippet: 'Fragmento de la fuente',
    sourceFallback: 'Fuente',
    queryMessage: 'Mi mensaje para ti es'
  },
  hi: {
    useSource: 'स्रोत का उपयोग करें',
    sourceTitle: 'स्रोत शीर्षक',
    sourceSnippet: 'स्रोत अंश',
    sourceFallback: 'स्रोत',
    queryMessage: 'मेरा संदेश यह है'
  },
  ar: {
    useSource: 'استخدم المصدر',
    sourceTitle: 'عنوان المصدر',
    sourceSnippet: 'مقتطف المصدر',
    sourceFallback: 'مصدر',
    queryMessage: 'رسالتي إليك هي'
  },
  pt: {
    useSource: 'Use a fonte',
    sourceTitle: 'Título da fonte',
    sourceSnippet: 'Trecho da fonte',
    sourceFallback: 'Fonte',
    queryMessage: 'Minha mensagem para você é'
  },
  ru: {
    useSource: 'Используй источник',
    sourceTitle: 'Название источника',
    sourceSnippet: 'Фрагмент источника',
    sourceFallback: 'Источник',
    queryMessage: 'Моё сообщение тебе'
  },
  ja: {
    useSource: '情報源を使用してください',
    sourceTitle: '情報源のタイトル',
    sourceSnippet: '情報源の抜粋',
    sourceFallback: '情報源',
    queryMessage: 'あなたへのメッセージは'
  },
  fr: {
    useSource: 'Utilise la source',
    sourceTitle: 'Titre de la source',
    sourceSnippet: 'Extrait de la source',
    sourceFallback: 'Source',
    queryMessage: 'Mon message pour toi est'
  },
  de: {
    useSource: 'Verwende die Quelle',
    sourceTitle: 'Quelltitel',
    sourceSnippet: 'Quellenauszug',
    sourceFallback: 'Quelle',
    queryMessage: 'Meine Nachricht an dich ist'
  },
  ko: {
    useSource: '출처를 사용하세요',
    sourceTitle: '출처 제목',
    sourceSnippet: '출처 발췌',
    sourceFallback: '출처',
    queryMessage: '내 메시지는'
  },
  it: {
    useSource: 'Usa la fonte',
    sourceTitle: 'Titolo della fonte',
    sourceSnippet: 'Estratto della fonte',
    sourceFallback: 'Fonte',
    queryMessage: 'Il mio messaggio per te è'
  },
  tr: {
    useSource: 'Kaynağı kullan',
    sourceTitle: 'Kaynak başlığı',
    sourceSnippet: 'Kaynak alıntısı',
    sourceFallback: 'Kaynak',
    queryMessage: 'Sana mesajım'
  },
  id: {
    useSource: 'Gunakan sumber',
    sourceTitle: 'Judul sumber',
    sourceSnippet: 'Cuplikan sumber',
    sourceFallback: 'Sumber',
    queryMessage: 'Pesan saya kepada Anda adalah'
  },
  vi: {
    useSource: 'Sử dụng nguồn',
    sourceTitle: 'Tiêu đề nguồn',
    sourceSnippet: 'Đoạn trích nguồn',
    sourceFallback: 'Nguồn',
    queryMessage: 'Tin nhắn của tôi gửi bạn là'
  },
  pl: {
    useSource: 'Użyj źródła',
    sourceTitle: 'Tytuł źródła',
    sourceSnippet: 'Fragment źródła',
    sourceFallback: 'Źródło',
    queryMessage: 'Moja wiadomość do Ciebie to'
  },
  nl: {
    useSource: 'Gebruik de bron',
    sourceTitle: 'Brontitel',
    sourceSnippet: 'Bronfragment',
    sourceFallback: 'Bron',
    queryMessage: 'Mijn bericht aan jou is'
  },
  th: {
    useSource: 'ใช้แหล่งข้อมูล',
    sourceTitle: 'ชื่อแหล่งข้อมูล',
    sourceSnippet: 'ข้อความจากแหล่งข้อมูล',
    sourceFallback: 'แหล่งข้อมูล',
    queryMessage: 'ข้อความของฉันถึงคุณคือ'
  },
  uk: {
    useSource: 'Використовуй джерело',
    sourceTitle: 'Назва джерела',
    sourceSnippet: 'Фрагмент джерела',
    sourceFallback: 'Джерело',
    queryMessage: 'Моє повідомлення тобі'
  },
  bn: {
    useSource: 'উৎস ব্যবহার করুন',
    sourceTitle: 'উৎসের শিরোনাম',
    sourceSnippet: 'উৎসের অংশ',
    sourceFallback: 'উৎস',
    queryMessage: 'আমার বার্তা হলো'
  },
  ur: {
    useSource: 'ماخذ استعمال کریں',
    sourceTitle: 'ماخذ کا عنوان',
    sourceSnippet: 'ماخذ کا اقتباس',
    sourceFallback: 'ماخذ',
    queryMessage: 'میرا پیغام یہ ہے'
  },
  fa: {
    useSource: 'از منبع استفاده کن',
    sourceTitle: 'عنوان منبع',
    sourceSnippet: 'گزیده منبع',
    sourceFallback: 'منبع',
    queryMessage: 'پیام من به تو این است'
  }
}

function templatesFor(languageId?: string): MessageTemplates {
  return (languageId && TEMPLATES[languageId]) || ENGLISH
}

export function formatSourceBlock(
  title: string,
  snippet: string,
  url: string,
  languageId?: string,
  options?: { includeTitle?: boolean; includeSnippet?: boolean }
): string {
  const t = templatesFor(languageId)
  const includeTitle = options?.includeTitle !== false
  const includeSnippet = options?.includeSnippet !== false
  const lines = [`\n${t.useSource}: ${url}`]
  if (includeTitle) {
    const safeTitle = title.replace(/\s+/g, ' ').trim() || t.sourceFallback
    lines.push(`${t.sourceTitle}: "${safeTitle}"`)
  }
  if (includeSnippet) {
    const safeSnippet = snippet.replace(/\s+/g, ' ').trim()
    if (safeSnippet) lines.push(`${t.sourceSnippet}: "${safeSnippet}"`)
  }
  return `${lines.join('\n')}\n`
}

export function formatQueryMessage(query: string, languageId?: string): string {
  const safeQuery = query.replace(/\s+/g, ' ').trim()
  if (!safeQuery) return ''
  const t = templatesFor(languageId)
  return `\n${t.queryMessage}: ${safeQuery}\n`
}
