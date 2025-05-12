import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ChakraProvider, extendTheme } from '@chakra-ui/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';

// Create a theme with Traefik-like colors
const theme = extendTheme({
  colors: {
    traefik: {
      50: '#e6f7ff',
      100: '#bae7ff',
      200: '#91d5ff',
      300: '#69c0ff',
      400: '#40a9ff',
      500: '#1890ff', // Primary Traefik-like blue
      600: '#096dd9',
      700: '#0050b3',
      800: '#003a8c',
      900: '#002766',
    },
  },
  fonts: {
    heading: 'Inter, system-ui, sans-serif',
    body: 'Inter, system-ui, sans-serif',
  },
  components: {
    Button: {
      variants: {
        solid: {
          bg: 'traefik.500',
          color: 'white',
          _hover: {
            bg: 'traefik.600',
          },
        },
      },
    },
  },
});

// Create a client for React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30000,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ChakraProvider theme={theme}>
        <QueryClientProvider client={queryClient}>
          <App />
        </QueryClientProvider>
      </ChakraProvider>
    </BrowserRouter>
  </React.StrictMode>
);