/**
 * 3-zone layout: Top bar (sticky) + Main content (scrollable) + Bottom composer (sticky)
 * Uses full viewport height with no page scroll
 */

import { ReactNode, useEffect, useState } from 'react'

interface ConsultationLayoutProps {
  topBar: ReactNode
  sidebar: ReactNode
  conversation: ReactNode
  composer: ReactNode
}

export default function ConsultationLayout({
  topBar,
  sidebar,
  conversation,
  composer,
}: ConsultationLayoutProps) {
  const [navbarHeight, setNavbarHeight] = useState(0) // Start with 0, will be measured

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
      className="bg-[#0a0a14] text-white flex flex-col fixed inset-0" 
      style={{ 
        top: `${navbarHeight}px`,
        height: `calc(100vh - ${navbarHeight}px)`,
        position: 'fixed',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}
    >
      {/* Top bar - Fixed height */}
      <div className="shrink-0 border-b border-white/10 px-6 py-4 flex items-center justify-between bg-[#0a0a14] z-10" style={{ flexShrink: 0 }}>
        {topBar}
      </div>

      {/* Main content - Flex-1 with overflow-hidden, inner panels scroll */}
      <div className="flex-1 flex overflow-hidden min-h-0" style={{ minHeight: 0, flex: '1 1 auto', overflow: 'hidden' }}>
        {/* Left sidebar - Scrollable internally */}
        <div className="shrink-0 w-80 border-r border-white/10 overflow-y-auto">
          {sidebar}
        </div>

        {/* Center - Conversation area - Scrollable internally */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden" style={{ minHeight: 0, flex: '1 1 auto' }}>
          {conversation}
        </div>
      </div>

      {/* Bottom composer - Fixed height, sticky, always visible */}
      <div 
        className="shrink-0 relative z-20 bg-[#0a0a14] border-t border-white/10" 
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
  )
}
