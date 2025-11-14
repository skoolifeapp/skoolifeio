import { supabase } from "@/integrations/supabase/client";

export type IntensityLevel = 'leger' | 'standard' | 'intensif';

export interface GeneratePlanningParams {
  intensity?: IntensityLevel;
}

export interface GeneratePlanningResult {
  success: boolean;
  count?: number;
  error?: string;
  metadata?: {
    total_sessions: number;
    total_hours: number;
    subjects_covered: Record<string, number>;
    warnings?: string[];
  };
}

export const generateRevisionPlanning = async (
  params: GeneratePlanningParams = {}
): Promise<GeneratePlanningResult> => {
  try {
    const { data, error } = await supabase.functions.invoke('generate-revision-plan', {
      body: { 
        intensity: params.intensity || 'standard',
        commit: true // CRITICAL: Must be true to actually insert sessions in DB
      },
    });

    if (error) {
      console.error('Edge function error:', error);
      return {
        success: false,
        error: error.message || 'Erreur lors de la génération du planning',
      };
    }

    if (data.error) {
      return {
        success: false,
        error: data.error,
      };
    }

    return {
      success: true,
      count: data.count,
      metadata: data.metadata,
    };
  } catch (error) {
    console.error('Failed to generate revision planning:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    };
  }
};
