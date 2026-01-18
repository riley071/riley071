import { useState } from "react";
import { ArrowRight, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import BeatCard from "@/components/beats/BeatCard";

// Mock data for featured beats
const featuredBeats = [
  {
    id: "1",
    title: "Midnight Vibes",
    producer: "DJ Kofi",
    coverImage: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop",
    genre: "Afrobeats",
    bpm: 105,
    price: 29.99,
    mood: "Chill",
    key: "Am"
  },
  {
    id: "2",
    title: "Lagos Nights",
    producer: "BeatMaster Ayo",
    coverImage: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&h=400&fit=crop",
    genre: "Amapiano",
    bpm: 112,
    price: 49.99,
    mood: "Energetic",
    key: "Cm"
  },
  {
    id: "3",
    title: "Safari Dreams",
    producer: "Nyamza",
    coverImage: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=400&h=400&fit=crop",
    genre: "Afro-Soul",
    bpm: 92,
    price: 34.99,
    mood: "Emotional",
    key: "Dm"
  },
  {
    id: "4",
    title: "Accra Flow",
    producer: "GH Melodies",
    coverImage: "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400&h=400&fit=crop",
    genre: "Highlife",
    bpm: 98,
    price: 24.99,
    mood: "Groovy",
    key: "Gm"
  },
  {
    id: "5",
    title: "Kigali Sunset",
    producer: "RwandaBeats",
    coverImage: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?w=400&h=400&fit=crop",
    genre: "Afrobeats",
    bpm: 108,
    price: 39.99,
    mood: "Mellow",
    key: "Fm"
  },
  {
    id: "6",
    title: "Nairobi Heat",
    producer: "KE Producer",
    coverImage: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&h=400&fit=crop",
    genre: "Gengetone",
    bpm: 120,
    price: 44.99,
    mood: "Hype",
    key: "Bbm"
  },
  {
    id: "7",
    title: "Cape Town Chill",
    producer: "SA Vibes",
    coverImage: "https://images.unsplash.com/photo-1483412033650-1015ddeb83d1?w=400&h=400&fit=crop",
    genre: "Amapiano",
    bpm: 115,
    price: 54.99,
    mood: "Smooth",
    key: "Ebm"
  },
  {
    id: "8",
    title: "Dakar Drums",
    producer: "Senegal Sound",
    coverImage: "https://images.unsplash.com/photo-1571330735066-03aaa9429d89?w=400&h=400&fit=crop",
    genre: "Afro-Trap",
    bpm: 140,
    price: 29.99,
    mood: "Intense",
    key: "Em"
  },
];

const FeaturedBeats = () => {
  const [playingId, setPlayingId] = useState<string | null>(null);

  return (
    <section className="py-20 md:py-32 bg-gradient-to-b from-background to-card/50">
      <div className="container">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Flame className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium text-primary uppercase tracking-wider">
                Trending Now
              </span>
            </div>
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-foreground">
              Featured Beats
            </h2>
            <p className="text-muted-foreground mt-2 max-w-lg">
              Hand-picked by our team. The hottest beats from Africa's top producers.
            </p>
          </div>
          <Link to="/marketplace">
            <Button variant="gold-outline" className="group">
              View All Beats
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </div>

        {/* Beats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {featuredBeats.map((beat, index) => (
            <div
              key={beat.id}
              className="animate-fade-in-up"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <BeatCard
                beat={beat}
                isPlaying={playingId === beat.id}
                onPlay={(id) => setPlayingId(id)}
                onPause={() => setPlayingId(null)}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedBeats;
