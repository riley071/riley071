import { ArrowRight, Play, Headphones, Users, Music, ChevronDown, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import heroBg from "@/assets/hero-bg.jpg";
import HeroWaveform from "@/components/ui/HeroWaveform";

const HeroSection = () => {
  const stats = [
    { icon: Music, value: "10K+", label: "Premium Beats" },
    { icon: Users, value: "500+", label: "Producers" },
    { icon: Headphones, value: "50K+", label: "Artists Served" },
  ];

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-background">
      {/* Background Image with Ken Burns effect */}
      <motion.div 
        className="absolute inset-0"
        initial={{ scale: 1.1 }}
        animate={{ scale: 1 }}
        transition={{ duration: 20, ease: "linear" }}
      >
        <img
          src={heroBg}
          alt="Nsimabeats background"
          className="w-full h-full object-cover"
        />
        {/* Gradient overlays for depth */}
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/85 to-background" />
        <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-background" />
      </motion.div>

      {/* Animated musical background */}
      <HeroWaveform />

      {/* Ambient glow - subtle and elegant */}
      <motion.div 
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{ 
          background: "radial-gradient(circle, hsl(var(--primary) / 0.15) 0%, transparent 60%)",
        }}
        animate={{ 
          scale: [1, 1.2, 1],
          opacity: [0.5, 0.8, 0.5]
        }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Content - Clean, centered, impactful */}
      <div className="container relative z-10 pt-32 pb-24">
        <div className="max-w-4xl mx-auto text-center">
          
          {/* Animated Badge */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary/10 border border-primary/30 mb-10"
          >
            <motion.span 
              className="w-2 h-2 rounded-full bg-primary"
              animate={{ scale: [1, 1.4, 1], opacity: [1, 0.6, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <span className="text-sm font-semibold tracking-wide text-primary uppercase">
              Africa's #1 Beat Marketplace
            </span>
          </motion.div>

          {/* Hero Headline */}
          <motion.h1 
            className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-8"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <span className="text-foreground">Find Your</span>
            <br />
            <motion.span 
              className="text-gradient-gold inline-block"
              animate={{ 
                opacity: [0.7, 1, 0.7],
                filter: ["brightness(0.9)", "brightness(1.2)", "brightness(0.9)"]
              }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              Perfect Sound
            </motion.span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p 
            className="text-lg md:text-xl lg:text-2xl text-muted-foreground max-w-2xl mx-auto mb-12 leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            Discover premium beats from Africa's finest producers. 
            <br className="hidden sm:block" />
            License exclusive sounds for your next hit track.
          </motion.p>

          {/* CTA Buttons - Clean, prominent */}
          <motion.div 
            className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <Link to="/marketplace">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button variant="hero" size="lg" className="text-base px-8 py-6 gap-3 group">
                  Browse Beats
                  <motion.span
                    className="group-hover:translate-x-1 transition-transform"
                  >
                    <ArrowRight className="w-5 h-5" />
                  </motion.span>
                </Button>
              </motion.div>
            </Link>
            <Link to="/apply">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button variant="hero-outline" size="lg" className="text-base px-8 py-6 gap-3">
                  <Upload className="w-5 h-5" />
                  Upload Beats. Earn Money.
                </Button>
              </motion.div>
            </Link>
            <Link to="/apply">
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.98 }}
              >
                <Button variant="ghost" size="lg" className="text-base px-8 py-6 gap-3">
                  Become a Verified Producer
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </motion.div>
            </Link>
          </motion.div>

          {/* Stats - Elegant row */}
          <motion.div 
            className="flex items-center justify-center gap-8 md:gap-16"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.8 }}
          >
            {stats.map((stat, index) => (
              <motion.div 
                key={index} 
                className="text-center group"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 1 + index * 0.1 }}
                whileHover={{ y: -4 }}
              >
                <div className="flex items-center justify-center gap-2 mb-1">
                  <stat.icon className="w-4 h-4 text-primary opacity-70 group-hover:opacity-100 transition-opacity" />
                  <span className="font-display text-2xl md:text-3xl font-bold text-foreground">
                    {stat.value}
                  </span>
                </div>
                <span className="text-xs md:text-sm text-muted-foreground uppercase tracking-wider">
                  {stat.label}
                </span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Bottom waveform bar - refined visualization */}
      <div className="absolute bottom-0 left-0 right-0 h-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent z-10" />
        <div className="flex items-end justify-center h-full gap-[3px] px-4">
          {Array.from({ length: 80 }).map((_, i) => {
            const centerDistance = Math.abs(i - 40) / 40;
            const baseHeight = 80 - centerDistance * 60;
            return (
              <motion.div
                key={i}
                className="w-1 md:w-1.5 rounded-t-full bg-gradient-to-t from-primary/60 to-gold/40"
                initial={{ height: baseHeight * 0.3 }}
                animate={{
                  height: [
                    baseHeight * 0.3,
                    baseHeight,
                    baseHeight * 0.5,
                    baseHeight * 0.8,
                    baseHeight * 0.3,
                  ],
                }}
                transition={{
                  duration: 2.5,
                  delay: i * 0.02,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            );
          })}
        </div>
      </div>

      {/* Scroll indicator - inspired by BickLaw */}
      <motion.div 
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
      >
        <span className="text-xs uppercase tracking-widest text-muted-foreground">Scroll</span>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <ChevronDown className="w-5 h-5 text-primary" />
        </motion.div>
      </motion.div>
    </section>
  );
};

export default HeroSection;