import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Sparkles, Trophy, Ticket, Gift, Zap } from "lucide-react";
import heroImage from "@/assets/hero-bg.jpg";
import lotteryIcon from "@/assets/lottery-icon.png";
import scratchIcon from "@/assets/scratch-icon.png";
import runnerIcon from "@/assets/runner-icon.png";
import chestIcon from "@/assets/chest-icon.png";

const Index = () => {
  const navigate = useNavigate();

  const games = [
    {
      id: "lottery",
      title: "Lottery",
      description: "Scheduled draws with big prizes",
      icon: lotteryIcon,
      path: "/games/lottery",
    },
    {
      id: "scratch",
      title: "Scratch Card",
      description: "Instant win prizes",
      icon: scratchIcon,
      path: "/games/scratch",
    },
    {
      id: "runner",
      title: "Endless Runner",
      description: "Collect coins and multipliers",
      icon: runnerIcon,
      path: "/games/runner",
    },
    {
      id: "chest",
      title: "Mystery Chest",
      description: "Open chests for rewards",
      icon: chestIcon,
      path: "/games/chest",
    },
  ];

  const features = [
    { icon: Sparkles, title: "Instant Withdrawals", desc: "Cash out anytime" },
    { icon: Trophy, title: "Fair Gaming", desc: "Provably fair algorithm" },
    { icon: Ticket, title: "Mega Raffles", desc: "Win big prizes" },
    { icon: Gift, title: "Referral Bonus", desc: "Earn from friends" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section
        className="relative h-screen flex items-center justify-center overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.7), rgba(15, 23, 42, 0.9)), url(${heroImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="container mx-auto px-4 text-center z-10">
          <h1 className="text-6xl md:text-8xl font-bold mb-6 bg-gradient-primary bg-clip-text text-transparent animate-fade-in">
            Win Big with Crypto
          </h1>
          <p className="text-xl md:text-2xl text-foreground/80 mb-8 max-w-2xl mx-auto">
            The future of online gaming. Play fair, win big, withdraw instantly.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Button
              size="lg"
              className="bg-gradient-primary text-primary-foreground hover:shadow-glow-primary text-lg px-8"
              onClick={() => navigate("/auth")}
            >
              <Zap className="mr-2 h-5 w-5" />
              Start Playing
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-primary text-lg px-8"
              onClick={() => navigate("/dashboard")}
            >
              View Dashboard
            </Button>
          </div>
        </div>
      </section>

      {/* Games Section */}
      <section className="py-20 px-4 bg-gradient-to-b from-background to-card">
        <div className="container mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-4 bg-gradient-primary bg-clip-text text-transparent">
            Choose Your Game
          </h2>
          <p className="text-center text-muted-foreground mb-12 text-lg">
            Four exciting ways to win
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {games.map((game) => (
              <Card
                key={game.id}
                className="group bg-gradient-card border-border p-6 hover:scale-105 transition-all duration-300 hover:shadow-glow-primary cursor-pointer"
                onClick={() => navigate(game.path)}
              >
                <div className="relative mb-4">
                  <img
                    src={game.icon}
                    alt={game.title}
                    className="w-24 h-24 mx-auto rounded-2xl group-hover:animate-float"
                  />
                </div>
                <h3 className="text-2xl font-bold text-center mb-2 text-foreground">
                  {game.title}
                </h3>
                <p className="text-center text-muted-foreground">
                  {game.description}
                </p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-12 bg-gradient-primary bg-clip-text text-transparent">
            Why Choose Us
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, i) => (
              <Card
                key={i}
                className="bg-gradient-card border-border p-6 text-center hover:scale-105 transition-all"
              >
                <feature.icon className="h-12 w-12 mx-auto mb-4 text-primary" />
                <h3 className="text-xl font-bold mb-2 text-foreground">
                  {feature.title}
                </h3>
                <p className="text-muted-foreground">{feature.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-primary">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-primary-foreground">
            Ready to Start Winning?
          </h2>
          <p className="text-xl mb-8 text-primary-foreground/80">
            Join thousands of players winning every day
          </p>
          <Button
            size="lg"
            className="bg-background text-foreground hover:bg-background/90 text-lg px-8"
            onClick={() => navigate("/auth")}
          >
            Create Free Account
          </Button>
        </div>
      </section>
    </div>
  );
};

export default Index;