-- Fix function search path security warnings by dropping constraints first
ALTER TABLE public.assessments DROP CONSTRAINT IF EXISTS valid_assessment_answers;
ALTER TABLE public.tapping_sessions DROP CONSTRAINT IF EXISTS valid_initial_intensity;
ALTER TABLE public.tapping_sessions DROP CONSTRAINT IF EXISTS valid_final_intensity;

-- Drop functions
DROP FUNCTION IF EXISTS validate_assessment_answers(integer[]);
DROP FUNCTION IF EXISTS validate_intensity(integer);

-- Recreate functions with proper search path
CREATE OR REPLACE FUNCTION validate_assessment_answers(answers integer[])
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Check if all answers are between 0 and 3
  RETURN (
    SELECT bool_and(answer >= 0 AND answer <= 3)
    FROM unnest(answers) AS answer
  );
END;
$$;

CREATE OR REPLACE FUNCTION validate_intensity(intensity integer)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN intensity >= 0 AND intensity <= 10;
END;
$$;

-- Recreate constraints
ALTER TABLE public.assessments 
ADD CONSTRAINT valid_assessment_answers 
CHECK (validate_assessment_answers(answers));

ALTER TABLE public.tapping_sessions 
ADD CONSTRAINT valid_initial_intensity 
CHECK (validate_intensity(initial_intensity));

ALTER TABLE public.tapping_sessions 
ADD CONSTRAINT valid_final_intensity 
CHECK (final_intensity IS NULL OR validate_intensity(final_intensity));