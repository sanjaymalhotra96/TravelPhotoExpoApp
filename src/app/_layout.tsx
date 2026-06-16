import React, { useEffect } from 'react';
import { Stack, router, useSegments } from 'expo-router';
import { StatusBar, Platform } from 'react-native';
import * as NavigationBar from 'expo-navigation-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as Linking from 'expo-linking';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/themeStore';

// Import NativeWind compiled stylesheet
import '../theme/global.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function RootLayoutContent() {
  const { isAuthenticated, isLoading, isRecoveringPassword } = useAuthStore();
  const { colorScheme } = useThemeStore();
  const segments = useSegments();
  const url = Linking.useURL();

  // Handle incoming deep links (especially for password recovery)
  useEffect(() => {
    if (isLoading) {
      console.log('[RootLayout] Waiting for initial auth session load before processing deep links...');
      return;
    }

    const handleDeepLink = async (initialUrl: string | null) => {
      if (!initialUrl) return;

      console.log('[RootLayout] Received deep link URL:', initialUrl);

      // Parse query parameters and hash fragments using custom robust parser
      const params: Record<string, string> = {};
      
      const parsePart = (str: string) => {
        if (!str) return;
        const pairs = str.split('&');
        for (const pair of pairs) {
          const [key, value] = pair.split('=');
          if (key) {
            params[decodeURIComponent(key)] = decodeURIComponent(value || '');
          }
        }
      };

      // Split URL into query string and hash fragment
      const queryPart = initialUrl.split('?')[1] || '';
      const hashPart = initialUrl.split('#')[1] || '';

      // Parse query parameters first, then hash fragment (hash overrides query)
      parsePart(queryPart.split('#')[0]);
      parsePart(hashPart);

      // Check if this is a password recovery link
      const isRecovery = params.type === 'recovery' || initialUrl.includes('reset-password');

      if (isRecovery) {
        const code = params.code;
        const access_token = params.access_token;
        const refresh_token = params.refresh_token;

        if (code || (access_token && refresh_token)) {
          console.log('[RootLayout] Password recovery credentials detected. Setting session...');
          // Set recovering flag immediately to prevent other guard redirects to dashboard /
          useAuthStore.getState().setRecoveringPassword(true);
          try {
            // Clear explicit logout flag so the auth listener can receive the recovery session
            useAuthStore.getState().clearExplicitLogout();

            if (code) {
              console.log('[RootLayout] Exchanging PKCE recovery code for session...');
              const { error } = await supabase.auth.exchangeCodeForSession(code);
              if (error) throw error;
              console.log('[RootLayout] Recovery session established via PKCE.');
            } else if (access_token && refresh_token) {
              console.log('[RootLayout] Setting recovery session via implicit tokens...');
              const { error } = await supabase.auth.setSession({
                access_token,
                refresh_token,
              });
              if (error) throw error;
              console.log('[RootLayout] Recovery session established via implicit tokens.');
            }
            
            // Navigate to reset password page explicitly
            router.replace('/(auth)/reset-password');
          } catch (e: any) {
            console.error('[RootLayout] Failed to process recovery session:', e.message);
          }
        } else {
          console.warn('[RootLayout] Recovery link matched but no code or access token found in URL.');
        }
      }
    };

    handleDeepLink(url);
  }, [url, isLoading]);

  // Watch Auth status and route segment configurations
  useEffect(() => {
    console.log('[RootLayout] Auth guard check:', {
      isAuthenticated,
      isLoading,
      isRecoveringPassword,
      segments,
      inAuthGroup: segments[0] === '(auth)'
    });

    if (isLoading) {
      console.log('[RootLayout] Auth is loading, skipping guard redirect.');
      return;
    }

    if (isRecoveringPassword) {
      console.log('[RootLayout] Password recovery in progress. Bypassing automatic guard redirects.');
      return;
    }

    const inAuthGroup = segments[0] === '(auth)';
    const isResetPasswordScreen = segments[0] === '(auth)' && segments[1] === 'reset-password';

    if (isResetPasswordScreen) {
      console.log('[RootLayout] User is on Reset Password screen. Bypassing automatic guard redirects.');
      return;
    }

    if (!isAuthenticated && !inAuthGroup) {
      console.log('[RootLayout] Redirecting to login: /login');
      router.replace('/login');
    } else if (isAuthenticated && inAuthGroup) {
      console.log('[RootLayout] Redirecting to dashboard: /');
      router.replace('/');
    }
  }, [isAuthenticated, isLoading, isRecoveringPassword, segments]);

  // Adjust Status bar themes dynamically based on Zustand theme store
  const isDark = colorScheme === 'dark';

  // Synchronize Android system navigation bar styling dynamically based on theme store
  useEffect(() => {
    if (Platform.OS === 'android') {
      NavigationBar.setBackgroundColorAsync(isDark ? '#0f0f15' : '#ffffff').catch(() => {});
      NavigationBar.setButtonStyleAsync(isDark ? 'light' : 'dark').catch(() => {});
    }
  }, [isDark]);

  return (
    <>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={isDark ? '#0f0f15' : '#f8fafc'}
      />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="generate/[templateId]" options={{ presentation: 'card' }} />
        <Stack.Screen name="generate/polling" options={{ presentation: 'card' }} />
        <Stack.Screen name="result/[jobId]" options={{ presentation: 'card' }} />
        <Stack.Screen name="settings/index" options={{ presentation: 'modal' }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <SafeAreaProvider>
          <RootLayoutContent />
        </SafeAreaProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

