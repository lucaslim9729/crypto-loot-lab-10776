import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { DollarSign, TrendingUp, TrendingDown } from "lucide-react";

interface Profile {
  balance: number;
  total_wagered: number;
  total_won: number;
}

export const UserBalance = () => {
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    fetchProfile();

    const channel = supabase
      .channel("profile-changes")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "profiles",
        },
        () => {
          fetchProfile();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await (supabase as any)
      .from("profiles")
      .select("balance, total_wagered, total_won")
      .eq("id", user.id)
      .single();

    if (data) setProfile(data);
  };

  if (!profile) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <Card className="bg-gradient-card border-border p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Balance</p>
            <p className="text-3xl font-bold text-foreground">
              ${profile.balance.toFixed(2)}
            </p>
          </div>
          <DollarSign className="h-12 w-12 text-primary" />
        </div>
      </Card>

      <Card className="bg-gradient-card border-border p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Total Wagered</p>
            <p className="text-2xl font-bold text-foreground">
              ${profile.total_wagered.toFixed(2)}
            </p>
          </div>
          <TrendingDown className="h-12 w-12 text-destructive" />
        </div>
      </Card>

      <Card className="bg-gradient-card border-border p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Total Won</p>
            <p className="text-2xl font-bold text-foreground">
              ${profile.total_won.toFixed(2)}
            </p>
          </div>
          <TrendingUp className="h-12 w-12 text-accent" />
        </div>
      </Card>
    </div>
  );
};
