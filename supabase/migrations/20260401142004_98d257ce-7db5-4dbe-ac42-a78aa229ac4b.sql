
-- Trigger function to auto-assign admin role to the first user
CREATE OR REPLACE FUNCTION public.auto_assign_first_admin()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if there are no admins yet
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  ELSE
    -- Assign funcionario role by default
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.user_id, 'funcionario')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger on profiles table
DROP TRIGGER IF EXISTS trigger_auto_assign_first_admin ON public.profiles;
CREATE TRIGGER trigger_auto_assign_first_admin
AFTER INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.auto_assign_first_admin();
