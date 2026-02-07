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
  const [navbarHeight, setNavbarHeight] = useState(96) // Default fallback

  // Measure navbar height dynamically
  useEffect(() => {
    const measureNavbar = () => {
      const navbar = document.querySelector('nav[class*="sticky"]') as HTMLElement
      if (navbar) {
        const height = navbar.offsetHeight
        // Also check for mobile nav
        const mobileNav = document.querySelector('div[class*="md:hidden"]') as HTMLElement
        const mobileHeight = mobileNav && window.innerWidth < 768 ? mobileNav.offsetHeight : 0
        setNavbarHeight(height + mobileHeight)
      }
    }

    measureNavbar()
    window.addEventListener('resize', measureNavbar)
    
    // Also measure after a short delay to ensure navbar is rendered
    const timeout = setTimeout(measureNavbar, 100)

    return () => {
      window.removeEventListener('resize', measureNavbar)
      clearTimeout(timeout)
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
      className="bg-[#0a0a14] text-white flex flex-col overflow-hidden" 
      style={{ 
        height: `calc(100vh - ${navbarHeight}px)`, 
        marginTop: `${navbarHeight}px` 
      }}
    >
      {/* Top bar - Fixed height */}
      <div className="shrink-0 border-b border-white/10 px-6 py-4 flex items-center justify-between bg-[#0a0a14]">
        {topBar}
      </div>

      {/* Main content - Flex-1 with overflow-hidden, inner panels scroll */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Left sidebar - Scrollable internally */}
        <div className="shrink-0 w-80 border-r border-white/10 overflow-y-auto">
          {sidebar}
        </div>

        {/* Center - Conversation area - Scrollable internally */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {conversation}
        </div>
      </div>

      {/* Bottom composer - Fixed height, sticky */}
      <div className="shrink-0">
        {composer}
      </div>
    </div>
  )
}
