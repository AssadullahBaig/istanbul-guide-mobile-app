import { useEffect, useState } from "react";
import { getEvents } from "../services/events.services";

export function useEvents() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    async function loadEvents() {
      try {
        setLoading(true);
        setError(null);

        const data = await getEvents();

        if (isActive) {
          setEvents(data);
        }
      } catch (err) {
        if (isActive) {
          setError(err instanceof Error ? err.message : "Failed to load events");
        }
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    }

    loadEvents();

    return () => {
      isActive = false;
    };
  }, []);

  return {
    events,
    loading,
    error,
  };
}