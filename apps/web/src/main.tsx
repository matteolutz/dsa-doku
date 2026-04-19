import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './utils/trpc.ts';
import { BrowserRouter } from 'react-router';
import ConfirmationModalContextProvider from './hooks/modal.tsx';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ConfirmationModalContextProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </ConfirmationModalContextProvider>
    </QueryClientProvider>
  </StrictMode>
);
