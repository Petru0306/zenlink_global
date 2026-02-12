import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
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
  const [navbarHeight, setNavbarHeight] = useState(0);
  const [reducedMotion, setReducedMotion] = useState(false);
  const orbTopRightRef = useRef<HTMLDivElement>(null);
  const orbBottomLeftRef = useRef<HTMLDivElement>(null);
  const particlesFarRef = useRef<HTMLDivElement>(null);
  const particlesMidRef = useRef<HTMLDivElement>(null);
  const particlesNearRef = useRef<HTMLDivElement>(null);
  const mouseTargetRef = useRef({ x: 0, y: 0 });
  const mouseCurrentRef = useRef({ x: 0, y: 0 });
  const rafIdRef = useRef<number | null>(null);

  const activeConversation = activeId
    ? conversations.find((c) => c.id === activeId) ?? null
    : null;

  // Particles for background animation
  const particles = useMemo(() => {
    const count = 40;
    const pickDepth = () => {
      const r = Math.random();
      if (r < 0.45) return 0;
      if (r < 0.8) return 1;
      return 2;
    };
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      delay: Math.random() * 5,
      duration: 10 + Math.random() * 20,
      depth: pickDepth(),
      twinkleDelay: Math.random() * 6,
      twinkleDuration: 3.5 + Math.random() * 4.5,
    }));
  }, []);

  const particlesByDepth = useMemo(() => {
    const far = [];
    const mid = [];
    const near = [];
    for (const p of particles) {
      if (p.depth === 0) far.push(p);
      else if (p.depth === 1) mid.push(p);
      else near.push(p);
    }
    return { far, mid, near };
  }, [particles]);

  // Measure navbar height
  useEffect(() => {
    const measureNavbar = () => {
      let navbar: HTMLElement | null = null;
      navbar = document.querySelector('nav[class*="sticky"]') as HTMLElement;
      if (!navbar) {
        navbar = document.querySelector('nav[class*="z-50"]') as HTMLElement;
      }
      if (!navbar) {
        navbar = document.querySelector('nav') as HTMLElement;
      }
      
      if (navbar) {
        const height = navbar.offsetHeight || navbar.getBoundingClientRect().height;
        const mobileNav = document.querySelector('div[class*="md:hidden"]') as HTMLElement;
        const mobileHeight = mobileNav && window.innerWidth < 768 ? (mobileNav.offsetHeight || mobileNav.getBoundingClientRect().height) : 0;
        const totalHeight = height + mobileHeight;
        if (totalHeight > 0) {
          setNavbarHeight(totalHeight);
        } else {
          setNavbarHeight(80);
        }
      } else {
        setNavbarHeight(80);
      }
    };

    measureNavbar();
    window.addEventListener('resize', measureNavbar);
    
    const timeout1 = setTimeout(measureNavbar, 100);
    const timeout2 = setTimeout(measureNavbar, 300);
    const timeout3 = setTimeout(measureNavbar, 500);
    const timeout4 = setTimeout(measureNavbar, 1000);

    return () => {
      window.removeEventListener('resize', measureNavbar);
      clearTimeout(timeout1);
      clearTimeout(timeout2);
      clearTimeout(timeout3);
      clearTimeout(timeout4);
    };
  }, []);

  // Disable body scroll
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    const originalHeight = document.body.style.height;
    const originalHtmlOverflow = document.documentElement.style.overflow;
    const originalHtmlHeight = document.documentElement.style.height;

    document.body.style.overflow = 'hidden';
    document.body.style.height = '100%';
    document.documentElement.style.overflow = 'hidden';
    document.documentElement.style.height = '100%';

    return () => {
      document.body.style.overflow = originalOverflow;
      document.body.style.height = originalHeight;
      document.documentElement.style.overflow = originalHtmlOverflow;
      document.documentElement.style.height = originalHtmlHeight;
    };
  }, []);

  // Reduced motion detection
  useEffect(() => {
    const media = window.matchMedia?.("(prefers-reduced-motion: reduce)");
    if (!media) return;

    const onChange = () => setReducedMotion(Boolean(media.matches));
    onChange();

    if (media.addEventListener) media.addEventListener("change", onChange);
    else media.addListener(onChange);

    return () => {
      if (media.removeEventListener) media.removeEventListener("change", onChange);
      else media.removeListener(onChange);
    };
  }, []);

  // Background animation
  useEffect(() => {
    if (reducedMotion) return;

    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

    const updateFromClientXY = (clientX: number, clientY: number) => {
      const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
      const nx = (clientX / window.innerWidth - 0.5) * 2;
      const ny = (clientY / window.innerHeight - 0.5) * 2;
      mouseTargetRef.current = { x: clamp(nx, -1, 1), y: clamp(ny, -1, 1) };
    };

    const handlePointerMove = (e: PointerEvent) => updateFromClientXY(e.clientX, e.clientY);
    const handleMouseMove = (e: MouseEvent) => updateFromClientXY(e.clientX, e.clientY);

    const runningRef = { current: true };

    const animate = (now: number) => {
      if (!runningRef.current) return;
      const t = now;

      const current = mouseCurrentRef.current;
      const target = mouseTargetRef.current;
      const next = {
        x: lerp(current.x, target.x, 0.085),
        y: lerp(current.y, target.y, 0.085),
      };
      mouseCurrentRef.current = next;

      const ambient1 = {
        x: Math.sin(t * 0.00008) * 18 + Math.cos(t * 0.00006) * 10,
        y: Math.cos(t * 0.00007) * 14 + Math.sin(t * 0.00005) * 9,
      };
      const ambient2 = {
        x: Math.cos(t * 0.000075) * 14 + Math.sin(t * 0.00005) * 8,
        y: Math.sin(t * 0.000065) * 12 + Math.cos(t * 0.000045) * 7,
      };

      const mouse1 = { x: next.x * 42, y: next.y * 42 };
      const mouse2 = { x: next.x * -30, y: next.y * -30 };

      const orb1 = orbTopRightRef.current;
      if (orb1) {
        orb1.style.transform = `translate3d(${ambient1.x + mouse1.x}px, ${ambient1.y + mouse1.y}px, 0)`;
      }

      const orb2 = orbBottomLeftRef.current;
      if (orb2) {
        orb2.style.transform = `translate3d(${ambient2.x + mouse2.x}px, ${ambient2.y + mouse2.y}px, 0)`;
      }

      const farEl = particlesFarRef.current;
      const midEl = particlesMidRef.current;
      const nearEl = particlesNearRef.current;
      if (farEl) {
        const ax = Math.sin(t * 0.000035) * 10 + Math.cos(t * 0.00002) * 6;
        const ay = Math.cos(t * 0.00003) * 7 + Math.sin(t * 0.000018) * 5;
        const mx = next.x * 10;
        const my = next.y * 10;
        farEl.style.transform = `translate3d(${ax + mx}px, ${ay + my}px, 0)`;
      }
      if (midEl) {
        const ax = Math.cos(t * 0.00003) * 14 + Math.sin(t * 0.000022) * 8;
        const ay = Math.sin(t * 0.000028) * 10 + Math.cos(t * 0.000019) * 6;
        const mx = next.x * 16;
        const my = next.y * 16;
        midEl.style.transform = `translate3d(${ax + mx}px, ${ay + my}px, 0)`;
      }
      if (nearEl) {
        const ax = Math.sin(t * 0.000028) * 18 + Math.cos(t * 0.00002) * 10;
        const ay = Math.cos(t * 0.000026) * 12 + Math.sin(t * 0.000017) * 8;
        const mx = next.x * 22;
        const my = next.y * 22;
        nearEl.style.transform = `translate3d(${ax + mx}px, ${ay + my}px, 0)`;
      }

      rafIdRef.current = requestAnimationFrame(animate);
    };

    document.addEventListener("pointermove", handlePointerMove, { passive: true, capture: true });
    document.addEventListener("mousemove", handleMouseMove, { passive: true, capture: true });

    const onVisibilityChange = () => {
      const isHidden = document.visibilityState === "hidden";
      runningRef.current = !isHidden;
      if (isHidden) {
        if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      } else if (!rafIdRef.current) {
        rafIdRef.current = requestAnimationFrame(animate);
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange, { passive: true });

    rafIdRef.current = requestAnimationFrame(animate);

    return () => {
      document.removeEventListener("pointermove", handlePointerMove, { capture: true });
      document.removeEventListener("mousemove", handleMouseMove, { capture: true });
      document.removeEventListener("visibilitychange", onVisibilityChange);
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    };
  }, [reducedMotion]);

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
    }, nextTriageState)
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
    <div className="fixed inset-0 bg-[#0a0e1a] text-[hsl(220,12%,98%)] overflow-hidden" style={{ top: `${navbarHeight}px`, height: `calc(100vh - ${navbarHeight}px)` }}>
      {/* Animated background gradient orbs */}
      <div
        ref={orbTopRightRef}
        className="fixed -top-[20%] -right-[10%] w-[800px] h-[800px] rounded-full bg-gradient-to-br from-purple-500/30 via-purple-600/20 to-transparent blur-[100px] pointer-events-none"
        style={{ willChange: "transform" }}
      ></div>
      <div
        ref={orbBottomLeftRef}
        className="fixed -bottom-[15%] -left-[5%] w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-purple-400/25 via-purple-500/15 to-transparent blur-[80px] pointer-events-none"
        style={{ willChange: "transform" }}
      ></div>
      <div className="fixed top-[40%] right-[30%] w-[400px] h-[400px] rounded-full bg-gradient-to-br from-purple-400/20 to-transparent blur-[90px] pointer-events-none"></div>

      {/* Floating particles animation */}
      <>
        {/* Far layer */}
        <div
          ref={particlesFarRef}
          className="fixed inset-0 pointer-events-none overflow-hidden"
          style={{ willChange: "transform" }}
        >
          {particlesByDepth.far.map((p) => (
            <div
              key={p.id}
              className={`absolute ${reducedMotion ? "" : "animate-float-soft"}`}
              style={{
                left: `${p.left}%`,
                top: `${p.top}%`,
                animationDelay: `${p.delay}s`,
                animationDuration: `${16 + p.duration * 0.9}s`,
              }}
            >
              <div
                className={`${reducedMotion ? "" : "animate-twinkle"}`}
                style={{
                  width: "2px",
                  height: "2px",
                  borderRadius: "9999px",
                  backgroundColor: "rgb(168, 85, 247)",
                  boxShadow: "0 0 6px rgba(168, 85, 247, 0.35)",
                  "--twinkle-min": 0.22,
                  "--twinkle-max": 0.6,
                  animationDelay: `${p.twinkleDelay}s`,
                  animationDuration: `${p.twinkleDuration + 1.5}s`,
                } as React.CSSProperties}
              />
            </div>
          ))}
        </div>

        {/* Mid layer */}
        <div
          ref={particlesMidRef}
          className="fixed inset-0 pointer-events-none overflow-hidden"
          style={{ willChange: "transform" }}
        >
          {particlesByDepth.mid.map((p) => (
            <div
              key={p.id}
              className={`absolute ${reducedMotion ? "" : "animate-float-soft"}`}
              style={{
                left: `${p.left}%`,
                top: `${p.top}%`,
                animationDelay: `${p.delay}s`,
                animationDuration: `${14 + p.duration * 0.75}s`,
              }}
            >
              <div
                className={`${reducedMotion ? "" : "animate-twinkle"}`}
                style={{
                  width: "2.5px",
                  height: "2.5px",
                  borderRadius: "9999px",
                  backgroundColor: "rgb(168, 85, 247)",
                  boxShadow: "0 0 8px rgba(168, 85, 247, 0.4)",
                  "--twinkle-min": 0.28,
                  "--twinkle-max": 0.78,
                  animationDelay: `${p.twinkleDelay}s`,
                  animationDuration: `${p.twinkleDuration}s`,
                } as React.CSSProperties}
              />
            </div>
          ))}
        </div>

        {/* Near layer */}
        <div
          ref={particlesNearRef}
          className="fixed inset-0 pointer-events-none overflow-hidden"
          style={{ willChange: "transform" }}
        >
          {particlesByDepth.near.map((p) => (
            <div
              key={p.id}
              className={`absolute ${reducedMotion ? "" : "animate-float-soft"}`}
              style={{
                left: `${p.left}%`,
                top: `${p.top}%`,
                animationDelay: `${p.delay}s`,
                animationDuration: `${12 + p.duration * 0.6}s`,
              }}
            >
              <div
                className={`${reducedMotion ? "" : "animate-twinkle"}`}
                style={{
                  width: "3px",
                  height: "3px",
                  borderRadius: "9999px",
                  backgroundColor: "rgb(168, 85, 247)",
                  boxShadow: "0 0 10px rgba(168, 85, 247, 0.5)",
                  "--twinkle-min": 0.35,
                  "--twinkle-max": 0.95,
                  animationDelay: `${p.twinkleDelay}s`,
                  animationDuration: `${Math.max(2.8, p.twinkleDuration - 0.8)}s`,
                } as React.CSSProperties}
              />
            </div>
          ))}
        </div>
      </>

      {/* Chat Layout - Fixed positioning */}
      <div className="relative z-10 w-full h-full">
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
