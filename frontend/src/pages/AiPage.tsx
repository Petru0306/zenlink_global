import { useEffect, useState, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChatLayout } from '../components/ai/ChatLayout';
import {
  loadConversations,
  saveConversations,
  createConversation,
  addMessage,
  appendConversation,
  deleteConversation as deleteConversationFromStorage,
  type Conversation,
} from '../lib/aiStorage';
import { sendMessage as sendAiMessage } from '../services/aiClient';

export default function AiPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<Conversation[]>(() => loadConversations());
  const [activeId, setActiveId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const initialMessageHandledRef = useRef(false);

  const activeConversation = activeId
    ? conversations.find((c) => c.id === activeId) ?? null
    : null;

  // Persist whenever conversations change
  useEffect(() => {
    saveConversations(conversations);
  }, [conversations]);

  // Initial message from Home page: create conversation, add message, trigger AI (o singură dată)
  useEffect(() => {
    const state = location.state as { initialMessage?: string } | null;
    const initialMessage = state?.initialMessage?.trim();
    if (!initialMessage || initialMessageHandledRef.current) return;
    initialMessageHandledRef.current = true;

    // Clear state so refresh doesn't re-trigger
    navigate(location.pathname, { replace: true, state: {} });

    const newConv = createConversation();
    const withUser = addMessage(newConv, 'user', initialMessage);
    setConversations((prev) => appendConversation(prev, withUser));
    setActiveId(withUser.id);
    setIsTyping(true);
    sendAiMessage(withUser.id, withUser.messages)
      .then((reply) => {
        const withAssistant = addMessage(withUser, 'assistant', reply);
        setConversations((prev) =>
          prev.map((c) => (c.id === withAssistant.id ? withAssistant : c))
        );
      })
      .catch(() => {
        const withError = addMessage(withUser, 'assistant', 'Eroare la răspuns. Încearcă din nou.');
        setConversations((prev) =>
          prev.map((c) => (c.id === withError.id ? withError : c))
        );
      })
      .finally(() => setIsTyping(false));
  }, [location.state, navigate]);

  const handleNewChat = useCallback(() => {
    const newConv = createConversation();
    setConversations((prev) => appendConversation(prev, newConv));
    setActiveId(newConv.id);
    setInput('');
  }, []);

  const handleSelectConversation = useCallback((id: string) => {
    setActiveId(id);
  }, []);

  const handleDeleteConversation = useCallback((id: string) => {
    setConversations((prev) => deleteConversationFromStorage(prev, id));
    setActiveId((current) => {
      if (current !== id) return current;
      const next = conversations.filter((c) => c.id !== id);
      return next.length > 0 ? next[0].id : null;
    });
  }, [conversations]);

  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text) return;

    let conv = activeConversation;
    if (!conv) {
      const newConv = createConversation();
      conv = addMessage(newConv, 'user', text);
      setConversations((prev) => appendConversation(prev, conv!));
      setActiveId(conv.id);
    } else {
      conv = addMessage(conv, 'user', text);
      setConversations((prev) =>
        prev.map((c) => (c.id === conv!.id ? conv! : c))
      );
    }
    setInput('');

    setIsTyping(true);
    sendAiMessage(conv.id, conv.messages)
      .then((reply) => {
        const updated = addMessage(conv!, 'assistant', reply);
        setConversations((prev) =>
          prev.map((c) => (c.id === updated.id ? updated : c))
        );
      })
      .catch(() => {
        const withError = addMessage(conv!, 'assistant', 'Eroare la răspuns. Încearcă din nou.');
        setConversations((prev) =>
          prev.map((c) => (c.id === withError.id ? withError : c))
        );
      })
      .finally(() => setIsTyping(false));
  }, [input, activeConversation, conversations]);

  return (
    <div className="min-h-screen bg-[hsl(240,10%,6%)] text-[hsl(220,12%,98%)]">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <ChatLayout
          conversations={conversations}
          activeConversation={activeConversation}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onSelectConversation={handleSelectConversation}
          onDeleteConversation={handleDeleteConversation}
          onNewChat={handleNewChat}
          isTyping={isTyping}
          input={input}
          onInputChange={setInput}
          onSend={handleSend}
        />
      </div>
    </div>
  );
}
