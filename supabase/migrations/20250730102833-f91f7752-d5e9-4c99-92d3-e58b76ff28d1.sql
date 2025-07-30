-- Fix function search path security warnings
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