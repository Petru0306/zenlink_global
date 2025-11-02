import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import DoctorsPage from './pages/DoctorsPage'
import ClinicsPage from './pages/ClinicsPage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/doctori" replace />} />
        <Route path="/doctori" element={<DoctorsPage />} />
        <Route path="/clinici" element={<ClinicsPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App

