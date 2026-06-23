import { useMutation } from '@tanstack/react-query';
import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';

// Complete session callbacks on Web
if (Platform.OS === 'web') {
  WebBrowser.maybeCompleteAuthSession();
}

interface LoginParams {
  email: string;
  password?: string;
  provider?: 'google' | 'apple';
}

export const useLogin = () => {
  return useMutation({
    mutationFn: async ({ email, password, provider }: LoginParams) => {
      // Clear explicit logout flag so the auth listener can receive the new session
      useAuthStore.getState().clearExplicitLogout();

      if (provider) {
        console.log(`[useLogin] OAuth login attempt with provider: ${provider}`);
        
        // Define redirect URL dynamically. Linking.createURL('login') automatically constructs
        // the correct URL scheme/IP depending on Expo Go vs Standalone Dev Client vs Web.
        const redirectTo = Linking.createURL('login');

        console.log('═══════════════════════════════════════════');
        console.log('🔑 Supabase OAuth Redirect Configuration Info');
        console.log('👉 Please ensure this EXACT URL is whitelisted in your Supabase Dashboard under Allowed Redirect URLs:');
        console.log(`   ${redirectTo}`);
        console.log('👉 Or add wildcards to cover it:');
        console.log('   exp://**');
        console.log('   travelphotoexpo://**');
        console.log('═══════════════════════════════════════════');

        console.log(`[useLogin] OAuth redirect URL: ${redirectTo}`);

        const { data, error } = await supabase.auth.signInWithOAuth({
          provider,
          options: {
            redirectTo,
            skipBrowserRedirect: Platform.OS !== 'web',
          },
        });

        if (error) {
          console.error('[useLogin] OAuth error:', error.message, error);
          throw error;
        }

        console.log('[useLogin] OAuth initialization success:', data);

        // For mobile platforms, manually launch the browser session
        if (Platform.OS !== 'web' && data?.url) {
          const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
          
          if (result.type === 'success' && result.url) {
            console.log('[useLogin] WebBrowser success, parsing tokens/codes from url:', result.url);
            
            const url = result.url;
            const params: Record<string, string> = {};
            
            // Parse hash fragment parameters (Implicit Grant Flow)
            const hashIndex = url.indexOf('#');
            if (hashIndex !== -1) {
              const hash = url.substring(hashIndex + 1);
              const searchParams = new URLSearchParams(hash);
              searchParams.forEach((value, key) => {
                params[key] = value;
              });
            }
            
            // Parse query parameters (PKCE Flow)
            const queryIndex = url.indexOf('?');
            if (queryIndex !== -1) {
              const hashBoundary = hashIndex !== -1 && hashIndex > queryIndex ? hashIndex : url.length;
              const query = url.substring(queryIndex + 1, hashBoundary);
              const searchParams = new URLSearchParams(query);
              searchParams.forEach((value, key) => {
                params[key] = value;
              });
            }

            // Handle errors returned in the callback URL
            if (params.error) {
              const errorDescription = params.error_description || params.error;
              console.error('[useLogin] OAuth callback redirect error:', errorDescription);
              throw new Error(decodeURIComponent(errorDescription));
            }

            // Check if PKCE code is present and exchange it for a session
            const code = params.code;
            if (code) {
              console.log('[useLogin] Exchanging PKCE code for session...');
              const { error: sessionError } = await supabase.auth.exchangeCodeForSession(code);
              if (sessionError) {
                console.error('[useLogin] exchangeCodeForSession error:', sessionError.message);
                throw sessionError;
              }
              console.log('[useLogin] PKCE exchange successful. Session created.');
            } 
            // Fallback to Implicit flow tokens if present
            else {
              const access_token = params.access_token;
              const refresh_token = params.refresh_token;
              
              if (access_token && refresh_token) {
                console.log('[useLogin] Setting session from implicit flow tokens...');
                const { error: sessionError } = await supabase.auth.setSession({
                  access_token,
                  refresh_token,
                });
                if (sessionError) {
                  console.error('[useLogin] setSession error:', sessionError.message);
                  throw sessionError;
                }
                console.log('[useLogin] Session set successfully.');
              } else {
                console.warn('[useLogin] Neither PKCE code nor implicit flow tokens were found in redirected URL:', url);
                throw new Error('No authentication details found in the redirect callback URL.');
              }
            }
          } else if (result.type === 'cancel') {
            console.log('[useLogin] OAuth session cancelled by user.');
            throw new Error('Login cancelled by user.');
          } else {
            console.warn('[useLogin] WebBrowser closed with type:', result.type);
          }
        }
        
        return data;
      }

      if (!password) throw new Error('Password is required for email login.');

      console.log(`[useLogin] Email login attempt for: ${email}`);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('[useLogin] Login failed:', error.message, '| status:', error.status, '| code:', error.code);
        throw new Error(error.message);
      }

      console.log('[useLogin] Login SUCCESS:', {
        userId: data.user?.id,
        email: data.user?.email,
        confirmed: data.user?.email_confirmed_at,
        sessionExpiry: data.session?.expires_at,
      });

      return data;
    },
  });
};
