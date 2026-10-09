import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import NotificationProvider from './components/NotificationProvider';
import './auth/auth.css';
import { useNotificationStore } from './store/notificationStore';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
      refetchOnWindowFocus: false,
      staleTime: 30000,
    },
    mutations: {
      retry: 0,
    },
  },
});

const originalError = console.error;
console.error = (...args: any[]) => {
  const msg = args.join(' ');
  if (msg.includes('React Router') && msg.includes('Future Flag')) return;
  originalError.apply(console, args);
};

window.addEventListener('unhandledrejection', (event) => {
  console.error('[Unhandled Promise Rejection]', event.reason);
  event.preventDefault();
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <HashRouter>
        <App />
        <NotificationProvider />
      </HashRouter>
    </QueryClientProvider>
  </React.StrictMode>
);
