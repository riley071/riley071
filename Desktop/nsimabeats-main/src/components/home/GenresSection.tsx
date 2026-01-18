import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

const genres = [
  {
    name: "Afrobeats",
    count: 2450,
    gradient: "from-orange-500/20 to-red-500/20",
    borderColor: "border-orange-500/30",
  },
  {
    name: "Amapiano",
    count: 1890,
    gradient: "from-purple-500/20 to-pink-500/20",
    borderColor: "border-purple-500/30",
  },
  {
    name: "Highlife",
    count: 890,
    gradient: "from-yellow-500/20 to-orange-500/20",
    borderColor: "border-yellow-500/30",
  },
  {
    name: "Afro-Soul",
    count: 670,
    gradient: "from-blue-500/20 to-cyan-500/20",
    borderColor: "border-blue-500/30",
  },
  {
    name: "Gengetone",
    count: 540,
    gradient: "from-green-500/20 to-emerald-500/20",
    borderColor: "border-green-500/30",
  },
  {
    name: "Afro-Trap",
    count: 1200,
    gradient: "from-red-500/20 to-rose-500/20",
    borderColor: "border-red-500/30",
  },
];

const GenresSection = () => {
  return (
    <section className="py-20 md:py-32 bg-card/30">
      <div className="container">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Browse by Genre
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            From Afrobeats to Amapiano, find the perfect sound for your project.
          </p>
        </div>

        {/* Genres Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {genres.map((genre, index) => (
            <Link
              key={genre.name}
              to={`/marketplace?genre=${genre.name.toLowerCase()}`}
              className={cn(
                "relative p-6 rounded-2xl border bg-gradient-to-br transition-all duration-300 group overflow-hidden",
                genre.gradient,
                genre.borderColor,
                "hover:scale-105 hover:shadow-lg"
              )}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Background glow on hover */}
              <div className={cn(
                "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-br",
                genre.gradient
              )} />
              
              <div className="relative z-10">
                <h3 className="font-display font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                  {genre.name}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {genre.count.toLocaleString()} beats
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default GenresSection;
