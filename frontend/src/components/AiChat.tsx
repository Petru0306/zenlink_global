import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Plus, Trash2 } from 'lucide-react';

type ChatRole = 'user' | 'assistant';

type ChatMessage = {
  role: ChatRole;
  content: string;
};

type Props = {
  userId: string;
  userRole: 'PATIENT' | 'DOCTOR' | 'CLINIC';
  scopeType: 'GENERAL' | 'PATIENT' | 'FILE';
  scopeId?: string | null;
  title?: string;
  subtitle?: string;
  backendBaseUrl?: string;
  initialMessage?: string;
  layout?: 'split' | 'stacked';
};

function defaultBackendBaseUrl() {
  // Keep consistent with existing fetches in the dashboards.
  return 'http://localhost:8080';
}

export function AiChat({
  userId,
  userRole,
  scopeType,
  scopeId,
  title = 'Chat AI',
  subtitle = 'Pune întrebări și primește răspunsuri în timp real',
  backendBaseUrl,
  initialMessage = 'Bună! Sunt asistentul tău AI. Cu ce te pot ajuta?',
  layout = 'split',
}: Props) {
  const baseUrl = backendBaseUrl || defaultBackendBaseUrl();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [conversations, setConversations] = useState<Array<{ id: number; title: string | null }>>([]);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const canSend = useMemo(
    () => input.trim().length > 0 && !isStreaming && !!conversationId,
    [input, isStreaming, conversationId]
  );

  useEffect(() => {
    let cancelled = false;
    async function loadConversations() {
      if (!userId || !userRole) return;
      const res = await fetch(
        `${baseUrl}/api/ai/conversations?userId=${encodeURIComponent(String(Number(userId)))}&userRole=${encodeURIComponent(
          userRole
        )}&scopeType=${encodeURIComponent(scopeType)}&scopeId=${encodeURIComponent(scopeId ? String(scopeId) : '')}`
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (cancelled) return;
      const list = Array.isArray(data)
        ? data
            .filter((c: any) => c && typeof c.id === 'number')
            .map((c: any) => ({ id: c.id as number, title: typeof c.title === 'string' ? c.title : null }))
        : [];
      setConversations(list);
      if (list.length > 0) {
        setConversationId(list[0].id);
      } else {
        setConversationId(null);
        setMessages([]);
      }
    }

    loadConversations().catch((e) => {
      setConversations([]);
      setConversationId(null);
      setMessages([{ role: 'assistant', content: `Eroare la încărcarea conversațiilor: ${String(e?.message || e)}` }]);
    });

    return () => {
      cancelled = true;
    };
  }, [baseUrl, initialMessage, userId, userRole]);

  useEffect(() => {
    let cancelled = false;
    async function loadMessages() {
      if (!conversationId) return;
      const res = await fetch(
        `${baseUrl}/api/ai/conversations/${conversationId}/messages?userId=${encodeURIComponent(
          String(Number(userId))
        )}&userRole=${encodeURIComponent(userRole)}&scopeType=${encodeURIComponent(scopeType)}&scopeId=${encodeURIComponent(
          scopeId ? String(scopeId) : ''
        )}`
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (cancelled) return;
      const rows: ChatMessage[] = Array.isArray(data?.messages)
        ? data.messages
            .filter((m: any) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
            .map((m: any) => ({ role: m.role, content: m.content }))
        : [];
      setMessages(rows);
    }

    loadMessages().catch((e) => {
      setMessages([{ role: 'assistant', content: `Eroare la încărcarea istoricului: ${String(e?.message || e)}` }]);
    });

    return () => {
      cancelled = true;
    };
  }, [baseUrl, conversationId, userId, userRole]);

  async function createConversation() {
    if (!userId || !userRole) return;
    const res = await fetch(`${baseUrl}/api/ai/conversations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: Number(userId), userRole, scopeType, scopeId: scopeId ? String(scopeId) : null }),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const c = await res.json();
    const id = c?.id as number;
    setConversations((prev) => [{ id, title: typeof c?.title === 'string' ? c.title : null }, ...prev]);
    setConversationId(id);
    setMessages([]); // per requirement: new chat starts empty
  }

  async function deleteConversation(id: number) {
    if (!userId || !userRole) return;
    const res = await fetch(
      `${baseUrl}/api/ai/conversations/${id}?userId=${encodeURIComponent(String(Number(userId)))}&userRole=${encodeURIComponent(
        userRole
      )}&scopeType=${encodeURIComponent(scopeType)}&scopeId=${encodeURIComponent(scopeId ? String(scopeId) : '')}`,
      { method: 'DELETE' }
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    setConversations((prev) => prev.filter((c) => c.id !== id));
    setMessages((prev) => prev); // keep until selection changes
    setConversationId((prev) => {
      if (prev !== id) return prev;
      const remaining = conversations.filter((c) => c.id !== id);
      return remaining.length > 0 ? remaining[0].id : null;
    });
  }

  async function send() {
    const text = input.trim();
    if (!text || isStreaming || !conversationId) return;

    const nextMessages: ChatMessage[] = [
      ...messages,
      { role: 'user', content: text },
      { role: 'assistant', content: '' },
    ];
    setMessages(nextMessages);
    setInput('');
    setIsStreaming(true);

    const abort = new AbortController();
    abortRef.current = abort;

    try {
      const res = await fetch(`${baseUrl}/api/ai/chat/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          userId: Number(userId),
          userRole,
          scopeType,
          scopeId: scopeId ? String(scopeId) : null,
          userMessage: text,
        }),
        signal: abort.signal,
      });

      if (!res.ok || !res.body) {
        const errText = await res.text().catch(() => '');
        throw new Error(errText || `HTTP ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let assistantText = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        assistantText += decoder.decode(value, { stream: true });
        setMessages((prev) => {
          const copy = [...prev];
          // last message is the placeholder assistant we added
          const last = copy[copy.length - 1];
          if (last?.role === 'assistant') {
            copy[copy.length - 1] = { role: 'assistant', content: assistantText };
          }
          return copy;
        });
      }
    } catch (e: any) {
      const msg = typeof e?.message === 'string' ? e.message : 'Eroare necunoscută';
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `Eroare: ${msg}` },
      ]);
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  }

  function stop() {
    abortRef.current?.abort();
  }

  const isStacked = layout === 'stacked';

  return (
    <div className="bg-white/[0.02] rounded-2xl border border-white/[0.05] overflow-hidden">
      <div className="p-6 border-b border-white/[0.05]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-white text-xl font-semibold">{title}</h3>
            <p className="text-white/40 text-sm">{subtitle}</p>
          </div>
          <div className="flex items-center gap-2">
            {scopeType === 'PATIENT' && scopeId && (
              <button
                onClick={() => {
                  fetch(`${baseUrl}/api/ai/rag/patient/${encodeURIComponent(String(scopeId))}/index-all`, { method: 'POST' })
                    .then((r) => {
                      if (!r.ok) throw new Error(`HTTP ${r.status}`);
                      // Reload messages; indexing may take time but this triggers the job.
                    })
                    .catch(() => {});
                }}
                className="px-3 py-2 bg-white/[0.05] hover:bg-white/[0.1] text-white rounded-xl text-sm border border-white/[0.05]"
                title="Index all files for this patient"
              >
                Index all
              </button>
            )}
            <button
              onClick={() => setSidebarOpen((v) => !v)}
              className="px-3 py-2 bg-white/[0.05] hover:bg-white/[0.1] text-white rounded-xl text-sm border border-white/[0.05]"
              title={sidebarOpen ? 'Ascunde conversațiile' : 'Arată conversațiile'}
            >
              {isStacked ? (
                sidebarOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
              ) : (
                sidebarOpen ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />
              )}
            </button>
            {isStreaming && (
              <button
                onClick={stop}
                className="px-3 py-2 bg-red-500/15 hover:bg-red-500/25 text-red-200 rounded-xl border border-red-500/30 text-sm"
              >
                Stop
              </button>
            )}
          </div>
        </div>
      </div>

      <div className={isStacked ? 'p-4' : 'flex'}>
        <div className={isStacked ? '' : 'flex-1 p-6'}>
          {isStacked && sidebarOpen && (
            <div className="mb-4 bg-white/[0.02] border border-white/[0.05] rounded-xl p-3">
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="text-white/80 text-sm font-semibold">Conversații</div>
                <button
                  onClick={() =>
                    createConversation().catch((e) => {
                      setMessages([{ role: 'assistant', content: `Eroare la creare conversație: ${String(e?.message || e)}` }]);
                    })
                  }
                  className="px-2 py-2 bg-white/[0.05] hover:bg-white/[0.1] text-white rounded-xl border border-white/[0.05]"
                  title="Conversație nouă"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2 max-h-[180px] overflow-auto pr-1">
                {conversations.length === 0 && (
                  <div className="text-white/40 text-sm">Nu ai conversații încă. Apasă „+” pentru a începe.</div>
                )}
                {conversations.map((c) => {
                  const selected = c.id === conversationId;
                  return (
                    <div
                      key={c.id}
                      className={[
                        'group flex items-center gap-2 px-3 py-2 rounded-xl border text-sm cursor-pointer',
                        selected
                          ? 'bg-white/[0.08] border-white/[0.15] text-white'
                          : 'bg-white/[0.02] hover:bg-white/[0.05] border-white/[0.05] text-white/80',
                      ].join(' ')}
                      onClick={() => setConversationId(c.id)}
                    >
                      <div className="flex-1 truncate">{c.title && c.title.trim().length > 0 ? c.title : 'Conversație nouă'}</div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteConversation(c.id).catch((err) => {
                            setMessages([{ role: 'assistant', content: `Eroare la ștergere: ${String(err?.message || err)}` }]);
                          });
                        }}
                        className="opacity-0 group-hover:opacity-100 text-white/50 hover:text-white"
                        title="Șterge conversația"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="bg-white/[0.03] rounded-xl border border-white/[0.05] p-4 max-h-[420px] overflow-auto space-y-3">
            {messages.length === 0 && (
              <div className="text-white/50 text-sm">
                {conversationId ? 'Conversație goală. Scrie primul mesaj.' : 'Creează o conversație nouă din dreapta.'}
              </div>
            )}
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={[
                  'rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap',
                  m.role === 'user'
                    ? 'bg-white/[0.06] text-white ml-auto max-w-[85%]'
                    : 'bg-white/[0.04] text-white/90 mr-auto max-w-[85%]',
                ].join(' ')}
              >
                {m.content || (m.role === 'assistant' ? '…' : '')}
              </div>
            ))}
          </div>

          <div className="border-t border-white/[0.05] pt-4 mt-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') send();
                }}
                placeholder="Scrie întrebarea ta..."
                className="flex-1 bg-white/[0.05] border border-white/[0.05] rounded-xl px-4 py-2 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-blue-500"
                disabled={isStreaming || !conversationId}
              />
              <button
                onClick={send}
                disabled={!canSend}
                className={[
                  'px-4 py-2 rounded-xl text-white',
                  canSend
                    ? 'bg-gradient-to-r from-[#5B8DEF] to-[#4169E1] hover:from-[#5B8DEF]/90 hover:to-[#4169E1]/90'
                    : 'bg-white/10 text-white/40 cursor-not-allowed',
                ].join(' ')}
              >
                Trimite
              </button>
            </div>
          </div>
        </div>

        {!isStacked && sidebarOpen && (
          <div className="w-[280px] border-l border-white/[0.05] p-4 bg-white/[0.01]">
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="text-white/80 text-sm font-semibold">Conversații</div>
              <button
                onClick={() => createConversation().catch((e) => {
                  setMessages([{ role: 'assistant', content: `Eroare la creare conversație: ${String(e?.message || e)}` }]);
                })}
                className="px-2 py-2 bg-white/[0.05] hover:bg-white/[0.1] text-white rounded-xl border border-white/[0.05]"
                title="Conversație nouă"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 max-h-[520px] overflow-auto pr-1">
              {conversations.length === 0 && (
                <div className="text-white/40 text-sm">
                  Nu ai conversații încă. Apasă „+” pentru a începe.
                </div>
              )}
              {conversations.map((c) => {
                const selected = c.id === conversationId;
                return (
                  <div
                    key={c.id}
                    className={[
                      'group flex items-center gap-2 px-3 py-2 rounded-xl border text-sm cursor-pointer',
                      selected
                        ? 'bg-white/[0.08] border-white/[0.15] text-white'
                        : 'bg-white/[0.02] hover:bg-white/[0.05] border-white/[0.05] text-white/80',
                    ].join(' ')}
                    onClick={() => setConversationId(c.id)}
                  >
                    <div className="flex-1 truncate">
                      {c.title && c.title.trim().length > 0 ? c.title : 'Conversație nouă'}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteConversation(c.id).catch((err) => {
                          setMessages([
                            { role: 'assistant', content: `Eroare la ștergere: ${String(err?.message || err)}` },
                          ]);
                        });
                      }}
                      className="opacity-0 group-hover:opacity-100 text-white/50 hover:text-white"
                      title="Șterge conversația"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


