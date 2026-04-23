import { supabase } from './supabase';

export const authService = {
  async signUp(email: string, password: string, name: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
        },
      },
    });

    if (error) throw error;

    if (data.user) {
      const { error: userInsertError } = await supabase
        .from("users")
        .upsert({
          id: data.user.id,
          email,
          name,
        });

      if (userInsertError) {
        console.error("Failed to create users row:", userInsertError);
      }
    }

    return data;
  },

  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data;
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },
};