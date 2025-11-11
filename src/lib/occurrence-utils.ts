import { supabase } from "@/integrations/supabase/client";

/**
 * Modifie une occurrence spécifique d'un événement récurrent
 */
export async function updateOccurrence(
  occurrenceId: string,
  updates: any
) {
  const { error } = await supabase
    .from('calendar_events')
    .update(updates)
    .eq('id', occurrenceId);

  if (error) throw error;
}

/**
 * Modifie toutes les occurrences d'un événement récurrent
 */
export async function updateAllOccurrences(
  parentEventId: string,
  updates: any
) {
  const { error } = await supabase
    .from('calendar_events')
    .update(updates)
    .eq('parent_recurring_id', parentEventId);

  if (error) throw error;
}

/**
 * Supprime une occurrence spécifique d'un événement récurrent
 */
export async function deleteOccurrence(occurrenceId: string) {
  const { error } = await supabase
    .from('calendar_events')
    .delete()
    .eq('id', occurrenceId);

  if (error) throw error;
}

/**
 * Supprime toutes les occurrences d'un événement récurrent
 */
export async function deleteAllOccurrences(parentEventId: string) {
  const { error } = await supabase
    .from('calendar_events')
    .delete()
    .eq('parent_recurring_id', parentEventId);

  if (error) throw error;
}
