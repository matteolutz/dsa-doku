import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './utils/trpc.ts';
import { BrowserRouter } from 'react-router';
import ConfirmationModalContextProvider from './hooks/modal.tsx';

import './index.css';
import '@/assets/css/journal.css';
import { TooltipProvider } from './components/ui/tooltip.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ConfirmationModalContextProvider>
        <BrowserRouter>
          <TooltipProvider>
            <App />
          </TooltipProvider>
        </BrowserRouter>
      </ConfirmationModalContextProvider>
    </QueryClientProvider>
  </StrictMode>
);
