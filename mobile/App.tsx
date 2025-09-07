import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider as PaperProvider } from 'react-native-paper';
import { QueryClient, QueryClientProvider } from 'react-query';
import FlashMessage from 'react-native-flash-message';

import Navigation from './src/navigation';
import { AuthProvider } from './src/contexts/AuthContext';
import { theme } from './src/styles/theme';
import { NotificationProvider } from './src/contexts/NotificationContext';
import { LocationProvider } from './src/contexts/LocationContext';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

export default function App() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <PaperProvider theme={theme}>
          <AuthProvider>
            <NotificationProvider>
              <LocationProvider>
                <Navigation />
                <StatusBar style="auto" />
                <FlashMessage position="top" />
              </LocationProvider>
            </NotificationProvider>
          </AuthProvider>
        </PaperProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}