import { useState } from 'react';
import { Menu } from 'lucide-react';
import { ConversationList } from './ConversationList';
import { ChatWindow } from './ChatWindow';
import type { Conversation } from '../../lib/aiStorage';

type Props = {
  conversations: Conversation[];
  activeConversation: Conversation | null;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSelectConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
  onNewChat: () => void;
  isTyping: boolean;
  input: string;
  onInputChange: (value: string) => void;
  onSend: () => void;
  onOptionSelect?: (value: string, label: string) => void;
  onFreeTextSubmit?: (text: string) => void;
};

export function ChatLayout({
  conversations,
  activeConversation,
  searchQuery,
  onSearchChange,
  onSelectConversation,
  onDeleteConversation,
  onNewChat,
  isTyping,
  input,
  onInputChange,
  onSend,
  onOptionSelect,
  onFreeTextSubmit,
}: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleSelect = (id: string) => {
    onSelectConversation(id);
    setSidebarOpen(false); // close drawer on mobile after selection
  };

  const sidebarContent = (
    <ConversationList
      conversations={conversations}
      activeId={activeConversation?.id ?? null}
      searchQuery={searchQuery}
      onSearchChange={onSearchChange}
      onSelect={handleSelect}
      onDelete={onDeleteConversation}
      onNewChat={onNewChat}
    />
  );

  return (
    <div className="flex flex-col h-full w-full overflow-hidden" style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <div className="flex flex-1 min-h-0 overflow-hidden" style={{ minHeight: 0, flex: '1 1 auto', overflow: 'hidden' }}>
        {/* Mobile: sidebar as overlay / drawer */}
        <div className="md:hidden fixed inset-0 z-40 flex">
          {sidebarOpen && (
            <>
              <div
                className="absolute inset-0 bg-black/60 z-40"
                onClick={() => setSidebarOpen(false)}
                aria-hidden
              />
              <div className="relative z-50 w-72 max-w-[85vw] h-full bg-[#0a0e1a]/95 backdrop-blur-sm border-r border-white/10 shadow-xl p-4">
                {sidebarContent}
              </div>
            </>
          )}
        </div>

        {/* Desktop: sidebar inline - Fixed, always visible */}
        <div className="hidden md:flex md:w-80 shrink-0 flex-col h-full border-r border-white/10 bg-[#0a0e1a]/60 backdrop-blur-sm p-5" style={{ flexShrink: 0 }}>
          {sidebarContent}
        </div>

        {/* Main chat area - full width, scrollable internally */}
        <div className="flex-1 flex flex-col min-w-0 w-full min-h-0 overflow-hidden" style={{ minHeight: 0, flex: '1 1 auto' }}>
          <div className="md:hidden shrink-0 flex items-center gap-2 p-2 border-b border-white/10 bg-[#0a0e1a]/60 backdrop-blur-sm">
            <button
              type="button"
              onClick={() => setSidebarOpen((o) => !o)}
              className="p-2 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10"
              aria-label={sidebarOpen ? 'Închide conversații' : 'Deschide conversații'}
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="text-white/70 text-sm">Conversații</span>
          </div>
          <div className="flex-1 min-h-0 flex flex-col overflow-hidden" style={{ minHeight: 0, flex: '1 1 auto', overflow: 'hidden' }}>
            <ChatWindow
              title={activeConversation?.title ?? 'New chat'}
              messages={activeConversation?.messages ?? []}
              isTyping={isTyping}
              input={input}
              onInputChange={onInputChange}
              onSend={onSend}
              onOptionSelect={onOptionSelect}
              onFreeTextSubmit={onFreeTextSubmit}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
