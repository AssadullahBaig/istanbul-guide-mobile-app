import { supabase } from './supabase';

export const recommendationService = {
  async getPersonalizedRecommendations(userId: string) {
    try {
      const { data: interests, error: interestError } = await supabase
        .from('user_interests')
        .select('category_id')
        .eq('user_id', userId);

      if (interestError) throw interestError;

      if (!interests || interests.length === 0) {
         return []; 
      }

      const categoryIds = interests.map(i => i.category_id);

      const { data: places, error: placesError } = await supabase
        .from('places')
        .select('*')
        .in('category_id', categoryIds);

      if (placesError) throw placesError;

      return places || [];
    } catch (error) {
      console.error("Error fetching recommendations:", error);
      throw error;
    }
  }
};