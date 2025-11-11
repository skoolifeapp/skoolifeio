-- Create user_meals table
CREATE TABLE public.user_meals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  meal_type TEXT NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_commutes table
CREATE TABLE public.user_commutes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  destination TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_commutes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_meals
CREATE POLICY "Users can view their own meals"
ON public.user_meals
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own meals"
ON public.user_meals
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own meals"
ON public.user_meals
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own meals"
ON public.user_meals
FOR DELETE
USING (auth.uid() = user_id);

-- RLS Policies for user_commutes
CREATE POLICY "Users can view their own commutes"
ON public.user_commutes
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own commutes"
ON public.user_commutes
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own commutes"
ON public.user_commutes
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own commutes"
ON public.user_commutes
FOR DELETE
USING (auth.uid() = user_id);

-- Add triggers for updated_at
CREATE TRIGGER update_user_meals_updated_at
BEFORE UPDATE ON public.user_meals
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_user_commutes_updated_at
BEFORE UPDATE ON public.user_commutes
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();