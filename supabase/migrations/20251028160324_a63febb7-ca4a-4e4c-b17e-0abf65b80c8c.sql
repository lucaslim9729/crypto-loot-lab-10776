-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  balance DECIMAL(20, 2) DEFAULT 1000.00 NOT NULL CHECK (balance >= 0),
  total_wagered DECIMAL(20, 2) DEFAULT 0 NOT NULL,
  total_won DECIMAL(20, 2) DEFAULT 0 NOT NULL,
  referral_code TEXT UNIQUE NOT NULL,
  referred_by UUID REFERENCES public.profiles(id),
  is_admin BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Game history table
CREATE TABLE public.game_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  game_type TEXT NOT NULL,
  bet_amount DECIMAL(20, 2) NOT NULL,
  payout DECIMAL(20, 2) DEFAULT 0,
  result JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Deposits table
CREATE TABLE public.deposits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(20, 2) NOT NULL,
  currency TEXT DEFAULT 'USDT',
  network TEXT DEFAULT 'BEP-20',
  tx_hash TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  verification_type TEXT DEFAULT 'auto' CHECK (verification_type IN ('auto', 'manual')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Withdrawals table
CREATE TABLE public.withdrawals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(20, 2) NOT NULL,
  currency TEXT DEFAULT 'USDT',
  network TEXT DEFAULT 'BEP-20',
  wallet_address TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Raffles table
CREATE TABLE public.raffles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  ticket_price DECIMAL(20, 2) NOT NULL,
  total_tickets INTEGER NOT NULL,
  sold_tickets INTEGER DEFAULT 0,
  prizes JSONB NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  draw_date TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Raffle tickets table
CREATE TABLE public.raffle_tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  raffle_id UUID REFERENCES public.raffles(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  ticket_number INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(raffle_id, ticket_number)
);

-- Support tickets table
CREATE TABLE public.support_tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'closed')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Support ticket replies table
CREATE TABLE public.ticket_replies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ticket_id UUID REFERENCES public.support_tickets(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  message TEXT NOT NULL,
  is_staff BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Announcements table
CREATE TABLE public.announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message TEXT NOT NULL,
  type TEXT DEFAULT 'win' CHECK (type IN ('win', 'promotion', 'update', 'warning')),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deposits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.raffles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.raffle_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE)
);

-- RLS Policies for game_history
CREATE POLICY "Users can view own game history" ON public.game_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own game history" ON public.game_history FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for deposits
CREATE POLICY "Users can view own deposits" ON public.deposits FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create deposits" ON public.deposits FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all deposits" ON public.deposits FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE)
);
CREATE POLICY "Admins can update deposits" ON public.deposits FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE)
);

-- RLS Policies for withdrawals
CREATE POLICY "Users can view own withdrawals" ON public.withdrawals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create withdrawals" ON public.withdrawals FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all withdrawals" ON public.withdrawals FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE)
);
CREATE POLICY "Admins can update withdrawals" ON public.withdrawals FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE)
);

-- RLS Policies for raffles
CREATE POLICY "Everyone can view active raffles" ON public.raffles FOR SELECT USING (status = 'active' OR auth.uid() IS NOT NULL);
CREATE POLICY "Admins can manage raffles" ON public.raffles FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE)
);

-- RLS Policies for raffle_tickets
CREATE POLICY "Users can view own tickets" ON public.raffle_tickets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can buy tickets" ON public.raffle_tickets FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for support_tickets
CREATE POLICY "Users can view own tickets" ON public.support_tickets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create tickets" ON public.support_tickets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all tickets" ON public.support_tickets FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE)
);

-- RLS Policies for ticket_replies
CREATE POLICY "Users can view replies to own tickets" ON public.ticket_replies FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.support_tickets WHERE id = ticket_id AND user_id = auth.uid())
);
CREATE POLICY "Users can reply to own tickets" ON public.ticket_replies FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.support_tickets WHERE id = ticket_id AND user_id = auth.uid())
);

-- RLS Policies for announcements
CREATE POLICY "Everyone can view active announcements" ON public.announcements FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Admins can manage announcements" ON public.announcements FOR ALL USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = TRUE)
);

-- Function to generate unique referral code
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TEXT AS $$
DECLARE
  code TEXT;
  exists_code BOOLEAN;
BEGIN
  LOOP
    code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8));
    SELECT EXISTS(SELECT 1 FROM public.profiles WHERE referral_code = code) INTO exists_code;
    EXIT WHEN NOT exists_code;
  END LOOP;
  RETURN code;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, referral_code)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1)),
    generate_referral_code()
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update balance after game
CREATE OR REPLACE FUNCTION update_user_balance()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles
  SET 
    balance = balance - NEW.bet_amount + NEW.payout,
    total_wagered = total_wagered + NEW.bet_amount,
    total_won = total_won + NEW.payout
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_game_played
  AFTER INSERT ON public.game_history
  FOR EACH ROW EXECUTE FUNCTION update_user_balance();