import { Routes, Route } from 'react-router-dom'
// @ts-ignore - JS file
import { ThemeProvider } from '@mui/material/styles'
// @ts-ignore - JS file
import CssBaseline from '@mui/material/CssBaseline'
import { useLocation } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import DoctorsPage from './pages/DoctorsPage'
import ClinicsPage from './pages/ClinicsPage'
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
        {!isAuthPage && <Navbar />}
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/doctori" element={<DoctorsPage />} />
          <Route path="/clinici" element={<ClinicsPage />} />
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
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App

