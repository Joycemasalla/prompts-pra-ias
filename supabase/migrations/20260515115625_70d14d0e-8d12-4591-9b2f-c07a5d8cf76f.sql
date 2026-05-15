
-- Roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "Users see own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Prompts
CREATE TABLE public.prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category TEXT NOT NULL,
  prompt TEXT NOT NULL,
  image TEXT NOT NULL,
  position INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.prompts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read prompts" ON public.prompts
  FOR SELECT USING (true);

CREATE POLICY "Admins can insert prompts" ON public.prompts
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update prompts" ON public.prompts
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete prompts" ON public.prompts
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER prompts_set_updated_at BEFORE UPDATE ON public.prompts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Storage bucket for prompt images
INSERT INTO storage.buckets (id, name, public) VALUES ('prompt-images', 'prompt-images', true);

CREATE POLICY "Public read prompt images" ON storage.objects
  FOR SELECT USING (bucket_id = 'prompt-images');

CREATE POLICY "Admins upload prompt images" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'prompt-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update prompt images" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'prompt-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete prompt images" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'prompt-images' AND public.has_role(auth.uid(), 'admin'));
