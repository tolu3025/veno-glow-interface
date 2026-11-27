-- Migration: Add unique constraints to prevent duplicate user registrations by phone or matric number
CREATE UNIQUE INDEX IF NOT EXISTS profiles_phone_number_key
  ON public.profiles (phone_number)
  WHERE phone_number IS NOT NULL AND phone_number != '';

CREATE UNIQUE INDEX IF NOT EXISTS profiles_university_matric_key
  ON public.profiles (lower(trim(university)), lower(trim(matric_number)))
  WHERE matric_number IS NOT NULL AND matric_number != '';
