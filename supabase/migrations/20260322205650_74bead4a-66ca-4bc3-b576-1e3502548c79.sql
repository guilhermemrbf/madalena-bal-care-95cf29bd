
-- Update handle_new_user to auto-assign admin role to first user, funcionario to others
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_count INT;
BEGIN
  -- Create profile
  INSERT INTO public.profiles (user_id, full_name, avatar_initials)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    UPPER(LEFT(COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), 2))
  );

  -- Check if this is the first user
  SELECT COUNT(*) INTO user_count FROM auth.users;

  -- First user gets admin, rest get funcionario
  IF user_count <= 1 THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'funcionario');
  END IF;

  RETURN NEW;
END;
$$;
