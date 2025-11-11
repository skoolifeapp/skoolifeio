import { addMonths, eachDayOfInterval, format } from "date-fns";

export const DAYS_MAP: Record<string, number> = {
  'lundi': 1,
  'mardi': 2,
  'mercredi': 3,
  'jeudi': 4,
  'vendredi': 5,
  'samedi': 6,
  'dimanche': 0
};

interface RecurringEvent {
  days: string[];
  start_time: string;
  end_time: string;
}

export interface EventOccurrence {
  start_date: string;
  end_date: string;
}

/**
 * Génère toutes les occurrences d'un événement récurrent pour les N prochains mois
 */
export function generateOccurrences(
  event: RecurringEvent,
  monthsAhead: number = 3
): EventOccurrence[] {
  const today = new Date();
  const endDate = addMonths(today, monthsAhead);
  
  // Obtenir tous les jours dans l'intervalle
  const allDays = eachDayOfInterval({ start: today, end: endDate });
  
  // Filtrer seulement les jours qui correspondent
  const occurrences: EventOccurrence[] = [];
  
  for (const day of allDays) {
    const dayOfWeek = day.getDay(); // 0 = dimanche, 1 = lundi, etc.
    
    // Vérifier si ce jour est dans la liste des jours souhaités
    const matchesDay = event.days.some(requestedDay => {
      const requestedDayNum = DAYS_MAP[requestedDay];
      return dayOfWeek === requestedDayNum;
    });
    
    if (matchesDay) {
      const dateStr = format(day, 'yyyy-MM-dd');
      occurrences.push({
        start_date: `${dateStr}T${event.start_time}:00`,
        end_date: `${dateStr}T${event.end_time}:00`,
      });
    }
  }
  
  return occurrences;
}
