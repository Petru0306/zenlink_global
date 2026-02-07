import { useEffect, useState, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ChatLayout } from '../components/ai/ChatLayout';
import {
  loadConversations,
  saveConversations,
  createConversation,
  addMessage,
  updateLastAssistantMessage,
  appendConversation,
  deleteConversation as deleteConversationFromStorage,
  autoTitleConversation,
  type Conversation,
} from '../lib/aiStorage';
import { sendMessageStreaming } from '../services/aiClient';
import {
  determineNextTriageState,
  updateTriageContext,
  isConclusionMessage,
} from '../lib/triageLogic';
import { parseAiTurn, isStructuredResponse } from '../lib/aiTurn';

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
    const state = location.state as { 
      initialMessage?: string;
      previewQuestion?: string;
      previewAnswer?: string;
    } | null;
    
    const initialMessage = state?.initialMessage?.trim();
    if (!initialMessage || initialMessageHandledRef.current) return;
    initialMessageHandledRef.current = true;

    // Clear state so refresh doesn't re-trigger
    navigate(location.pathname, { replace: true, state: {} });

    const newConv = createConversation();
    
    // If coming from preview widget, format message nicely with context for next question
    let formattedMessage = initialMessage;
    if (state?.previewQuestion && state?.previewAnswer) {
      // Format for display: show question and answer clearly
      formattedMessage = `**Întrebare:** ${state.previewQuestion}\n\n**Răspuns:** ${state.previewAnswer}\n\n---\n\n*Te rog să generezi următoarea întrebare relevantă pentru a continua interviul medical, bazându-te pe răspunsul meu.*`;
    }
    
    const withUser = addMessage(newConv, 'user', formattedMessage);
    setConversations((prev) => appendConversation(prev, withUser));
    setActiveId(withUser.id);
    setIsTyping(true);
    
    // Determine triage state for initial message
    const nextTriageState = determineNextTriageState(
      withUser.triage,
      formattedMessage,
      withUser.messages.length
    );
    const updatedTriage = updateTriageContext(withUser.triage, nextTriageState);
    
    // Create empty assistant message for streaming
    const withEmptyAssistant = addMessage({ ...withUser, triage: updatedTriage }, 'assistant', '');
    setConversations((prev) =>
      prev.map((c) => (c.id === withEmptyAssistant.id ? withEmptyAssistant : c))
    );
    
    let accumulatedText = '';
    const currentConv = { ...withEmptyAssistant, triage: updatedTriage };
    
    sendMessageStreaming(withUser.id, withUser.messages, (chunk: string) => {
      accumulatedText += chunk;
      setConversations((prev) => {
        const convToUpdate = prev.find((c) => c.id === currentConv.id);
        if (!convToUpdate) return prev;
        const updated = updateLastAssistantMessage(convToUpdate, accumulatedText);
        return prev.map((c) => (c.id === updated.id ? updated : c));
      });
    }, nextTriageState, systemContext)
      .then((fullReply) => {
        const isConclusion = isConclusionMessage(fullReply) || nextTriageState === 'conclusion';
        const finalTriage = isConclusion 
          ? { ...updatedTriage, state: 'conclusion' as const }
          : updatedTriage;
        
        setConversations((prev) => {
          const convToUpdate = prev.find((c) => c.id === currentConv.id);
          if (!convToUpdate) return prev;
          const final = updateLastAssistantMessage(
            { ...convToUpdate, triage: finalTriage },
            fullReply,
            {
              showCta: isConclusion,
              triageState: finalTriage.state,
            }
          );
          return prev.map((c) => (c.id === final.id ? final : c));
        });
      })
      .catch(() => {
        setConversations((prev) => {
          const convToUpdate = prev.find((c) => c.id === currentConv.id);
          if (!convToUpdate) return prev;
          const withError = updateLastAssistantMessage(convToUpdate, 'Eroare la răspuns. Încearcă din nou.');
          return prev.map((c) => (c.id === withError.id ? withError : c));
        });
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

  const handleSendMessage = useCallback((conv: Conversation, userText: string) => {
    setIsTyping(true);
    console.log('Sending AI message:', { conversationId: conv.id, messageCount: conv.messages.length });
    
    // Determine triage state
    const nextTriageState = determineNextTriageState(
      conv.triage,
      userText,
      conv.messages.length
    );
    
    // Update triage context
    const updatedTriage = updateTriageContext(conv.triage, nextTriageState);
    const updatedConv = { ...conv, triage: updatedTriage };
    
    // Create loading assistant message (prevents flash of unformatted text)
    const loadingMessage = addMessage(updatedConv, 'assistant', '');
    loadingMessage.messages[loadingMessage.messages.length - 1].meta = {
      status: 'loading',
    };
    setConversations((prev) =>
      prev.map((c) => (c.id === loadingMessage.id ? { ...loadingMessage, triage: updatedTriage } : c))
    );
    
    let accumulatedText = '';
    const currentConv = { ...loadingMessage, triage: updatedTriage };
    
    sendMessageStreaming(conv.id, conv.messages, (chunk: string) => {
      // Accumulate text but don't render until complete (prevents flash)
      accumulatedText += chunk;
      // Don't update UI during streaming - wait for complete response
    }, nextTriageState)
      .then((fullReply) => {
        console.log('AI streaming completed, total length:', fullReply.length);
        
        // Parse JSON FIRST before rendering
        const isStructured = isStructuredResponse(fullReply);
        const parsedTurn = isStructured ? parseAiTurn(fullReply) : null;
        
        // Check if this is a conclusion message
        const isConclusion = parsedTurn?.mode === 'conclusion' || 
                            parsedTurn?.mode === 'urgent' ||
                            isConclusionMessage(fullReply) || 
                            nextTriageState === 'conclusion';
        const finalTriage = isConclusion 
          ? { ...updatedTriage, state: 'conclusion' as const }
          : updatedTriage;
        
        // Final update with complete message - status: 'ready', parsed turn cached
        setConversations((prev) => {
          const convToUpdate = prev.find((c) => c.id === currentConv.id);
          if (!convToUpdate) return prev;
          const final = updateLastAssistantMessage(
            { ...convToUpdate, triage: finalTriage },
            fullReply,
            {
              status: 'ready',
              showCta: isConclusion,
              triageState: finalTriage.state,
              parsedTurn: parsedTurn, // Cache parsed result
            }
          );
          return prev.map((c) => (c.id === final.id ? final : c));
        });
      })
      .catch((error) => {
        console.error('AI chat error details:', {
          error,
          message: error?.message,
          stack: error?.stack,
          name: error?.name
        });
        const errorMessage = error?.message || 'Eroare la răspuns. Încearcă din nou.';
        console.error('Showing error to user:', errorMessage);
        setConversations((prev) => {
          const convToUpdate = prev.find((c) => c.id === currentConv.id);
          if (!convToUpdate) return prev;
          const withError = updateLastAssistantMessage(convToUpdate, errorMessage);
          return prev.map((c) => (c.id === withError.id ? withError : c));
        });
      })
      .finally(() => setIsTyping(false));
  }, [conversations]);

  // Define handlers after handleSendMessage
  const handleOptionSelect = useCallback((_value: string, label: string) => {
    // Auto-send the selected option as user message
    const conv = activeConversation;
    if (!conv) {
      const newConv = createConversation();
      const withUser = addMessage(newConv, 'user', label);
      const autoTitle = autoTitleConversation(label);
      const titled = { ...withUser, title: autoTitle };
      setConversations((prev) => appendConversation(prev, titled));
      setActiveId(titled.id);
      handleSendMessage(titled, label);
    } else {
      const withUser = addMessage(conv, 'user', label);
      // Update title if it's still "New chat"
      if (conv.title === 'New chat' && conv.messages.length === 0) {
        const autoTitle = autoTitleConversation(label);
        const titled = { ...withUser, title: autoTitle };
        setConversations((prev) =>
          prev.map((c) => (c.id === titled.id ? titled : c))
        );
        handleSendMessage(titled, label);
      } else {
        setConversations((prev) =>
          prev.map((c) => (c.id === withUser.id ? withUser : c))
        );
        handleSendMessage(withUser, label);
      }
    }
  }, [activeConversation, conversations, handleSendMessage]);

  const handleFreeTextSubmit = useCallback((text: string) => {
    // Treat free text like regular input
    let conv = activeConversation;
    if (!conv) {
      const newConv = createConversation();
      conv = addMessage(newConv, 'user', text);
      const autoTitle = autoTitleConversation(text);
      const titled = { ...conv, title: autoTitle };
      setConversations((prev) => appendConversation(prev, titled));
      setActiveId(titled.id);
      setInput('');
      handleSendMessage(titled, text);
    } else {
      conv = addMessage(conv, 'user', text);
      if (conv.title === 'New chat' && conv.messages.filter(m => m.role === 'user').length === 1) {
        const autoTitle = autoTitleConversation(text);
        const titled = { ...conv, title: autoTitle };
        setConversations((prev) =>
          prev.map((c) => (c.id === titled.id ? titled : c))
        );
        setInput('');
        handleSendMessage(titled, text);
      } else {
        setConversations((prev) =>
          prev.map((c) => (c.id === conv!.id ? conv! : c))
        );
        setInput('');
        handleSendMessage(conv, text);
      }
    }
  }, [activeConversation, conversations, handleSendMessage, setInput]);

  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text) return;

    let conv = activeConversation;
    if (!conv) {
      const newConv = createConversation();
      conv = addMessage(newConv, 'user', text);
      // Auto-title from first message
      const autoTitle = autoTitleConversation(text);
      const titled = { ...conv, title: autoTitle };
      setConversations((prev) => appendConversation(prev, titled));
      setActiveId(titled.id);
      setInput('');
      handleSendMessage(titled, text);
      return;
    } else {
      conv = addMessage(conv, 'user', text);
      // Update title if it's still "New chat"
      if (conv.title === 'New chat' && conv.messages.filter(m => m.role === 'user').length === 1) {
        const autoTitle = autoTitleConversation(text);
        const titled = { ...conv, title: autoTitle };
        setConversations((prev) =>
          prev.map((c) => (c.id === titled.id ? titled : c))
        );
        setInput('');
        handleSendMessage(titled, text);
        return;
      }
      setConversations((prev) =>
        prev.map((c) => (c.id === conv!.id ? conv! : c))
      );
    }
    setInput('');

    handleSendMessage(conv, text);
  }, [input, activeConversation, conversations, handleSendMessage]);

  return (
    <div className="min-h-screen bg-[hsl(240,10%,6%)] text-[hsl(220,12%,98%)]">
      <div className="w-full h-screen">
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
          onOptionSelect={handleOptionSelect}
          onFreeTextSubmit={handleFreeTextSubmit}
        />
      </div>
    </div>
  );
}
