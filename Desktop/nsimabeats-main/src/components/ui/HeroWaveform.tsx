import { motion } from "framer-motion";
import { Music, Music2, Music3, Music4 } from "lucide-react";

const HeroWaveform = () => {
  // Equalizer-style bars - like audio visualizer but slower and more elegant
  const barCount = 60;
  
  // Musical notes for the dancing animation
  const musicalNotes = [Music, Music2, Music3, Music4];
  const noteCount = 12;
  
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {/* Main equalizer bars - growing from bottom, spanning full width */}
      <div className="absolute bottom-0 left-0 right-0 h-full flex items-end justify-between px-0">
        {Array.from({ length: barCount }).map((_, i) => {
          // Create a wave pattern - bars in center are taller
          const centerIndex = barCount / 2;
          const distanceFromCenter = Math.abs(i - centerIndex) / centerIndex;
          const baseHeight = 85 - distanceFromCenter * 50;
          const minHeight = 15 + distanceFromCenter * 10;
          
          return (
            <motion.div
              key={i}
              className="flex-1 rounded-t-sm mx-px"
              style={{
                background: `linear-gradient(to top, hsl(var(--primary) / 0.12), hsl(var(--gold) / 0.06))`,
              }}
              animate={{
                height: [
                  `${minHeight}%`,
                  `${baseHeight}%`,
                  `${minHeight + (baseHeight - minHeight) * 0.4}%`,
                  `${baseHeight * 0.7}%`,
                  `${minHeight}%`,
                ],
              }}
              transition={{
                duration: 6 + (i % 7) * 0.8,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.1,
              }}
            />
          );
        })}
      </div>

      {/* Overlay gradient for fade effect at top */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background/60 to-transparent pointer-events-none" />
      
      {/* Dancing musical notes from left to right */}
      <div className="absolute bottom-20 left-0 right-0 h-32 overflow-hidden">
        {Array.from({ length: noteCount }).map((_, i) => {
          const NoteIcon = musicalNotes[i % musicalNotes.length];
          const yOffset = Math.sin(i * 0.8) * 30;
          const size = 16 + (i % 3) * 8;
          
          return (
            <motion.div
              key={i}
              className="absolute text-primary/30"
              style={{
                top: `${40 + yOffset}%`,
              }}
              animate={{
                x: ["-10%", "110vw"],
                y: [0, -20, 10, -15, 5, 0],
                rotate: [0, 15, -10, 20, -5, 0],
                opacity: [0, 0.4, 0.6, 0.5, 0.3, 0],
              }}
              transition={{
                duration: 12 + i * 2,
                repeat: Infinity,
                ease: "linear",
                delay: i * 1.5,
                y: {
                  duration: 3,
                  repeat: Infinity,
                  ease: "easeInOut",
                },
                rotate: {
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                },
              }}
            >
              <NoteIcon size={size} />
            </motion.div>
          );
        })}
      </div>
      
      {/* Central ambient glow */}
      <motion.div 
        className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-[900px] h-[500px] rounded-full"
        style={{ 
          background: "radial-gradient(ellipse, hsl(var(--primary) / 0.08) 0%, transparent 60%)",
        }}
        animate={{ 
          scale: [1, 1.1, 1],
          opacity: [0.5, 0.8, 0.5]
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
};

export default HeroWaveform;
