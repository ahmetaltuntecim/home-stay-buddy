-- Enable pg_net extension if not enabled
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create a helper function to call our Edge Function
-- Replace YOUR_PROJECT_REF with your Supabase Project Reference ID
-- You can find it in your project URL: https://[YOUR_PROJECT_REF].supabase.co
CREATE OR REPLACE FUNCTION public.notify_admin_on_event()
RETURNS TRIGGER AS $$
DECLARE
  project_ref TEXT := 'aofucnqflppforjhhqtn'; -- Found in .env: VITE_SUPABASE_PROJECT_ID
  jwt_secret TEXT := current_setting('vault.service_role_key', true); -- Secure way to get service role key if available
  payload JSONB;
BEGIN
  -- Construct payload
  payload := jsonb_build_object(
    'table', TG_TABLE_NAME,
    'record', row_to_json(NEW),
    'type', TG_OP
  );

  -- For new user requests, we only want to notify if they are NOT approved (pending approval)
  IF (TG_TABLE_NAME = 'profiles' AND NEW.approved = true) THEN
    RETURN NEW;
  END IF;

  -- Call the Edge Function via HTTP POST
  -- Note: We use the project's internal URL or the public one. 
  -- In production, the service role key should be sent for authentication.
  PERFORM net.http_post(
    url := 'https://' || project_ref || '.supabase.co/functions/v1/notify-admin',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || jwt_secret
    ),
    body := payload
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for New User (Profiles)
DROP TRIGGER IF EXISTS on_profile_created_notification ON public.profiles;
CREATE TRIGGER on_profile_created_notification
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admin_on_event();

-- Trigger for New Bookings
DROP TRIGGER IF EXISTS on_booking_created_notification ON public.bookings;
CREATE TRIGGER on_booking_created_notification
  AFTER INSERT ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_admin_on_event();
