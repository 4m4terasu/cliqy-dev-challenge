import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import type {
  ClassifyRequest,
  ClassifyResponse,
  MessageCategory,
  MessagePriority,
} from '@/types'

const DEFAULT_MODEL = 'gemini-3.5-flash'
const MAX_TOKENS = 300
const REQUEST_TIMEOUT_MS = 45_000
const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta/openai/'

const CATEGORIES = ['zamówienie', 'pytanie', 'reklamacja', 'spam'] as const
const PRIORITIES = ['high', 'medium', 'low'] as const

function isCategory(value: unknown): value is MessageCategory {
  return typeof value === 'string' && CATEGORIES.some((category) => category === value)
}

function isPriority(value: unknown): value is MessagePriority {
  return typeof value === 'string' && PRIORITIES.some((priority) => priority === value)
}

function parseClassification(content: string): ClassifyResponse | null {
  let parsed: unknown

  try {
    parsed = JSON.parse(content)
  } catch {
    return null
  }

  if (!parsed || typeof parsed !== 'object') {
    return null
  }

  const result = parsed as Record<string, unknown>
  const rawDraftReply = typeof result.draft_reply === 'string' ? result.draft_reply.trim() : ''
  const draftReply =
    rawDraftReply || (result.category === 'spam' ? 'Brak odpowiedzi - wiadomość oznaczona jako spam.' : '')

  if (
    !isCategory(result.category) ||
    !isPriority(result.priority) ||
    !draftReply ||
    typeof result.confidence !== 'number' ||
    !Number.isFinite(result.confidence) ||
    result.confidence < 0 ||
    result.confidence > 1
  ) {
    return null
  }

  return {
    category: result.category,
    priority: result.priority,
    draft_reply: draftReply,
    confidence: result.confidence,
  }
}

export async function POST(req: Request): Promise<NextResponse<ClassifyResponse | { error: string }>> {
  let body: Partial<ClassifyRequest>

  try {
    body = (await req.json()) as Partial<ClassifyRequest>
  } catch {
    return NextResponse.json({ error: 'Nieprawidłowy format JSON.' }, { status: 400 })
  }

  const message = typeof body.message === 'string' ? body.message.trim() : ''
  const company = typeof body.company === 'string' ? body.company.trim() : ''

  if (!message) {
    return NextResponse.json({ error: 'Wiadomość jest wymagana.' }, { status: 400 })
  }

  if (!company) {
    return NextResponse.json({ error: 'Nazwa firmy jest wymagana.' }, { status: 400 })
  }

  const apiKey = process.env.GEMINI_API_KEY

  if (!apiKey) {
    return NextResponse.json({ error: 'Brak konfiguracji klucza Gemini API.' }, { status: 500 })
  }

  const client = new OpenAI({
    apiKey,
    baseURL: GEMINI_BASE_URL,
    maxRetries: 1,
    timeout: REQUEST_TIMEOUT_MS,
  })

  try {
    const completionRequest = {
      model: process.env.GEMINI_MODEL || DEFAULT_MODEL,
      max_tokens: MAX_TOKENS,
      temperature: 0.2,
      response_format: { type: 'json_object' as const },
      extra_body: {
        google: {
          thinking_config: {
            thinking_level: 'minimal',
          },
        },
      },
      messages: [
        {
          role: 'system' as const,
          content: [
            'Jesteś asystentem obsługi klienta polskich firm.',
            'Klasyfikuj wiadomości klientów i przygotowuj gotowy szkic odpowiedzi po polsku.',
            'Zwróć wyłącznie poprawny JSON bez Markdownu.',
            'JSON musi zawierać dokładnie pola: category, priority, draft_reply, confidence.',
            'category: jedno z "zamówienie", "pytanie", "reklamacja", "spam".',
            'priority: jedno z "high", "medium", "low".',
            'confidence: liczba od 0 do 1.',
            'draft_reply: krótka, pomocna odpowiedź dopasowana tonem do firmy i kategorii.',
            'Dla kategorii spam ustaw draft_reply na "Brak odpowiedzi - wiadomość oznaczona jako spam.".',
            'Nie wymyślaj faktów, których nie ma w wiadomości, takich jak godziny otwarcia, rabaty lub status wysyłki.',
            'Jeśli brakuje danych potrzebnych do odpowiedzi, poproś klienta o uzupełnienie informacji.',
          ].join(' '),
        },
        {
          role: 'user' as const,
          content: `Firma: ${company}\nWiadomość klienta: ${message}`,
        },
      ],
    }
    const completion = await client.chat.completions.create(completionRequest)

    const content = completion.choices[0]?.message.content
    const classification = content ? parseClassification(content) : null

    if (!classification) {
      return NextResponse.json({ error: 'Model zwrócił nieprawidłową odpowiedź.' }, { status: 502 })
    }

    return NextResponse.json(classification)
  } catch {
    return NextResponse.json({ error: 'Nie udało się sklasyfikować wiadomości.' }, { status: 502 })
  }
}
