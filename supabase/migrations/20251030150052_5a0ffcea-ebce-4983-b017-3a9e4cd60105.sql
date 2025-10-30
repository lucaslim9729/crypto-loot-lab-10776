-- Fix the last function search_path warning
CREATE OR REPLACE FUNCTION public.update_user_balance()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
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