import { Routes, Route } from 'react-router-dom'
// @ts-ignore - JS file
import { ThemeProvider } from '@mui/material/styles'
// @ts-ignore - JS file
import CssBaseline from '@mui/material/CssBaseline'
import { useLocation } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { AppointmentProvider } from './context/AppointmentContext'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import DoctorsPage from './pages/DoctorsPage'
import ClinicsPage from './pages/ClinicsPage'
import DoctorProfilePage from './pages/DoctorProfilePage'
import ClinicProfilePage from './pages/ClinicProfilePage'
import AppointmentBookingPage from './pages/AppointmentBookingPage'
// @ts-ignore - JS file
import { HomePage } from './layouts/homepage/HomePage'
// @ts-ignore - JS file  
import Dashboard from './layouts/dashboard'
import SignInPage from './pages/SignInPage'
import SignUpPage from './pages/SignUpPage'
// @ts-ignore - JS file
import theme from './assets/theme'

function App() {
  const location = useLocation()
  const isAuthPage = location.pathname.startsWith('/authentication')

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
            <Route path="/clinici" element={<ClinicsPage />} />
            <Route path="/clinic/:id" element={<ClinicProfilePage />} />
            <Route path="/authentication/sign-in" element={<SignInPage />} />
            <Route path="/authentication/sign-up" element={<SignUpPage />} />
            <Route 
              path="/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
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

