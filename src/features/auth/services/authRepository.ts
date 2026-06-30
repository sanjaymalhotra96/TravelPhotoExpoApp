import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/shared/lib/supabase';

export interface IAuthRepository {
  signInWithOAuth(provider: 'google' | 'apple', redirectTo: string, skipBrowserRedirect: boolean): Promise<any>;
  exchangeCodeForSession(code: string): Promise<any>;
  setSession(access_token: string, refresh_token: string): Promise<any>;
  signInWithPassword(email: string, password: string): Promise<any>;
  signUp(email: string, password: string): Promise<any>;
  signOut(scope?: 'local' | 'global' | 'others'): Promise<any>;
  onAuthStateChange(callback: (event: any, session: Session | null) => void): { data: { subscription: { unsubscribe: () => void } } };
  getSession(): Promise<any>;
}

export class SupabaseAuthRepository implements IAuthRepository {
  async signInWithOAuth(provider: 'google' | 'apple', redirectTo: string, skipBrowserRedirect: boolean) {
    return supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo,
        skipBrowserRedirect,
      },
    });
  }

  async exchangeCodeForSession(code: string) {
    return supabase.auth.exchangeCodeForSession(code);
  }

  async setSession(access_token: string, refresh_token: string) {
    return supabase.auth.setSession({
      access_token,
      refresh_token,
    });
  }

  async signInWithPassword(email: string, password: string) {
    return supabase.auth.signInWithPassword({
      email,
      password,
    });
  }

  async signUp(email: string, password: string) {
    return supabase.auth.signUp({
      email,
      password,
    });
  }

  async signOut(scope: 'local' | 'global' | 'others' = 'local') {
    return supabase.auth.signOut({ scope });
  }

  onAuthStateChange(callback: (event: any, session: Session | null) => void) {
    return supabase.auth.onAuthStateChange(callback);
  }

  async getSession() {
    return supabase.auth.getSession();
  }
}

export const authRepository = new SupabaseAuthRepository();
