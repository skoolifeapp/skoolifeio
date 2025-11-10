import { createContext, useContext, useState, ReactNode } from 'react';

interface PlanningState {
  selectedDate: Date;
}

interface ExamsState {
  activeFilter: 'upcoming' | 'all' | 'past' | 'high';
  scrollPosition: number;
}

interface ConstraintsState {
  activeTab: 'travail' | 'activite' | 'routine' | 'trajet';
}

interface NavigationState {
  planning: PlanningState;
  exams: ExamsState;
  constraints: ConstraintsState;
}

interface NavigationStateContextType {
  state: NavigationState;
  setPlanningDate: (date: Date) => void;
  setExamsFilter: (filter: 'upcoming' | 'all' | 'past' | 'high') => void;
  setExamsScrollPosition: (position: number) => void;
  setConstraintsTab: (tab: 'travail' | 'activite' | 'routine' | 'trajet') => void;
}

const NavigationStateContext = createContext<NavigationStateContextType | undefined>(undefined);

export const NavigationStateProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<NavigationState>({
    planning: {
      selectedDate: new Date(),
    },
    exams: {
      activeFilter: 'upcoming',
      scrollPosition: 0,
    },
    constraints: {
      activeTab: 'travail',
    },
  });

  const setPlanningDate = (date: Date) => {
    setState(prev => ({
      ...prev,
      planning: { ...prev.planning, selectedDate: date },
    }));
  };

  const setExamsFilter = (filter: 'upcoming' | 'all' | 'past' | 'high') => {
    setState(prev => ({
      ...prev,
      exams: { ...prev.exams, activeFilter: filter },
    }));
  };

  const setExamsScrollPosition = (position: number) => {
    setState(prev => ({
      ...prev,
      exams: { ...prev.exams, scrollPosition: position },
    }));
  };

  const setConstraintsTab = (tab: 'travail' | 'activite' | 'routine' | 'trajet') => {
    setState(prev => ({
      ...prev,
      constraints: { ...prev.constraints, activeTab: tab },
    }));
  };

  return (
    <NavigationStateContext.Provider
      value={{
        state,
        setPlanningDate,
        setExamsFilter,
        setExamsScrollPosition,
        setConstraintsTab,
      }}
    >
      {children}
    </NavigationStateContext.Provider>
  );
};

export const useNavigationState = () => {
  const context = useContext(NavigationStateContext);
  if (context === undefined) {
    throw new Error('useNavigationState must be used within a NavigationStateProvider');
  }
  return context;
};
