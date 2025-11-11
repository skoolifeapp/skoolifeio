import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { generateOccurrences } from "./occurrence-generator";

/**
 * Récupère les exceptions d'occurrences pour un événement récurrent
 */
export async function getRecurringExceptions(userId: string, parentEventId: string) {
  const { data, error } = await supabase
    .from('recurring_event_exceptions')
    .select('*, new_event:calendar_events!new_event_id(*)')
    .eq('user_id', userId)
    .eq('parent_event_id', parentEventId);

  if (error) {
    console.error('Error loading recurring exceptions:', error);
    return [];
  }

  return data || [];
}

/**
 * Génère les occurrences pour un événement récurrent en tenant compte des exceptions
 */
export async function generateOccurrencesWithExceptions(
  event: any,
  userId: string,
  monthsAhead: number = 3
) {
  // Générer toutes les occurrences de base
  const baseOccurrences = generateOccurrences(
    {
      days: event.days_of_week || [],
      start_time: event.start_time,
      end_time: event.end_time,
    },
    monthsAhead
  );

  // Récupérer les exceptions
  const exceptions = await getRecurringExceptions(userId, event.id);

  // Créer une map des dates d'exception
  const exceptionMap = new Map();
  exceptions.forEach((exc: any) => {
    exceptionMap.set(exc.exception_date, exc.new_event);
  });

  // Remplacer ou supprimer les occurrences selon les exceptions
  return baseOccurrences
    .map((occurrence) => {
      const occurrenceDate = format(new Date(occurrence.start_date), 'yyyy-MM-dd');
      
      if (exceptionMap.has(occurrenceDate)) {
        const newEvent = exceptionMap.get(occurrenceDate);
        
        // Si new_event est null, cette occurrence est supprimée
        if (!newEvent) return null;
        
        // Sinon, remplacer par l'événement modifié
        return {
          ...event,
          ...newEvent,
          isException: true,
          parentEventId: event.id,
        };
      }
      
      // Occurrence normale
      return {
        ...event,
        start_date: occurrence.start_date,
        end_date: occurrence.end_date,
        occurrenceDate,
      };
    })
    .filter(Boolean); // Retirer les occurrences nulles (supprimées)
}

/**
 * Crée une exception pour une occurrence spécifique (modification ou suppression)
 */
export async function createOccurrenceException(
  userId: string,
  parentEventId: string,
  occurrenceDate: string,
  modifiedEventData?: any
) {
  // Vérifier si une exception existe déjà pour cette date
  const { data: existingException } = await supabase
    .from('recurring_event_exceptions')
    .select('*')
    .eq('user_id', userId)
    .eq('parent_event_id', parentEventId)
    .eq('exception_date', occurrenceDate)
    .maybeSingle();

  let newEventId = null;

  // Si des données modifiées sont fournies, créer ou mettre à jour un événement
  if (modifiedEventData) {
    if (existingException?.new_event_id) {
      // Mettre à jour l'événement existant
      const { error: updateError } = await supabase
        .from('calendar_events')
        .update({
          ...modifiedEventData,
          user_id: userId,
          is_recurring: false,
          days_of_week: null,
        })
        .eq('id', existingException.new_event_id);

      if (updateError) throw updateError;
      newEventId = existingException.new_event_id;
    } else {
      // Créer un nouvel événement
      const { data: newEvent, error: insertError } = await supabase
        .from('calendar_events')
        .insert([{
          ...modifiedEventData,
          user_id: userId,
          is_recurring: false,
          days_of_week: null,
        }])
        .select()
        .single();

      if (insertError) throw insertError;
      newEventId = newEvent.id;
    }
  }

  if (existingException) {
    // Mettre à jour l'exception existante
    const { error } = await supabase
      .from('recurring_event_exceptions')
      .update({
        new_event_id: newEventId,
      })
      .eq('id', existingException.id);

    if (error) throw error;
  } else {
    // Créer une nouvelle exception
    const { error } = await supabase
      .from('recurring_event_exceptions')
      .insert([{
        user_id: userId,
        parent_event_id: parentEventId,
        exception_date: occurrenceDate,
        new_event_id: newEventId,
      }]);

    if (error) throw error;
  }

  return newEventId;
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
    .eq('id', parentEventId);

  if (error) throw error;
}

/**
 * Supprime une occurrence spécifique d'un événement récurrent
 */
export async function deleteOccurrence(
  userId: string,
  parentEventId: string,
  occurrenceDate: string
) {
  return createOccurrenceException(userId, parentEventId, occurrenceDate);
}

/**
 * Supprime toutes les occurrences d'un événement récurrent
 */
export async function deleteAllOccurrences(parentEventId: string) {
  // Supprime l'événement parent et les exceptions via CASCADE
  const { error } = await supabase
    .from('calendar_events')
    .delete()
    .eq('id', parentEventId);

  if (error) throw error;
}
