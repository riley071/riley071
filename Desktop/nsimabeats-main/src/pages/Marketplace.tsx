import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { Search, SlidersHorizontal, X, ChevronDown, Loader2 } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import BeatCard from "@/components/beats/BeatCard";
import AudioPlayer from "@/components/beats/AudioPlayer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

interface Beat {
  id: string;
  title: string;
  producer: string;
  coverImage: string;
  genre: string;
  bpm: number;
  price: number;
  mood: string | null;
  key: string | null;
  preview_url: string | null;
  price_basic: number;
  price_premium: number | null;
  price_unlimited: number | null;
  price_exclusive: number | null;
  is_exclusive_sold: boolean;
}

const genres = ["All", "Afrobeats", "Amapiano", "Highlife", "Afro-Soul", "Gengetone", "Afro-Trap"];
const moods = ["All", "Chill", "Energetic", "Emotional", "Groovy", "Hype", "Smooth", "Intense"];

const Marketplace = () => {
  const [beats, setBeats] = useState<Beat[]>([]);
  const [loading, setLoading] = useState(true);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("All");
  const [selectedMood, setSelectedMood] = useState("All");
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState("popular");

  useEffect(() => {
    fetchBeats();
  }, []);

  const fetchBeats = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("beats")
      .select("*, profiles(full_name)")
      .eq("status", "published")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching beats:", error);
    } else {
      const formattedBeats: Beat[] = (data || []).map((beat) => ({
        id: beat.id,
        title: beat.title,
        producer: beat.profiles?.full_name || "Unknown Producer",
        coverImage: beat.cover_url || "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop",
        genre: beat.genre,
        bpm: beat.bpm,
        price: Number(beat.price_basic),
        mood: beat.mood,
        key: beat.key,
        preview_url: beat.preview_url,
        price_basic: Number(beat.price_basic),
        price_premium: beat.price_premium ? Number(beat.price_premium) : null,
        price_unlimited: beat.price_unlimited ? Number(beat.price_unlimited) : null,
        price_exclusive: beat.price_exclusive ? Number(beat.price_exclusive) : null,
        is_exclusive_sold: beat.is_exclusive_sold || false,
      }));
      setBeats(formattedBeats);
    }
    setLoading(false);
  };

  // Filter beats
  const filteredBeats = beats.filter((beat) => {
    const matchesSearch = beat.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         beat.producer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesGenre = selectedGenre === "All" || beat.genre === selectedGenre;
    const matchesMood = selectedMood === "All" || beat.mood === selectedMood;
    return matchesSearch && matchesGenre && matchesMood;
  });

  const currentBeat = playingId ? beats.find((b) => b.id === playingId) : undefined;

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedGenre("All");
    setSelectedMood("All");
  };

  const hasActiveFilters = searchQuery || selectedGenre !== "All" || selectedMood !== "All";

  return (
    <>
      <Helmet>
        <title>Browse Beats - Nsimabeats Marketplace</title>
        <meta 
          name="description" 
          content="Browse and buy premium African beats. Filter by genre, BPM, mood and more. Instant download after purchase." 
        />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Navbar />
        
        <main className="pt-24 pb-32">
          <div className="container">
            {/* Header */}
            <div className="mb-8">
              <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
                Marketplace
              </h1>
              <p className="text-muted-foreground">
                {filteredBeats.length} beats available
              </p>
            </div>

            {/* Search & Filters Bar */}
            <div className="flex flex-col md:flex-row gap-4 mb-8">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search beats, producers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-card border-border h-12"
                />
              </div>

              {/* Filter Toggle (Mobile) */}
              <Button
                variant="outline"
                className="md:hidden gap-2"
                onClick={() => setShowFilters(!showFilters)}
              >
                <SlidersHorizontal className="w-4 h-4" />
                Filters
                {hasActiveFilters && (
                  <span className="w-2 h-2 rounded-full bg-primary" />
                )}
              </Button>

              {/* Desktop Filters */}
              <div className="hidden md:flex items-center gap-3">
                <Select value={selectedGenre} onValueChange={setSelectedGenre}>
                  <SelectTrigger className="w-40 bg-card border-border h-12">
                    <SelectValue placeholder="Genre" />
                  </SelectTrigger>
                  <SelectContent>
                    {genres.map((genre) => (
                      <SelectItem key={genre} value={genre}>
                        {genre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedMood} onValueChange={setSelectedMood}>
                  <SelectTrigger className="w-40 bg-card border-border h-12">
                    <SelectValue placeholder="Mood" />
                  </SelectTrigger>
                  <SelectContent>
                    {moods.map((mood) => (
                      <SelectItem key={mood} value={mood}>
                        {mood}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-40 bg-card border-border h-12">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="popular">Most Popular</SelectItem>
                    <SelectItem value="newest">Newest</SelectItem>
                    <SelectItem value="price-low">Price: Low to High</SelectItem>
                    <SelectItem value="price-high">Price: High to Low</SelectItem>
                  </SelectContent>
                </Select>

                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Clear
                  </Button>
                )}
              </div>
            </div>

            {/* Mobile Filters Panel */}
            {showFilters && (
              <div className="md:hidden mb-6 p-4 rounded-xl bg-card border border-border animate-fade-in">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm text-muted-foreground mb-2 block">Genre</label>
                    <Select value={selectedGenre} onValueChange={setSelectedGenre}>
                      <SelectTrigger className="bg-surface border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {genres.map((genre) => (
                          <SelectItem key={genre} value={genre}>
                            {genre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground mb-2 block">Mood</label>
                    <Select value={selectedMood} onValueChange={setSelectedMood}>
                      <SelectTrigger className="bg-surface border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {moods.map((mood) => (
                          <SelectItem key={mood} value={mood}>
                            {mood}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="mt-3 text-muted-foreground"
                  >
                    Clear all filters
                  </Button>
                )}
              </div>
            )}

            {/* Beats Grid */}
            {loading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : filteredBeats.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredBeats.map((beat, index) => (
                  <div
                    key={beat.id}
                    className="animate-fade-in-up"
                    style={{ animationDelay: `${index * 0.05}s` }}
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
            ) : (
              <div className="text-center py-20">
                <p className="text-muted-foreground text-lg mb-4">
                  No beats found matching your criteria
                </p>
                <Button variant="gold-outline" onClick={clearFilters}>
                  Clear Filters
                </Button>
              </div>
            )}
          </div>
        </main>

        <Footer />

        {/* Audio Player */}
        <AudioPlayer
          currentBeat={currentBeat}
          isVisible={!!playingId}
        />
      </div>
    </>
  );
};

export default Marketplace;
