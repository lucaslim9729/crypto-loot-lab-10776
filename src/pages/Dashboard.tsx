import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AnnouncementTicker } from "@/components/AnnouncementTicker";
import { UserBalance } from "@/components/UserBalance";
import { LogOut, Wallet, Users, LifeBuoy, Gift, TrendingUp, TrendingDown } from "lucide-react";
import { toast } from "sonner";
import lotteryIcon from "@/assets/lottery-icon.png";
import scratchIcon from "@/assets/scratch-icon.png";
import runnerIcon from "@/assets/runner-icon.png";
import chestIcon from "@/assets/chest-icon.png";

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      navigate("/auth");
      return;
    }

    setUser(user);

    const { data: profileData } = await supabase
      .from("profiles" as any)
      .select("*")
      .eq("id", user.id)
      .single();

    if (profileData) setProfile(profileData);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logged out successfully");
    navigate("/");
  };

  const games = [
    { title: "Lottery", icon: lotteryIcon, path: "/games/lottery" },
    { title: "Scratch Card", icon: scratchIcon, path: "/games/scratch" },
    { title: "Endless Runner", icon: runnerIcon, path: "/games/runner" },
    { title: "Mystery Chest", icon: chestIcon, path: "/games/chest" },
  ];

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <AnnouncementTicker />

      {/* Header */}
      <header className="bg-card border-b border-border px-6 py-4">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Crypto Gaming
          </h1>
          <div className="flex items-center gap-4">
            {profile && (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 px-4 py-2 bg-gradient-primary rounded-lg">
                  <Wallet className="h-4 w-4 text-primary-foreground" />
                  <div className="flex flex-col">
                    <span className="text-xs text-primary-foreground/80">Balance</span>
                    <span className="font-bold text-primary-foreground">
                      ${profile.balance?.toFixed(2) || '0.00'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-gradient-card border border-border rounded-lg">
                  <TrendingDown className="h-4 w-4 text-destructive" />
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">Wagered</span>
                    <span className="font-semibold text-foreground">
                      ${profile.total_wagered?.toFixed(2) || '0.00'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-gradient-card border border-border rounded-lg">
                  <TrendingUp className="h-4 w-4 text-accent" />
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">Won</span>
                    <span className="font-semibold text-foreground">
                      ${profile.total_won?.toFixed(2) || '0.00'}
                    </span>
                  </div>
                </div>
              </div>
            )}
            <span className="text-muted-foreground">
              {profile?.username || user.email}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        <UserBalance />

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Button
            className="h-20 bg-gradient-primary hover:shadow-glow-primary"
            onClick={() => navigate("/deposit")}
          >
            <Wallet className="mr-2 h-5 w-5" />
            Deposit
          </Button>
          <Button
            variant="outline"
            className="h-20"
            onClick={() => navigate("/withdraw")}
          >
            <Wallet className="mr-2 h-5 w-5" />
            Withdraw
          </Button>
          <Button
            variant="outline"
            className="h-20"
            onClick={() => navigate("/referral")}
          >
            <Users className="mr-2 h-5 w-5" />
            Referrals
          </Button>
          <Button
            variant="outline"
            className="h-20"
            onClick={() => navigate("/support")}
          >
            <LifeBuoy className="mr-2 h-5 w-5" />
            Support
          </Button>
        </div>

        {/* Games Grid */}
        <h2 className="text-3xl font-bold mb-6 bg-gradient-primary bg-clip-text text-transparent">
          Play Games
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {games.map((game) => (
            <Card
              key={game.title}
              className="group bg-gradient-card border-border p-6 hover:scale-105 transition-all duration-300 hover:shadow-glow-primary cursor-pointer"
              onClick={() => navigate(game.path)}
            >
              <img
                src={game.icon}
                alt={game.title}
                className="w-20 h-20 mx-auto mb-4 rounded-2xl group-hover:animate-float"
              />
              <h3 className="text-xl font-bold text-center text-foreground">
                {game.title}
              </h3>
            </Card>
          ))}
        </div>

        {/* Referral Card */}
        {profile && (
          <Card className="bg-gradient-gold p-6 text-primary-foreground">
            <div className="flex items-center gap-4">
              <Gift className="h-12 w-12" />
              <div>
                <h3 className="text-2xl font-bold mb-2">Your Referral Code</h3>
                <p className="text-3xl font-mono font-bold tracking-wider">
                  {profile.referral_code}
                </p>
                <p className="mt-2 opacity-90">
                  Share this code and earn bonuses when friends sign up!
                </p>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Dashboard;