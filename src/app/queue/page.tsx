'use client'

import { useState } from 'react'
import type {
  MessageCategory,
  MessagePriority,
  MessageStatus,
  QueueItem,
} from '@/types'

const SEED_ITEMS: QueueItem[] = [
  {
    id: '1',
    message: 'Dzień dobry, chciałbym zamówić 50 sztuk produktu X. Czy możliwy jest rabat przy takiej ilości?',
    company: 'Sklep meblowy Premium',
    category: 'zamówienie',
    priority: 'high',
    draft_reply:
      'Dzień dobry! Dziękujemy za zainteresowanie naszą ofertą. Przy zamówieniu 50 sztuk produktu X przysługuje rabat 15%. Czy mogę poprosić o dane do wyceny?',
    confidence: 0.94,
    status: 'pending',
    created_at: new Date().toISOString(),
  },
  {
    id: '2',
    message: 'Kiedy przyjedzie moja paczka? Zamówiłam tydzień temu i nic.',
    company: 'Sklep meblowy Premium',
    category: 'reklamacja',
    priority: 'high',
    draft_reply:
      'Przepraszamy za niedogodności. Proszę o numer zamówienia - sprawdzimy status wysyłki i wrócimy do Pani w ciągu 2 godzin.',
    confidence: 0.91,
    status: 'pending',
    created_at: new Date(Date.now() - 120_000).toISOString(),
  },
  {
    id: '3',
    message: 'Jakie są godziny otwarcia w weekend?',
    company: 'Sklep meblowy Premium',
    category: 'pytanie',
    priority: 'low',
    draft_reply: 'Jesteśmy otwarci w soboty w godz. 10:00-18:00. W niedziele sklep jest nieczynny.',
    confidence: 0.98,
    status: 'pending',
    created_at: new Date(Date.now() - 300_000).toISOString(),
  },
]

const CATEGORIES = ['all', 'zamówienie', 'pytanie', 'reklamacja', 'spam'] as const

const CATEGORY_STYLES: Record<MessageCategory, string> = {
  zamówienie: 'bg-emerald-900/40 text-emerald-400 border border-emerald-700/40',
  pytanie: 'bg-blue-900/40 text-blue-400 border border-blue-700/40',
  reklamacja: 'bg-red-900/40 text-red-400 border border-red-700/40',
  spam: 'bg-zinc-800 text-zinc-500 border border-zinc-700',
}

const PRIORITY_DOT: Record<MessagePriority, string> = {
  high: 'bg-red-400',
  medium: 'bg-amber-400',
  low: 'bg-zinc-500',
}

export default function QueuePage() {
  const [items, setItems] = useState<QueueItem[]>(SEED_ITEMS)
  const [filter, setFilter] = useState<MessageCategory | 'all'>('all')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editedReply, setEditedReply] = useState('')

  function handleAction(id: string, status: MessageStatus) {
    setItems((currentItems) =>
      currentItems.map((item) => (item.id === id ? { ...item, status } : item)),
    )
    setEditingId(null)
  }

  function handleStartEditing(item: QueueItem) {
    setEditingId(item.id)
    setEditedReply(item.draft_reply)
  }

  function handleEditReply(id: string) {
    const reply = editedReply.trim()

    if (!reply) {
      return
    }

    setItems((currentItems) =>
      currentItems.map((item) => (item.id === id ? { ...item, draft_reply: reply } : item)),
    )
    setEditingId(null)
  }

  const visible = filter === 'all' ? items : items.filter((item) => item.category === filter)
  const pending = items.filter((item) => item.status === 'pending').length

  return (
    <main className="min-h-screen p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <p className="text-xs uppercase tracking-widest text-zinc-500 mb-1">Cliqy Studio</p>
        <h1 className="text-2xl font-bold text-zinc-100">Panel weryfikacji</h1>
        <p className="text-zinc-400 mt-1 text-sm">
          {pending} oczekujących · {items.length} łącznie
        </p>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {CATEGORIES.map((category) => (
          <button
            key={category}
            type="button"
            onClick={() => setFilter(category)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              filter === category
                ? 'bg-white text-black'
                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
            }`}
          >
            {category === 'all' ? 'Wszystkie' : category}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-4">
        {visible.length === 0 && (
          <p className="text-zinc-500 text-sm py-12 text-center">Brak elementów w tej kategorii.</p>
        )}

        {visible.map((item) => (
          <article
            key={item.id}
            className={`rounded-xl border p-5 transition-opacity ${
              item.status !== 'pending' ? 'opacity-50' : ''
            }`}
            style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
          >
            <div className="flex items-start justify-between gap-4 mb-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_STYLES[item.category]}`}>
                  {item.category}
                </span>
                <span className="flex items-center gap-1 text-xs text-zinc-500">
                  <span className={`w-1.5 h-1.5 rounded-full ${PRIORITY_DOT[item.priority]}`} />
                  {item.priority}
                </span>
                <span className="text-xs text-zinc-600">{item.company}</span>
              </div>
              <span className="text-xs text-zinc-600 shrink-0">
                {new Date(item.created_at).toLocaleTimeString('pl-PL', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>

            <div className="mb-3">
              <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">Wiadomość</p>
              <p className="text-sm text-zinc-200">{item.message}</p>
            </div>

            <div className="mb-4 p-3 rounded-lg bg-zinc-900/60 border border-zinc-800">
              <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">
                Draft AI · {Math.round(item.confidence * 100)}% pewności
              </p>
              {editingId === item.id ? (
                <textarea
                  aria-label={`Edytuj draft dla wiadomości ${item.id}`}
                  value={editedReply}
                  onChange={(event) => setEditedReply(event.target.value)}
                  rows={4}
                  className="w-full resize-y rounded-md border border-zinc-700 bg-zinc-950 p-2 text-sm text-zinc-200 outline-none focus:border-zinc-500"
                />
              ) : (
                <p className="text-sm text-zinc-300">{item.draft_reply}</p>
              )}
            </div>

            {item.status === 'pending' && (
              <div className="flex gap-2 flex-wrap">
                {editingId === item.id ? (
                  <>
                    <button
                      type="button"
                      onClick={() => handleEditReply(item.id)}
                      disabled={!editedReply.trim()}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-900/40 text-blue-400 border border-blue-700/40 hover:bg-blue-800/50 transition-colors disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Zapisz
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-800 text-zinc-300 border border-zinc-700 hover:bg-zinc-700 transition-colors"
                    >
                      Anuluj
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => handleAction(item.id, 'approved')}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-900/40 text-emerald-400 border border-emerald-700/40 hover:bg-emerald-800/50 transition-colors"
                    >
                      ✓ Zatwierdź
                    </button>
                    <button
                      type="button"
                      onClick={() => handleStartEditing(item)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-800 text-zinc-300 border border-zinc-700 hover:bg-zinc-700 transition-colors"
                    >
                      Edytuj
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAction(item.id, 'rejected')}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-900/40 text-red-400 border border-red-700/40 hover:bg-red-800/50 transition-colors"
                    >
                      ✕ Odrzuć
                    </button>
                  </>
                )}
              </div>
            )}

            {item.status !== 'pending' && (
              <p className="text-xs text-zinc-600 italic">
                {item.status === 'approved' ? '✓ Zatwierdzone' : '✕ Odrzucone'}
              </p>
            )}
          </article>
        ))}
      </div>
    </main>
  )
}
