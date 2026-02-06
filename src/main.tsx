import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { initDB } from './utils/offlineDB'
import { syncManager } from './utils/syncManager'

// Initialize offline database and sync manager
initDB().then(() => {
  console.log('✅ Offline database initialized');
  syncManager.syncPendingChanges();
}).catch(error => {
  console.error('Failed to initialize offline DB:', error);
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

