import { supabase } from './supabase';

export const userService = {
  // FETCH ALL AVAILABLE CATEGORIES
  async getCategories() {
    const { data, error } = await supabase.from('categories').select('*');
    if (error) throw error;
    return data;
  },


  async getUserInterests(userId: string) {
    const { data, error } = await supabase
      .from('user_interests')
      .select('category_id')
      .eq('user_id', userId);
    
    if (error) throw error;
    return data.map(item => item.category_id);
  },


  async saveUserInterests(userId: string, categoryIds: string[]) {
    const { error: deleteError } = await supabase
      .from('user_interests')
      .delete()
      .eq('user_id', userId);

    if (deleteError) throw deleteError;

    if (categoryIds.length > 0) {
      const inserts = categoryIds.map(id => ({
        user_id: userId,
        category_id: id
      }));

      const { error: insertError } = await supabase
        .from('user_interests')
        .insert(inserts);

      if (insertError) throw insertError;
    }
  }
};