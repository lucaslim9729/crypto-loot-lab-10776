-- =====================================================
-- MISSION 1 & 4: Fix RLS Recursion + Proper User Roles
-- =====================================================

-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  granted_by uuid REFERENCES auth.users(id),
  granted_at timestamptz DEFAULT now(),
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles (prevents recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Migrate existing admins to user_roles table
INSERT INTO public.user_roles (user_id, role, granted_at)
SELECT id, 'admin'::app_role, created_at
FROM public.profiles
WHERE is_admin = true;

-- RLS policy for user_roles (only admins can manage roles)
CREATE POLICY "Only admins can manage roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Drop the recursive admin policies and recreate with has_role function
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all deposits" ON public.deposits;
DROP POLICY IF EXISTS "Admins can update deposits" ON public.deposits;
DROP POLICY IF EXISTS "Admins can view all withdrawals" ON public.withdrawals;
DROP POLICY IF EXISTS "Admins can update withdrawals" ON public.withdrawals;
DROP POLICY IF EXISTS "Admins can view all tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Admins can manage raffles" ON public.raffles;
DROP POLICY IF EXISTS "Admins can manage announcements" ON public.announcements;

-- Recreate policies using security definer function
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view all deposits"
ON public.deposits
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update deposits"
ON public.deposits
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view all withdrawals"
ON public.withdrawals
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update withdrawals"
ON public.withdrawals
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can view all tickets"
ON public.support_tickets
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage raffles"
ON public.raffles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage announcements"
ON public.announcements
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- =====================================================
-- MISSION 3: Game Balance Locking (Prevent Race Conditions)
-- =====================================================

-- Create atomic game play function with row locking
CREATE OR REPLACE FUNCTION public.play_game(
  _game_type text,
  _bet_amount numeric,
  _payout numeric,
  _result jsonb DEFAULT '{}'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id uuid := auth.uid();
  _game_id uuid;
  _current_balance numeric;
BEGIN
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Lock the user's profile row to prevent race conditions
  SELECT balance INTO _current_balance
  FROM profiles
  WHERE id = _user_id
  FOR UPDATE;
  
  -- Check sufficient balance
  IF _current_balance < _bet_amount THEN
    RAISE EXCEPTION 'Insufficient balance. Current: %, Required: %', _current_balance, _bet_amount;
  END IF;
  
  -- Insert game history
  INSERT INTO game_history (user_id, game_type, bet_amount, payout, result)
  VALUES (_user_id, _game_type, _bet_amount, _payout, _result)
  RETURNING id INTO _game_id;
  
  -- Update balance atomically
  UPDATE profiles
  SET 
    balance = balance - _bet_amount + _payout,
    total_wagered = total_wagered + _bet_amount,
    total_won = total_won + _payout
  WHERE id = _user_id;
  
  RETURN _game_id;
END;
$$;

-- Remove the trigger since we're using RPC now
DROP TRIGGER IF EXISTS update_balance_trigger ON public.game_history;

-- Keep the function for backward compatibility but make it no-op
CREATE OR REPLACE FUNCTION public.update_user_balance()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- This is now handled by play_game RPC
  -- Kept for any legacy direct inserts
  UPDATE public.profiles
  SET 
    balance = balance - NEW.bet_amount + NEW.payout,
    total_wagered = total_wagered + NEW.bet_amount,
    total_won = total_won + NEW.payout
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$;