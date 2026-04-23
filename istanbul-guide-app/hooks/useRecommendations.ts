import { useEffect, useState } from "react";
import { supabase } from "../services/supabase";
import { recommendationService } from "../services/recommendation.services";

export function useRecommendations() {
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    async function fetchRecommendations() {
      try {
        setLoading(true);
        setError(null);
        
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          if (isActive) setRecommendations([]);
          return;
        }

        const data = await recommendationService.getPersonalizedRecommendations(user.id);

        if (isActive) {
          setRecommendations(data);
        }
      } catch (err) {
        if (isActive) {
          setError(err instanceof Error ? err.message : "Failed to load recommendations.");
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    }

    fetchRecommendations();

    return () => {
      isActive = false;
    };
  }, []);

  return { recommendations, loading, error };
}