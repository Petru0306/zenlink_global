import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import './index.tailwind.css'
import App from './App.tsx'
import { VisionUIControllerProvider } from './context'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <VisionUIControllerProvider>
        <App />
      </VisionUIControllerProvider>
    </BrowserRouter>
  </StrictMode>,
)

