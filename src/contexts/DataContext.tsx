import { createContext, useContext, ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./AuthContext";

interface DataContextType {
  exams: any[];
  calendarEvents: any[];
  revisionSessions: any[];
  constraintsProfile: any;
  userMeals: any[];
  userCommutes: any[];
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
      const { data } = await supabase
        .from("exams")
        .select("*")
        .eq("user_id", user.id)
        .order("date", { ascending: true });
      return data || [];
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Précharger les événements du calendrier (tous les types: school, work, sport, others)
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
        .maybeSingle();
      return data;
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
  });

  // Précharger les repas
  const { data: userMeals = [] } = useQuery({
    queryKey: ["user_meals", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from("user_meals")
        .select("*")
        .eq("user_id", user.id)
        .order("start_time", { ascending: true });
      return data || [];
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
  });

  // Précharger les trajets
  const { data: userCommutes = [] } = useQuery({
    queryKey: ["user_commutes", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await supabase
        .from("user_commutes")
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
    queryClient.invalidateQueries({ queryKey: ["user_meals"] });
    queryClient.invalidateQueries({ queryKey: ["user_commutes"] });
  };

  const isLoading = !user;

  return (
    <DataContext.Provider
      value={{
        exams,
        calendarEvents,
        revisionSessions,
        constraintsProfile,
        userMeals,
        userCommutes,
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
