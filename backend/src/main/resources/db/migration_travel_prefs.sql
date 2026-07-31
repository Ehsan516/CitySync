BEGIN;

ALTER TABLE public.user_preferences
    ADD COLUMN IF NOT EXISTS preferred_mode        character varying(24) DEFAULT 'TRANSIT',
    ADD COLUMN IF NOT EXISTS transit_modes         character varying(64),
    ADD COLUMN IF NOT EXISTS transit_routing_pref  character varying(24),
    ADD COLUMN IF NOT EXISTS return_buffer_minutes integer DEFAULT 0;

UPDATE public.user_preferences SET preferred_mode = 'TRANSIT' WHERE preferred_mode IS NULL;
UPDATE public.user_preferences SET return_buffer_minutes = 0 WHERE return_buffer_minutes IS NULL;

ALTER TABLE public.user_preferences
    ALTER COLUMN preferred_mode SET NOT NULL,
    ALTER COLUMN return_buffer_minutes SET NOT NULL;

ALTER TABLE public.user_preferences
    DROP CONSTRAINT IF EXISTS user_preferences_preferred_mode_chk;
ALTER TABLE public.user_preferences
    ADD CONSTRAINT user_preferences_preferred_mode_chk
    CHECK (preferred_mode IN ('TRANSIT', 'DRIVE', 'WALK', 'BICYCLE', 'TWO_WHEELER'));

ALTER TABLE public.user_preferences
    DROP CONSTRAINT IF EXISTS user_preferences_transit_routing_pref_chk;
ALTER TABLE public.user_preferences
    ADD CONSTRAINT user_preferences_transit_routing_pref_chk
    CHECK (transit_routing_pref IS NULL OR transit_routing_pref IN ('LESS_WALKING', 'FEWER_TRANSFERS'));

ALTER TABLE public.user_preferences
    DROP CONSTRAINT IF EXISTS user_preferences_return_buffer_minutes_chk;
ALTER TABLE public.user_preferences
    ADD CONSTRAINT user_preferences_return_buffer_minutes_chk
    CHECK (return_buffer_minutes >= 0 AND return_buffer_minutes <= 300);

COMMIT;
