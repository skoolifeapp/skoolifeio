import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface LocalExam {
  id: string;
  subject: string;
  date: string;
  priority: string;
}

interface LocalConstraint {
  id: string;
  type: string;
  days: string[];
}

interface LocalEvent {
  summary: string;
  startDate: string;
  endDate: string;
  location?: string;
  description?: string;
}

export const useMigrateLocalStorageToSupabase = () => {
  const { user } = useAuth();
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationComplete, setMigrationComplete] = useState(false);

  useEffect(() => {
    if (user && !isMigrating && !migrationComplete) {
      migrateData();
    }
  }, [user]);

  const migrateData = async () => {
    if (!user) return;

    // Check if migration was already done for this user
    const migrationKey = `migration_completed_${user.id}`;
    const alreadyMigrated = localStorage.getItem(migrationKey);
    
    if (alreadyMigrated === 'true') {
      setMigrationComplete(true);
      return;
    }

    setIsMigrating(true);
    console.log('Starting localStorage to Supabase migration...');

    try {
      let hasDataToMigrate = false;
      const results = {
        exams: 0,
        constraints: 0,
        events: 0,
      };

      // 1. Migrate Exams
      const examsData = localStorage.getItem('exams');
      if (examsData) {
        try {
          const exams: LocalExam[] = JSON.parse(examsData);
          if (exams.length > 0) {
            hasDataToMigrate = true;
            
            // Check if exams already exist in Supabase
            const { count } = await supabase
              .from('exams')
              .select('*', { count: 'exact', head: true })
              .eq('user_id', user.id);

            // Only migrate if no exams exist in Supabase
            if (count === 0) {
              const examsToInsert = exams.map(exam => ({
                user_id: user.id,
                subject: exam.subject,
                date: exam.date,
                priority: exam.priority,
              }));

              const { error, data } = await supabase
                .from('exams')
                .insert(examsToInsert)
                .select();

              if (error) {
                console.error('Error migrating exams:', error);
              } else {
                results.exams = data?.length || 0;
                console.log(`Migrated ${results.exams} exams`);
              }
            }
          }
        } catch (error) {
          console.error('Error parsing exams from localStorage:', error);
        }
      }

      // 2. Skip old constraints migration (table structure changed)
      const constraintsData = localStorage.getItem('constraints');
      if (constraintsData) {
        // Just remove old constraints data without migrating
        localStorage.removeItem('constraints');
        console.log('Removed old constraints data (table structure changed)');
      }

      // 3. Migrate Imported Events (calendar)
      const eventsData = localStorage.getItem('importedEvents');
      if (eventsData) {
        try {
          const events: LocalEvent[] = JSON.parse(eventsData);
          if (events.length > 0) {
            hasDataToMigrate = true;

            // Check if events already exist
            const { count } = await supabase
              .from('calendar_events')
              .select('*', { count: 'exact', head: true })
              .eq('user_id', user.id);

            if (count === 0) {
              const eventsToInsert = events.map(event => ({
                user_id: user.id,
                summary: event.summary,
                start_date: event.startDate,
                end_date: event.endDate,
                location: event.location || null,
                description: event.description || null,
              }));

              const { error, data } = await supabase
                .from('calendar_events')
                .insert(eventsToInsert)
                .select();

              if (error) {
                console.error('Error migrating calendar events:', error);
              } else {
                results.events = data?.length || 0;
                console.log(`Migrated ${results.events} calendar events`);
              }
            }
          }
        } catch (error) {
          console.error('Error parsing calendar events from localStorage:', error);
        }
      }

      // Mark migration as complete
      localStorage.setItem(migrationKey, 'true');
      setMigrationComplete(true);

      // Mark migration as complete
      if (hasDataToMigrate) {
        const totalMigrated = results.exams + results.constraints + results.events;
        if (totalMigrated > 0) {

          // Clean up localStorage after successful migration
          localStorage.removeItem('exams');
          localStorage.removeItem('constraints');
          localStorage.removeItem('importedEvents');
          
          console.log('Migration complete. LocalStorage cleaned up.');
        }
      }

    } catch (error) {
      console.error('Migration error:', error);
      toast.error('Erreur lors de la migration des données', {
        description: 'Vos données locales n\'ont pas pu être transférées.',
      });
    } finally {
      setIsMigrating(false);
    }
  };

  return { isMigrating, migrationComplete };
};