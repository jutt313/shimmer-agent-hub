
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'
import { initializeComprehensiveNotificationSystem } from './utils/notificationSystemInitializer'

// Initialize comprehensive notification system before app starts
initializeComprehensiveNotificationSystem();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
