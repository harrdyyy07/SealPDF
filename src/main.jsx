import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ClerkProvider } from '@clerk/clerk-react'
import './index.css'
import App from './App.jsx'

import { useNavigate } from 'react-router-dom'

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Publishable Key")
}

const ClerkProviderWithRoutes = ({ children }) => {
  const navigate = useNavigate();
  
  return (
    <ClerkProvider 
      publishableKey={PUBLISHABLE_KEY} 
      navigate={(to) => navigate(to)}
    >
      {children}
    </ClerkProvider>
  );
};

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <ClerkProviderWithRoutes>
      <App />
    </ClerkProviderWithRoutes>
  </BrowserRouter>
)
