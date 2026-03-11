
-- Create membership plans table
CREATE TABLE public.membership_plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_name TEXT NOT NULL,
  duration_days INTEGER NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  description TEXT,
  features TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.membership_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view plans" ON public.membership_plans
  FOR SELECT USING (true);

-- Create members table
CREATE TABLE public.members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  address TEXT,
  age INTEGER,
  gender TEXT,
  membership_plan_id UUID REFERENCES public.membership_plans(id),
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  expiry_date DATE NOT NULL,
  payment_status TEXT NOT NULL DEFAULT 'pending',
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;

-- Create user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Members RLS
CREATE POLICY "Admins can view all members" ON public.members
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert members" ON public.members
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update members" ON public.members
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete members" ON public.members
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can register as member" ON public.members
  FOR INSERT TO anon WITH CHECK (true);

-- Plans admin policies
CREATE POLICY "Admins can insert plans" ON public.membership_plans
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update plans" ON public.membership_plans
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- User roles RLS
CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Renewal history
CREATE TABLE public.renewal_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id UUID REFERENCES public.members(id) ON DELETE CASCADE NOT NULL,
  previous_expiry DATE NOT NULL,
  new_expiry DATE NOT NULL,
  plan_id UUID REFERENCES public.membership_plans(id),
  renewed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  renewed_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.renewal_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view renewals" ON public.renewal_history
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert renewals" ON public.renewal_history
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_members_updated_at
  BEFORE UPDATE ON public.members
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default plans
INSERT INTO public.membership_plans (plan_name, duration_days, price, description, features) VALUES
  ('Basic', 30, 29.99, 'Perfect for beginners', ARRAY['Gym access', 'Locker room', 'Basic equipment']),
  ('Pro', 90, 79.99, 'Most popular choice', ARRAY['All Basic features', 'Group classes', 'Personal trainer (2 sessions)', 'Sauna access']),
  ('Elite', 365, 249.99, 'Ultimate fitness experience', ARRAY['All Pro features', 'Unlimited PT sessions', 'Nutrition plan', 'Priority booking', 'Guest passes']);
