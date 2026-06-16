import { useMutation } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';

interface RegisterParams {
  email: string;
  password?: string;
}

export const useRegister = () => {
  return useMutation({
    mutationFn: async ({ email, password }: RegisterParams) => {
      // Clear explicit logout flag so the auth listener can receive the new session
      useAuthStore.getState().clearExplicitLogout();
      if (!password) throw new Error('Password is required.');

      console.log(`[useRegister] Signup attempt for: ${email}`);

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        console.error('[useRegister] Signup failed:', error.message, '| status:', error.status, '| code:', error.code);
        throw new Error(error.message);
      }

      console.log('[useRegister] Signup response:', {
        userId: data.user?.id,
        email: data.user?.email,
        identities: data.user?.identities?.length,
        confirmed: data.user?.email_confirmed_at,
        // If identities is empty array [] → email already registered
        // If confirmed is null → email confirmation required
      });

      // Supabase returns a user even if email confirmation is required
      // Check if the user already exists (identities will be empty)
      if (data.user && data.user.identities && data.user.identities.length === 0) {
        console.warn('[useRegister] User already exists with this email!');
        throw new Error('An account with this email already exists. Please log in instead.');
      }

      if (data.user && !data.user.email_confirmed_at) {
        console.log('[useRegister] Email confirmation required — check your inbox.');
      }

      return data;
    },
  });
};
