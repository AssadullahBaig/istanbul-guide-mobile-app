import { supabase } from './supabase';

// Etkinlikleri veritabanından çeken ana fonksiyon
export async function getEvents() {
  try {
    // events tablosundan her şeyi çek (Gerekirse places tablosuyla da birleştirilebilir)
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('start_date', { ascending: true }); // Tarihe göre yakından uzağa sırala

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error("Etkinlikler çekilirken Supabase hatası:", error);
    throw error;
  }
}