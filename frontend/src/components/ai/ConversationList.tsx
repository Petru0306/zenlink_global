import { Search, Trash2 } from 'lucide-react';
import type { Conversation } from '../../lib/aiStorage';

type Props = {
  conversations: Conversation[];
  activeId: string | null;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onNewChat: () => void;
};

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 60 * 60 * 1000) return 'Acum';
    if (diff < 24 * 60 * 60 * 1000) return d.toLocaleTimeString('ro-RO', { hour: '2-digit', minute: '2-digit' });
    return d.toLocaleDateString('ro-RO', { day: 'numeric', month: 'short' });
  } catch {
    return '';
  }
}

export function ConversationList({
  conversations,
  activeId,
  searchQuery,
  onSearchChange,
  onSelect,
  onDelete,
  onNewChat,
}: Props) {
  const filtered = searchQuery.trim()
    ? conversations.filter(
        (c) =>
          c.title.toLowerCase().includes(searchQuery.toLowerCase().trim())
      )
    : conversations;

  return (
    <div className="flex flex-col h-full">
      <button
        type="button"
        onClick={onNewChat}
        className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 text-white font-medium text-sm mb-3 transition-colors"
      >
        <span className="text-lg leading-none">+</span>
        Conversație nouă
      </button>

      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Caută conversații..."
          className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/[0.05] border border-white/10 text-white text-sm placeholder:text-white/30 focus:outline-none focus:border-purple-500/50"
        />
      </div>

      <div className="flex-1 overflow-auto space-y-1 pr-1">
        {filtered.length === 0 && (
          <p className="text-white/40 text-sm py-4 text-center">
            {searchQuery.trim() ? 'Nicio conversație găsită.' : 'Nicio conversație încă.'}
          </p>
        )}
        {filtered.map((c) => {
          const isActive = c.id === activeId;
          return (
            <div
              key={c.id}
              role="button"
              tabIndex={0}
              onClick={() => onSelect(c.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelect(c.id);
                }
              }}
              className={[
                'group flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm cursor-pointer transition-colors',
                isActive
                  ? 'bg-white/[0.1] border-purple-500/30 text-white'
                  : 'bg-white/[0.03] hover:bg-white/[0.06] border-white/[0.08] text-white/80 hover:text-white',
              ].join(' ')}
            >
              <span className="flex-1 truncate">{c.title || 'New chat'}</span>
              <span className="text-white/40 text-xs shrink-0">{formatDate(c.updatedAt)}</span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(c.id);
                }}
                className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-white/50 hover:text-white hover:bg-white/10 transition-opacity"
                title="Șterge conversația"
                aria-label="Șterge conversația"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
