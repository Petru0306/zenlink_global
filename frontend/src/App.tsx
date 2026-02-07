import { Routes, Route } from 'react-router-dom'
// @ts-ignore - JS file
import { ThemeProvider } from '@mui/material/styles'
// @ts-ignore - JS file
import CssBaseline from '@mui/material/CssBaseline'
import { useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { AuthProvider } from './context/AuthContext'
import { AppointmentProvider } from './context/AppointmentContext'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import DoctorsPage from './pages/DoctorsPage'
import ClinicsPage from './pages/ClinicsPage'
import AiPage from './pages/AiPage.tsx'
import AboutPage from './pages/AboutPage'
import DoctorProfilePage from './pages/DoctorProfilePage'
import ClinicProfilePage from './pages/ClinicProfilePage'
import AppointmentBookingPage from './pages/AppointmentBookingPage'
import ConsultationWorkspacePage from './pages/ConsultationWorkspacePage'
// @ts-ignore - JS file
import Flowchart from './layouts/flowchart'
// @ts-ignore - JS file
import { HomePage } from './layouts/homepage/HomePage'
// @ts-ignore - JS file  
import Dashboard from './layouts/dashboard'
import DashboardRouter from './components/DashboardRouter'
import AuthPage from './components/auth/AuthPage'
import PsychProfileOnboarding from './pages/PsychProfileOnboarding'
// @ts-ignore - JS file
import theme from './assets/theme'

function App() {
  const location = useLocation()
  const isAuthPage =
    location.pathname.startsWith('/authentication') ||
    location.pathname === '/auth' ||
    location.pathname.startsWith('/onboarding')

  // Disable browser scroll restoration
  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual'
    }
  }, [])

  // Scroll to top when route changes
  useEffect(() => {
    // Clear any hash from URL first
    if (window.location.hash) {
      window.history.replaceState(null, '', window.location.pathname)
    }
    
    // Force scroll to top immediately
    const scrollToTop = () => {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
      document.documentElement.scrollTop = 0
      document.body.scrollTop = 0
    }
    
    scrollToTop()
    
    // Use requestAnimationFrame to ensure DOM is ready
    requestAnimationFrame(() => {
      scrollToTop()
      // Also scroll after delays to handle any async layout updates
      setTimeout(scrollToTop, 0)
      setTimeout(scrollToTop, 50)
      setTimeout(scrollToTop, 100)
      setTimeout(scrollToTop, 200)
    })
  }, [location.pathname])

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <AppointmentProvider>
          {!isAuthPage && <Navbar />}
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/doctori" element={<DoctorsPage />} />
            <Route path="/doctor/:id" element={<DoctorProfilePage />} />
            <Route path="/doctor/:id/book" element={<AppointmentBookingPage />} />
            <Route path="/consult/:appointmentId" element={<ConsultationWorkspacePage />} />
            <Route path="/clinici" element={<ClinicsPage />} />
            <Route path="/ai" element={<AiPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/clinic/:id" element={<ClinicProfilePage />} />
            <Route path="/flowchart" element={<Flowchart />} />
            <Route path="/auth" element={<AuthPage />} />
            {/* Redirect old auth routes to new auth page */}
            <Route path="/authentication/sign-in" element={<AuthPage />} />
            <Route path="/authentication/sign-up" element={<AuthPage />} />
            <Route
              path="/onboarding/psych-profile"
              element={
                <ProtectedRoute skipPsychProfileCheck>
                  <PsychProfileOnboarding />
                </ProtectedRoute>
              }
            />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <DashboardRouter />
                </ProtectedRoute>
              } 
            />
          </Routes>
        </AppointmentProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App

