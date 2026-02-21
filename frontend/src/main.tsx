import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import './index.tailwind.css'
import App from './App.tsx'
import { VisionUIControllerProvider } from './context'

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found');
}
createRoot(rootElement).render(
  <StrictMode>
    <BrowserRouter>
      <VisionUIControllerProvider>
        <App />
      </VisionUIControllerProvider>
    </BrowserRouter>
  </StrictMode>,
)

