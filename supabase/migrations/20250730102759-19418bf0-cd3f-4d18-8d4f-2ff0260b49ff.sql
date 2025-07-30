-- Add missing DELETE policies for all tables
CREATE POLICY "Users can delete their own assessments" 
ON public.assessments 
FOR DELETE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own chat sessions" 
ON public.chat_sessions 
FOR DELETE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own profiles" 
ON public.profiles 
FOR DELETE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tapping sessions" 
ON public.tapping_sessions 
FOR DELETE 
USING (auth.uid() = user_id);

-- Add missing UPDATE policy for assessments
CREATE POLICY "Users can update their own assessments" 
ON public.assessments 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create function to validate assessment answers
CREATE OR REPLACE FUNCTION validate_assessment_answers(answers integer[])
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  -- Check if all answers are between 0 and 3
  RETURN (
    SELECT bool_and(answer >= 0 AND answer <= 3)
    FROM unnest(answers) AS answer
  );
END;
$$;

-- Add constraint to validate assessment answers
ALTER TABLE public.assessments 
ADD CONSTRAINT valid_assessment_answers 
CHECK (validate_assessment_answers(answers));

-- Create function to validate intensity range
CREATE OR REPLACE FUNCTION validate_intensity(intensity integer)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  RETURN intensity >= 0 AND intensity <= 10;
END;
$$;

-- Add constraints for intensity validation
ALTER TABLE public.tapping_sessions 
ADD CONSTRAINT valid_initial_intensity 
CHECK (validate_intensity(initial_intensity));

ALTER TABLE public.tapping_sessions 
ADD CONSTRAINT valid_final_intensity 
CHECK (final_intensity IS NULL OR validate_intensity(final_intensity));