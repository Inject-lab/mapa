import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider } from 'next-themes'
import { Toaster } from 'sonner'
import App from './App.tsx'
import './index.css'

// Suprime logs de tiles abortados durante zoom/pan no ambiente de desenvolvimento
if ((import.meta as any).env?.DEV) {
  const originalError = console.error;
  console.error = (...args: any[]) => {
    const msg = args?.[0] ? String(args[0]) : '';
    const isTileAbort = msg.includes('net::ERR_ABORTED') && (msg.includes('/tiles/') || msg.includes('virtualearth.net') || msg.includes('mapbox.com'));
    if (isTileAbort) return;
    originalError(...args);
  };
  window.addEventListener(
    'error',
    (e: any) => {
      const src = (e?.target as any)?.src || '';
      const isTileAbort = String(e?.message || '').includes('ERR_ABORTED') && (src.includes('/tiles/') || src.includes('virtualearth.net') || src.includes('mapbox.com'));
      if (isTileAbort) {
        e.preventDefault();
        e.stopImmediatePropagation();
      }
    },
    true
  );
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <App />
        <Toaster position="top-right" richColors />
      </ThemeProvider>
    </QueryClientProvider>
  </React.StrictMode>,
)