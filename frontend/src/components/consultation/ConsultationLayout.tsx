/**
 * 3-zone layout: Top bar (sticky) + Main content (scrollable) + Bottom composer (sticky)
 * Uses full viewport height with no page scroll
 */

import { ReactNode, useEffect, useState, useRef, useMemo } from 'react'

interface ConsultationLayoutProps {
  sidebar: ReactNode
  conversation: ReactNode
  composer: ReactNode
}

export default function ConsultationLayout({
  sidebar,
  conversation,
  composer,
}: ConsultationLayoutProps) {
  const [navbarHeight, setNavbarHeight] = useState(0) // Start with 0, will be measured
  const orbTopRightRef = useRef<HTMLDivElement>(null)
  const orbBottomLeftRef = useRef<HTMLDivElement>(null)
  const particlesFarRef = useRef<HTMLDivElement>(null)
  const particlesMidRef = useRef<HTMLDivElement>(null)
  const particlesNearRef = useRef<HTMLDivElement>(null)
  const mouseTargetRef = useRef({ x: 0, y: 0 })
  const mouseCurrentRef = useRef({ x: 0, y: 0 })
  const rafIdRef = useRef<number | null>(null)
  const [reducedMotion, setReducedMotion] = useState(false)

  // Generate particles
  const particles = useMemo(() => {
    const count = 40
    const pickDepth = () => {
      const r = Math.random()
      if (r < 0.45) return 0
      if (r < 0.8) return 1
      return 2
    }
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      delay: Math.random() * 5,
      duration: 10 + Math.random() * 20,
      depth: pickDepth(),
      twinkleDelay: Math.random() * 6,
      twinkleDuration: 3.5 + Math.random() * 4.5,
    }))
  }, [])

  const particlesByDepth = useMemo(() => {
    const far: typeof particles = []
    const mid: typeof particles = []
    const near: typeof particles = []
    for (const p of particles) {
      if (p.depth === 0) far.push(p)
      else if (p.depth === 1) mid.push(p)
      else near.push(p)
    }
    return { far, mid, near }
  }, [particles])

  // Mouse parallax effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) * 2 - 1
      const y = (e.clientY / window.innerHeight) * 2 - 1
      mouseTargetRef.current = { x, y }
    }

    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  // Animate orbs with parallax
  useEffect(() => {
    if (reducedMotion) return

    const animate = () => {
      const lerp = (a: number, b: number, t: number) => a + (b - a) * t
      mouseCurrentRef.current.x = lerp(mouseCurrentRef.current.x, mouseTargetRef.current.x, 0.05)
      mouseCurrentRef.current.y = lerp(mouseCurrentRef.current.y, mouseTargetRef.current.y, 0.05)

      if (orbTopRightRef.current) {
        const x = mouseCurrentRef.current.x * 30
        const y = mouseCurrentRef.current.y * 30
        orbTopRightRef.current.style.transform = `translate(${x}px, ${y}px)`
      }
      if (orbBottomLeftRef.current) {
        const x = mouseCurrentRef.current.x * -20
        const y = mouseCurrentRef.current.y * -20
        orbBottomLeftRef.current.style.transform = `translate(${x}px, ${y}px)`
      }

      rafIdRef.current = requestAnimationFrame(animate)
    }

    rafIdRef.current = requestAnimationFrame(animate)
    return () => {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current)
    }
  }, [reducedMotion])

  // Check for reduced motion preference
  useEffect(() => {
    const media = window.matchMedia?.('(prefers-reduced-motion: reduce)')
    if (!media) return
    const onChange = () => setReducedMotion(Boolean(media.matches))
    onChange()
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [])

  // Measure navbar height dynamically
  useEffect(() => {
    const measureNavbar = () => {
      // Try multiple selectors to find navbar
      let navbar: HTMLElement | null = null
      navbar = document.querySelector('nav[class*="sticky"]') as HTMLElement
      if (!navbar) {
        navbar = document.querySelector('nav[class*="z-50"]') as HTMLElement
      }
      if (!navbar) {
        navbar = document.querySelector('nav') as HTMLElement
      }
      
      if (navbar) {
        const height = navbar.offsetHeight || navbar.getBoundingClientRect().height
        // Also check for mobile nav
        const mobileNav = document.querySelector('div[class*="md:hidden"]') as HTMLElement
        const mobileHeight = mobileNav && window.innerWidth < 768 ? (mobileNav.offsetHeight || mobileNav.getBoundingClientRect().height) : 0
        const totalHeight = height + mobileHeight
        // Only update if height is valid and greater than 0
        if (totalHeight > 0) {
          setNavbarHeight(totalHeight)
        } else {
          // Fallback: use a default height if navbar not found
          setNavbarHeight(80)
        }
      } else {
        // Fallback: use a default height if navbar not found
        setNavbarHeight(80)
      }
    }

    measureNavbar()
    window.addEventListener('resize', measureNavbar)
    
    // Also measure after delays to ensure navbar is rendered
    const timeout1 = setTimeout(measureNavbar, 100)
    const timeout2 = setTimeout(measureNavbar, 300)
    const timeout3 = setTimeout(measureNavbar, 500)
    const timeout4 = setTimeout(measureNavbar, 1000)

    return () => {
      window.removeEventListener('resize', measureNavbar)
      clearTimeout(timeout1)
      clearTimeout(timeout2)
      clearTimeout(timeout3)
      clearTimeout(timeout4)
    }
  }, [])

  // Disable body scroll when this component mounts
  useEffect(() => {
    const originalOverflow = document.body.style.overflow
    const originalHeight = document.body.style.height
    const originalHtmlOverflow = document.documentElement.style.overflow
    const originalHtmlHeight = document.documentElement.style.height

    document.body.style.overflow = 'hidden'
    document.body.style.height = '100%'
    document.documentElement.style.overflow = 'hidden'
    document.documentElement.style.height = '100%'

    return () => {
      document.body.style.overflow = originalOverflow
      document.body.style.height = originalHeight
      document.documentElement.style.overflow = originalHtmlOverflow
      document.documentElement.style.height = originalHtmlHeight
    }
  }, [])

  return (
    <div 
      className="bg-[#0a0e1a] text-white flex flex-col fixed inset-0 relative overflow-hidden" 
      style={{ 
        top: `${navbarHeight}px`,
        height: `calc(100vh - ${navbarHeight}px)`,
        position: 'fixed',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}
    >
      {/* Animated background gradient orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div
          ref={orbTopRightRef}
          className="fixed -top-[20%] -right-[10%] w-[800px] h-[800px] rounded-full bg-gradient-to-br from-purple-500/30 via-purple-600/20 to-transparent blur-[100px] pointer-events-none"
          style={{ willChange: 'transform' }}
        />
        <div
          ref={orbBottomLeftRef}
          className="fixed -bottom-[15%] -left-[5%] w-[600px] h-[600px] rounded-full bg-gradient-to-tr from-purple-400/25 via-purple-500/15 to-transparent blur-[80px] pointer-events-none"
          style={{ willChange: 'transform' }}
        />
        <div className="fixed top-[40%] right-[30%] w-[400px] h-[400px] rounded-full bg-gradient-to-br from-purple-400/20 to-transparent blur-[90px] pointer-events-none" />
      </div>

      {/* Floating particles */}
      <div
        ref={particlesFarRef}
        className="fixed inset-0 pointer-events-none overflow-hidden z-0"
        style={{ willChange: 'transform' }}
      >
        {particlesByDepth.far.map((p) => (
          <div
            key={p.id}
            className={`absolute ${reducedMotion ? '' : 'animate-float-soft'}`}
            style={{
              left: `${p.left}%`,
              top: `${p.top}%`,
              animationDelay: `${p.delay}s`,
              animationDuration: `${16 + p.duration * 0.9}s`,
            }}
          >
            <div
              className={reducedMotion ? '' : 'animate-twinkle'}
              style={{
                width: '2px',
                height: '2px',
                borderRadius: '9999px',
                backgroundColor: 'rgb(168, 85, 247)',
                boxShadow: '0 0 6px rgba(168, 85, 247, 0.35)',
                animationDelay: `${p.twinkleDelay}s`,
                animationDuration: `${p.twinkleDuration + 1.5}s`,
              }}
            />
          </div>
        ))}
      </div>
      <div
        ref={particlesMidRef}
        className="fixed inset-0 pointer-events-none overflow-hidden z-0"
        style={{ willChange: 'transform' }}
      >
        {particlesByDepth.mid.map((p) => (
          <div
            key={p.id}
            className={`absolute ${reducedMotion ? '' : 'animate-float-soft'}`}
            style={{
              left: `${p.left}%`,
              top: `${p.top}%`,
              animationDelay: `${p.delay}s`,
              animationDuration: `${14 + p.duration * 0.75}s`,
            }}
          >
            <div
              className={reducedMotion ? '' : 'animate-twinkle'}
              style={{
                width: '2.5px',
                height: '2.5px',
                borderRadius: '9999px',
                backgroundColor: 'rgb(168, 85, 247)',
                boxShadow: '0 0 8px rgba(168, 85, 247, 0.4)',
                animationDelay: `${p.twinkleDelay}s`,
                animationDuration: `${p.twinkleDuration}s`,
              }}
            />
          </div>
        ))}
      </div>
      <div
        ref={particlesNearRef}
        className="fixed inset-0 pointer-events-none overflow-hidden z-0"
        style={{ willChange: 'transform' }}
      >
        {particlesByDepth.near.map((p) => (
          <div
            key={p.id}
            className={`absolute ${reducedMotion ? '' : 'animate-float-soft'}`}
            style={{
              left: `${p.left}%`,
              top: `${p.top}%`,
              animationDelay: `${p.delay}s`,
              animationDuration: `${12 + p.duration * 0.6}s`,
            }}
          >
            <div
              className={reducedMotion ? '' : 'animate-twinkle'}
              style={{
                width: '3px',
                height: '3px',
                borderRadius: '9999px',
                backgroundColor: 'rgb(168, 85, 247)',
                boxShadow: '0 0 10px rgba(168, 85, 247, 0.5)',
                animationDelay: `${p.twinkleDelay}s`,
                animationDuration: `${Math.max(2.8, p.twinkleDuration - 0.8)}s`,
              }}
            />
          </div>
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col flex-1 min-h-0">
        {/* Main content - Flex-1 with overflow-hidden, inner panels scroll */}
        <div className="flex-1 flex overflow-hidden min-h-0" style={{ minHeight: 0, flex: '1 1 auto', overflow: 'hidden' }}>
          {/* Left sidebar - Scrollable internally */}
          <div className="shrink-0 w-80 border-r border-white/10 overflow-y-auto bg-transparent/50 backdrop-blur-sm">
            {sidebar}
          </div>

          {/* Center - Conversation area - Scrollable internally */}
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden" style={{ minHeight: 0, flex: '1 1 auto' }}>
            {conversation}
          </div>
        </div>

        {/* Bottom composer - Fixed height, sticky, always visible */}
        <div 
          className="shrink-0 relative bg-transparent/50 backdrop-blur-sm border-t border-white/10" 
          style={{ 
            flexShrink: 0, 
            flex: '0 0 auto',
            display: 'block',
            visibility: 'visible',
            opacity: 1,
            minHeight: '100px'
          }}
        >
          {composer}
        </div>
      </div>
    </div>
  )
}
