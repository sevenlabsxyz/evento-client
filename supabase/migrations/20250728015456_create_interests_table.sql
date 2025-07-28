
CREATE TABLE IF NOT EXISTS public.interests (
		id TEXT PRIMARY KEY,
		label TEXT NOT NULL,
		category TEXT NOT NULL,
		created_at TIMESTAMPTZ NOT NULL DEFAULT
NOW(),
		updated_at TIMESTAMPTZ NOT NULL DEFAULT
NOW()
);


CREATE INDEX idx_interests_category ON
public.interests(category);
CREATE OR REPLACE FUNCTION
public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
		NEW.updated_at = NOW();
		RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_interests_updated_at
		BEFORE UPDATE ON public.interests
		FOR EACH ROW
		EXECUTE FUNCTION
public.update_updated_at_column();

ALTER TABLE public.interests ENABLE ROW LEVEL SECURITY;








