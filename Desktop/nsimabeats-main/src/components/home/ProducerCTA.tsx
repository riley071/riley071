import { ArrowRight, TrendingUp, Shield, DollarSign, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const benefits = [
  {
    icon: DollarSign,
    title: "Competitive Payouts",
    description: "Earn up to 80% on every sale",
  },
  {
    icon: Users,
    title: "Global Reach",
    description: "Connect with artists worldwide",
  },
  {
    icon: Shield,
    title: "Protected Content",
    description: "Your beats, your rights",
  },
  {
    icon: TrendingUp,
    title: "Growth Tools",
    description: "Analytics & promotion",
  },
];

const ProducerCTA = () => {
  return (
    <section className="py-20 md:py-32 bg-gradient-to-br from-card via-card/50 to-background relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-[150px]" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent/10 rounded-full blur-[100px]" />
      
      <div className="container relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Content */}
          <div>
            <span className="text-sm font-medium text-primary uppercase tracking-wider mb-4 block">
              For Producers
            </span>
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6">
              Turn Your Beats Into
              <span className="text-gradient-gold block">Revenue</span>
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-lg">
              Join Africa's fastest-growing beat marketplace. Upload your beats, 
              set your prices, and start earning from your craft.
            </p>
            
            <Link to="/apply">
              <Button variant="hero" className="group">
                Apply as Producer
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </div>

          {/* Benefits Grid */}
          <div className="grid sm:grid-cols-2 gap-6">
            {benefits.map((benefit, index) => (
              <div
                key={index}
                className="p-6 rounded-2xl bg-surface/50 border border-border hover:border-primary/30 hover:bg-surface transition-all duration-300 group"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <benefit.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-display font-semibold text-foreground mb-2">
                  {benefit.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ProducerCTA;
