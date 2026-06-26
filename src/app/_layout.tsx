import React, { useEffect } from 'react';
import { Stack, router, useSegments } from 'expo-router';
import { StatusBar, Platform } from 'react-native';
import * as NavigationBar from 'expo-navigation-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as Linking from 'expo-linking';
import * as SplashScreen from 'expo-splash-screen';
import { supabase } from '@/lib/supabase';
import { useAuthStore, setPendingRecovery } from '@/store/authStore';
import { useTheme } from '@/hooks/useTheme';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync().catch(() => {});

// Import NativeWind compiled stylesheet
import '@/theme/global.css';

import { RevenueCatProvider } from '@/providers/revenuecat-provider';
import { InternetProvider } from '@/providers/InternetProvider';
import { InternetBottomSheet } from '@/components/InternetBottomSheet';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function RootLayoutContent() {
  console.log('====================================================');
  console.log('🚀 TRAVEL PHOTO EXPO APP - METRO LOGS CONNECTED 🚀');
  console.log('====================================================');

  const { isAuthenticated, isLoading, isRecoveringPassword } = useAuthStore();
  const { colors, isDark } = useTheme();
  const segments = useSegments();

  // Handle incoming deep links (especially for password recovery)
  useEffect(() => {
    if (isLoading) {
      console.log('[RootLayout] Waiting for initial auth session load before processing deep links...');
      return;
    }

    const handleDeepLink = async (initialUrl: string | null) => {
      console.log('🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗');
      console.log('[RootLayout] handleDeepLink Triggered!');
      console.log('[RootLayout] Raw incoming URL:', initialUrl);
      console.log('🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗🔗');

      if (!initialUrl) {
        console.log('[RootLayout] URL is null, skipping.');
        return;
      }

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

      console.log('[RootLayout] Parsed parameters:', JSON.stringify(params, null, 2));

      // Check if this is a password recovery link
      const isRecovery = params.type === 'recovery' || initialUrl.includes('reset-password');
      console.log(`[RootLayout] isRecovery check: params.type='${params.type}', includes('reset-password')=${initialUrl.includes('reset-password')} -> Result: ${isRecovery}`);

      if (isRecovery) {
        const code = params.code;
        const access_token = params.access_token;
        const refresh_token = params.refresh_token;

        console.log(`[RootLayout] Recovery parameters found: code=${!!code}, access_token=${!!access_token}, refresh_token=${!!refresh_token}`);

        if (code || (access_token && refresh_token)) {
          console.log('[RootLayout] Password recovery credentials detected. Setting session...');
          // Set BOTH flags synchronously BEFORE the async code exchange.
          // When exchangeCodeForSession() resolves, onAuthStateChange fires SIGNED_IN.
          // pendingRecovery=true tells the listener to intercept that event and
          // skip setSession() so isAuthenticated stays false and the guard won't redirect.
          setPendingRecovery(true);
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
            // Clean up flags so the app is not stuck in recovery mode
            setPendingRecovery(false);
            useAuthStore.getState().setRecoveringPassword(false);
          }
        } else {
          console.warn('[RootLayout] Recovery link matched but no code or access token found in URL.');
        }
      }
    };

    console.log('[RootLayout] Setting up deep link listeners...');
    
    // 1. Check if app was opened from cold start with a URL
    Linking.getInitialURL().then((initialUrl) => {
      console.log('[RootLayout] Initial URL from cold start:', initialUrl);
      handleDeepLink(initialUrl);
    });

    // 2. Listen for URLs when app is already running in background
    const subscription = Linking.addEventListener('url', (event) => {
      console.log('[RootLayout] Received new URL while running:', event.url);
      handleDeepLink(event.url);
    });

    return () => {
      subscription.remove();
    };
  }, [isLoading]);

  // Hide splash screen once initial auth loading is complete
  useEffect(() => {
    if (!isLoading) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [isLoading]);

  // Watch Auth status and route segment configurations
  useEffect(() => {
    const segs = segments as string[];
    console.log('[RootLayout] Auth guard check:', {
      isAuthenticated,
      isLoading,
      isRecoveringPassword,
      segments: segs,
      inAuthGroup: segs[0] === '(auth)'
    });

    if (isLoading) {
      console.log('[RootLayout] Auth is loading, skipping guard redirect.');
      return;
    }

    if (isRecoveringPassword) {
      console.log('[RootLayout] Password recovery in progress. Bypassing automatic guard redirects.');
      return;
    }

    const inAuthGroup = segs[0] === '(auth)';
    const isResetPasswordScreen = segs[0] === '(auth)' && segs[1] === 'reset-password';

    if (isResetPasswordScreen) {
      console.log('[RootLayout] User is on Reset Password screen. Bypassing automatic guard redirects.');
      return;
    }

    if (!isAuthenticated && !inAuthGroup) {
      console.log('[RootLayout] Redirecting to login: /login');
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      console.log('[RootLayout] Redirecting to dashboard: /');
      router.replace('/(tabs)/');
    }
  }, [isAuthenticated, isLoading, isRecoveringPassword, segments]);

  // Synchronize Android system navigation bar styling dynamically based on theme store
  useEffect(() => {
    if (Platform.OS === 'android') {
      NavigationBar.setBackgroundColorAsync(colors.background).catch(() => {});
      NavigationBar.setButtonStyleAsync(isDark ? 'light' : 'dark').catch(() => {});
    }
  }, [isDark, colors.background]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
      />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="generate/[templateId]" options={{ presentation: 'card' }} />
        <Stack.Screen name="generate/polling" options={{ presentation: 'card' }} />
        <Stack.Screen name="result/[jobId]" options={{ presentation: 'card' }} />
        <Stack.Screen name="settings/index" options={{ presentation: 'modal' }} />
        <Stack.Screen name="paywall" options={{ presentation: 'modal' }} />
      </Stack>
      <InternetBottomSheet />
    </SafeAreaView>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <InternetProvider>
        <RevenueCatProvider>
          <QueryClientProvider client={queryClient}>
            <SafeAreaProvider>
              <RootLayoutContent />
            </SafeAreaProvider>
          </QueryClientProvider>
        </RevenueCatProvider>
      </InternetProvider>
    </GestureHandlerRootView>
  );
}

