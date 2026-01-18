import { Search, Music2, CreditCard, Download } from "lucide-react";

const steps = [
  {
    icon: Search,
    title: "Browse & Discover",
    description: "Explore thousands of beats. Filter by genre, mood, BPM, and more to find your perfect sound.",
  },
  {
    icon: Music2,
    title: "Preview & Choose",
    description: "Listen to high-quality previews. Add your favorites to cart and select your license type.",
  },
  {
    icon: CreditCard,
    title: "Secure Checkout",
    description: "Pay safely with mobile money (Mpamba, Airtel) or card. Instant payment confirmation.",
  },
  {
    icon: Download,
    title: "Download & Create",
    description: "Get instant access to your beats and license. Start creating your next hit track.",
  },
];

const HowItWorks = () => {
  return (
    <section className="py-20 md:py-32 bg-background relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[150px]" />
      
      <div className="container relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16">
          <span className="text-sm font-medium text-primary uppercase tracking-wider mb-4 block">
            Simple Process
          </span>
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            How It Works
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Getting started is easy. Find your beat, make your purchase, and start creating.
          </p>
        </div>

        {/* Steps */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div
              key={index}
              className="relative group"
            >
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-12 left-1/2 w-full h-px bg-gradient-to-r from-border via-primary/30 to-border" />
              )}
              
              <div className="relative flex flex-col items-center text-center p-6">
                {/* Step Number */}
                <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-primary text-primary-foreground font-display font-bold text-sm flex items-center justify-center shadow-lg">
                  {index + 1}
                </div>
                
                {/* Icon */}
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-surface to-surface-elevated border border-border flex items-center justify-center mb-6 group-hover:border-primary/50 group-hover:shadow-[0_0_30px_-10px_hsl(38,92%,50%,0.4)] transition-all duration-300">
                  <step.icon className="w-8 h-8 text-primary" />
                </div>
                
                {/* Content */}
                <h3 className="font-display font-semibold text-lg text-foreground mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
