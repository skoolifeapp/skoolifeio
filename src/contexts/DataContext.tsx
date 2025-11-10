import { createContext, useContext, ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthContext";

interface DataContextType {
  exams: any[];
  calendarEvents: any[];
  revisionSessions: any[];
  constraintsProfile: any;
  workSchedules: any[];
  activities: any[];
  routineMoments: any[];
  isLoading: boolean;
  refetchAll: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Précharger tous les examens
  const { data: exams = [] } = useQuery({
    queryKey: ["exams", user?.id],
    queryFn: async () => {
      if (!user) return [];
      console.log('Fetching exams for user:', user.id);
      const { data, error } = await supabase
        .from("exams")
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: true });
      
      console.log('Exams fetched:', data, 'Error:', error);
      return data || [];
    },
    enabled: !!user,
    staleTime: 0, // Désactiver le cache temporairement pour debug
  });

  // Précharger les événements du calendrier
  const { data: calendarEvents = [] } = useQuery({
    queryKey: ["calendar_events", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from("calendar_events")
        .select("*")
        .eq("user_id", user.id);
      return data || [];
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
  });

  // Précharger les sessions de révision
  const { data: revisionSessions = [] } = useQuery({
    queryKey: ["revision_sessions", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from("revision_sessions")
        .select("*")
        .eq("user_id", user.id);
      return data || [];
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
  });

  // Précharger le profil de contraintes
  const { data: constraintsProfile } = useQuery({
    queryKey: ["constraints_profile", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase
        .from("user_constraints_profile")
        .select("*")
        .eq("user_id", user.id)
        .single();
      return data;
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
  });

  // Précharger les work schedules
  const { data: workSchedules = [] } = useQuery({
    queryKey: ["work_schedules", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from("work_schedules")
        .select("*")
        .eq("user_id", user.id);
      return data || [];
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
  });

  // Précharger les activités
  const { data: activities = [] } = useQuery({
    queryKey: ["activities", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from("activities")
        .select("*")
        .eq("user_id", user.id);
      return data || [];
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
  });

  // Précharger les routine moments
  const { data: routineMoments = [] } = useQuery({
    queryKey: ["routine_moments", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from("routine_moments")
        .select("*")
        .eq("user_id", user.id);
      return data || [];
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
  });

  const refetchAll = () => {
    queryClient.invalidateQueries({ queryKey: ["exams"] });
    queryClient.invalidateQueries({ queryKey: ["calendar_events"] });
    queryClient.invalidateQueries({ queryKey: ["revision_sessions"] });
    queryClient.invalidateQueries({ queryKey: ["constraints_profile"] });
    queryClient.invalidateQueries({ queryKey: ["work_schedules"] });
    queryClient.invalidateQueries({ queryKey: ["activities"] });
    queryClient.invalidateQueries({ queryKey: ["routine_moments"] });
  };

  const isLoading = !user;

  return (
    <DataContext.Provider
      value={{
        exams,
        calendarEvents,
        revisionSessions,
        constraintsProfile,
        workSchedules,
        activities,
        routineMoments,
        isLoading,
        refetchAll,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error("useData must be used within DataProvider");
  }
  return context;
};
