import { useState } from "react";
import { Play, Pause, ShoppingCart, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useCart, LicenseType } from "@/hooks/useCart";

interface Beat {
  id: string;
  title: string;
  producer: string;
  producerAvatar?: string;
  coverImage: string;
  genre: string;
  bpm: number;
  price: number;
  mood?: string;
  key?: string;
  price_basic?: number;
  price_premium?: number | null;
  price_unlimited?: number | null;
  price_exclusive?: number | null;
  is_exclusive_sold?: boolean;
}

interface BeatCardProps {
  beat: Beat;
  isPlaying?: boolean;
  onPlay?: (id: string) => void;
  onPause?: () => void;
}

const licenseLabels: Record<LicenseType, string> = {
  basic: "Basic License",
  premium: "Premium License",
  unlimited: "Unlimited License",
  exclusive: "Exclusive License",
};

const BeatCard = ({ beat, isPlaying = false, onPlay, onPause }: BeatCardProps) => {
  const [isLiked, setIsLiked] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [showLicenseDialog, setShowLicenseDialog] = useState(false);
  const [selectedLicense, setSelectedLicense] = useState<LicenseType>("basic");
  const { addToCart } = useCart();

  const handlePlayClick = () => {
    if (isPlaying) {
      onPause?.();
    } else {
      onPlay?.(beat.id);
    }
  };

  const getAvailableLicenses = (): LicenseType[] => {
    const available: LicenseType[] = ["basic"];
    if (beat.price_premium) available.push("premium");
    if (beat.price_unlimited) available.push("unlimited");
    if (beat.price_exclusive && !beat.is_exclusive_sold) available.push("exclusive");
    return available;
  };

  const getLicensePrice = (licenseType: LicenseType): number => {
    switch (licenseType) {
      case "basic":
        return beat.price_basic || beat.price;
      case "premium":
        return beat.price_premium || beat.price_basic || beat.price;
      case "unlimited":
        return beat.price_unlimited || beat.price_basic || beat.price;
      case "exclusive":
        return beat.price_exclusive || beat.price_basic || beat.price;
      default:
        return beat.price_basic || beat.price;
    }
  };

  const handleAddToCart = async () => {
    const price = getLicensePrice(selectedLicense);
    await addToCart(beat.id, selectedLicense, price);
    setShowLicenseDialog(false);
  };

  return (
    <div 
      className="beat-card group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Cover Image */}
      <div className="relative aspect-square overflow-hidden">
        <img
          src={beat.coverImage}
          alt={beat.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        
        {/* Overlay */}
        <div className={cn(
          "absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent transition-opacity duration-300",
          isHovered ? "opacity-100" : "opacity-0"
        )} />

        {/* Play Button */}
        <div className={cn(
          "absolute inset-0 flex items-center justify-center transition-all duration-300",
          isHovered || isPlaying ? "opacity-100" : "opacity-0"
        )}>
          <Button
            variant="play"
            size="icon-lg"
            onClick={handlePlayClick}
            className={cn(
              "transition-transform duration-300",
              isHovered || isPlaying ? "scale-100" : "scale-75"
            )}
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 fill-current" />
            ) : (
              <Play className="w-5 h-5 fill-current ml-0.5" />
            )}
          </Button>
        </div>

        {/* Top Actions */}
        <div className={cn(
          "absolute top-3 right-3 flex gap-2 transition-all duration-300",
          isHovered ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"
        )}>
          <button
            onClick={() => setIsLiked(!isLiked)}
            className={cn(
              "w-8 h-8 rounded-full glass flex items-center justify-center transition-colors",
              isLiked ? "text-red-500" : "text-foreground/70 hover:text-foreground"
            )}
          >
            <Heart className={cn("w-4 h-4", isLiked && "fill-current")} />
          </button>
        </div>

        {/* Genre Tag */}
        <div className="absolute top-3 left-3">
          <span className="tag tag-gold">
            {beat.genre}
          </span>
        </div>

        {/* Waveform Animation (when playing) */}
        {isPlaying && (
          <div className="absolute bottom-3 left-3 right-3 flex items-end gap-0.5 h-6">
            {Array.from({ length: 20 }).map((_, i) => (
              <div
                key={i}
                className="waveform-bar flex-1"
                style={{
                  height: `${Math.random() * 100}%`,
                  animationDelay: `${i * 0.05}s`
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Title & Producer */}
        <div className="mb-3">
          <h3 className="font-display font-semibold text-foreground truncate group-hover:text-primary transition-colors">
            {beat.title}
          </h3>
          <p className="text-sm text-muted-foreground truncate">
            by {beat.producer}
          </p>
        </div>

        {/* Meta Info */}
        <div className="flex items-center gap-3 mb-4 text-xs text-muted-foreground">
          <span>{beat.bpm} BPM</span>
          {beat.key && (
            <>
              <span className="w-1 h-1 rounded-full bg-border" />
              <span>{beat.key}</span>
            </>
          )}
          {beat.mood && (
            <>
              <span className="w-1 h-1 rounded-full bg-border" />
              <span>{beat.mood}</span>
            </>
          )}
        </div>

        {/* Price & Action */}
        <div className="flex items-center justify-between">
          <div>
            <span className="text-lg font-display font-bold text-primary">
              MK {beat.price_basic || beat.price}
            </span>
            <span className="text-xs text-muted-foreground ml-1">
              MWK
            </span>
          </div>
          <Dialog open={showLicenseDialog} onOpenChange={setShowLicenseDialog}>
            <DialogTrigger asChild>
              <Button variant="gold" size="sm" className="gap-1.5">
                <ShoppingCart className="w-3.5 h-3.5" />
                Add
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Select License Type</DialogTitle>
                <DialogDescription>
                  Choose the license type for {beat.title}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <RadioGroup
                  value={selectedLicense}
                  onValueChange={(value) => setSelectedLicense(value as LicenseType)}
                >
                  {getAvailableLicenses().map((license) => (
                    <div
                      key={license}
                      className="flex items-center space-x-2 p-3 rounded-lg border border-border hover:border-primary/50 transition-colors"
                    >
                      <RadioGroupItem value={license} id={license} />
                      <Label
                        htmlFor={license}
                        className="flex-1 cursor-pointer flex items-center justify-between"
                      >
                        <span>{licenseLabels[license]}</span>
                        <span className="font-semibold text-primary">
                          MK {getLicensePrice(license).toFixed(2)}
                        </span>
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
                <Button
                  variant="gold"
                  className="w-full"
                  onClick={handleAddToCart}
                >
                  Add to Cart
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </div>
  );
};

export default BeatCard;
