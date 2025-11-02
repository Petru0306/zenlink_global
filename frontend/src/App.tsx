import { Routes, Route } from 'react-router-dom'
// @ts-ignore - JS file
import { ThemeProvider } from '@mui/material/styles'
// @ts-ignore - JS file
import CssBaseline from '@mui/material/CssBaseline'
import DoctorsPage from './pages/DoctorsPage'
import ClinicsPage from './pages/ClinicsPage'
// @ts-ignore - JS file
import { HomePage } from './layouts/homepage/HomePage'
// @ts-ignore - JS file  
import Dashboard from './layouts/dashboard'
// @ts-ignore - JS file
import theme from './assets/theme'

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/doctori" element={<DoctorsPage />} />
        <Route path="/clinici" element={<ClinicsPage />} />
      </Routes>
    </ThemeProvider>
  )
}

export default App

