import { create } from 'zustand';
import { User, Session } from '@supabase/supabase-js';
import { router } from 'expo-router';
import { supabase } from '../lib/supabase';


interface AuthState {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isRecoveringPassword: boolean;
  setSession: (session: Session | null) => void;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setRecoveringPassword: (isRecovering: boolean) => void;
  clearExplicitLogout: () => void;
  logout: () => Promise<void>;
}

let explicitlyLoggedOut = false;

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  isAuthenticated: false,
  isLoading: true, // Start as loading, set to false once the listener receives the session state
  isRecoveringPassword: false,
  setSession: (session) => {
    set({
      session,
      isAuthenticated: !!session,
      user: session?.user ?? null,
    });
  },
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setLoading: (isLoading) => set({ isLoading }),
  setRecoveringPassword: (isRecoveringPassword) => set({ isRecoveringPassword }),
  clearExplicitLogout: () => {
    console.log('[authStore] clearExplicitLogout called. Resetting flag to false...');
    explicitlyLoggedOut = false;
  },
  logout: async () => {
    console.log('[authStore] logout called. Setting explicitlyLoggedOut to true...');
    explicitlyLoggedOut = true;
    set({ user: null, session: null, isAuthenticated: false, isLoading: false });
    
    try {
      console.log('[authStore] calling supabase.auth.signOut({ scope: "local" }) in background...');
      await supabase.auth.signOut({ scope: 'local' });
      console.log('[authStore] supabase.auth.signOut({ scope: "local" }) completed.');
    } catch (e) {
      console.error('[authStore] Sign out background error:', e);
    }
  },
}));

// Setup authentication change listener to dynamically manage and synchronize the session
supabase.auth.onAuthStateChange((event, session) => {
  if (__DEV__) {
    console.log(`[authStore] onAuthStateChange event: ${event}`, session?.user?.email);
  }

  if (explicitlyLoggedOut && session !== null) {
    console.log('[authStore] Ignoring session restore event because user explicitly logged out.');
    return;
  }
  
  useAuthStore.getState().setSession(session);
  useAuthStore.getState().setLoading(false);

  if (event === 'PASSWORD_RECOVERY') {
    console.log('[authStore] PASSWORD_RECOVERY event detected. Redirecting to reset-password screen...');
    useAuthStore.getState().setRecoveringPassword(true);
    setTimeout(() => {
      router.replace('/(auth)/reset-password');
    }, 0);
  }
});
