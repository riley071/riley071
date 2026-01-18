import { useState, useRef, useEffect } from "react";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Repeat,
  Shuffle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

interface AudioPlayerProps {
  currentBeat?: {
    id: string;
    title: string;
    producer: string;
    coverImage: string;
    preview_url?: string | null;
  };
  isVisible?: boolean;
}

const AudioPlayer = ({ currentBeat, isVisible = false }: AudioPlayerProps) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0); // percent 0-100
  const [volume, setVolume] = useState(80);
  const [isMuted, setIsMuted] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

  useEffect(() => {
    // create audio element once
    if (!audioRef.current) {
      const aud = new Audio();
      aud.preload = "auto";
      aud.crossOrigin = "anonymous";
      audioRef.current = aud;

      const onTimeUpdate = () => {
        if (!audioRef.current) return;
        setCurrentTime(audioRef.current.currentTime);
        setDuration(audioRef.current.duration || 0);
        if (audioRef.current.duration) {
          setProgress(
            (audioRef.current.currentTime / audioRef.current.duration) * 100
          );
        }
      };

      const onEnded = () => {
        setIsPlaying(false);
        setProgress(0);
        setCurrentTime(0);
      };

      aud.addEventListener("timeupdate", onTimeUpdate);
      aud.addEventListener("loadedmetadata", onTimeUpdate);
      aud.addEventListener("ended", onEnded);

      // cleanup on unmount
      return () => {
        aud.pause();
        aud.removeEventListener("timeupdate", onTimeUpdate);
        aud.removeEventListener("loadedmetadata", onTimeUpdate);
        aud.removeEventListener("ended", onEnded);
        audioRef.current = null;
      };
    }
  }, []);

  // react to currentBeat changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!currentBeat?.preview_url) {
      audio.pause();
      audio.src = "";
      setIsPlaying(false);
      setProgress(0);
      setCurrentTime(0);
      setDuration(0);
      return;
    }

    // only change src if different to avoid reload loops
    if (audio.src !== currentBeat.preview_url) {
      audio.src = currentBeat.preview_url;
    }

    // try to play (user gesture may be required)
    audio
      .play()
      .then(() => setIsPlaying(true))
      .catch((err) => {
        // play() may be blocked by autoplay policy or CORS — log for debugging
        console.warn("Audio play prevented:", err);
        setIsPlaying(false);
      });
  }, [currentBeat]);

  // apply volume/mute to audio element
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.volume = Math.max(0, Math.min(1, volume / 100));
    audio.muted = isMuted || volume === 0;
  }, [volume, isMuted]);

  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      try {
        await audio.play();
        setIsPlaying(true);
      } catch (err) {
        console.warn("Play failed on toggle:", err);
        setIsPlaying(false);
      }
    }
  };

  const seekToPercent = (percent: number[]) => {
    const audio = audioRef.current;
    if (!audio || !audio.duration) return;
    const p = percent[0];
    const t = (p / 100) * audio.duration;
    audio.currentTime = t;
    setProgress(p);
    setCurrentTime(t);
  };

  if (!currentBeat || !isVisible) return null;

  const formatTime = (seconds: number) => {
    if (!Number.isFinite(seconds) || seconds <= 0) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-border/50 animate-fade-in">
      <div className="container mx-auto">
        <div className="flex items-center gap-4 py-3 md:py-4">
          {/* Beat Info */}
          <div className="flex items-center gap-3 min-w-0 flex-1 md:flex-none md:w-64">
            <div className="w-12 h-12 md:w-14 md:h-14 rounded-lg overflow-hidden flex-shrink-0 shadow-md">
              <img
                src={currentBeat.coverImage}
                alt={currentBeat.title}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="min-w-0">
              <h4 className="font-semibold text-sm md:text-base truncate text-foreground">
                {currentBeat.title}
              </h4>
              <p className="text-xs md:text-sm text-muted-foreground truncate">
                {currentBeat.producer}
              </p>
            </div>
          </div>

          {/* Main Controls */}
          <div className="flex-1 max-w-2xl mx-auto hidden md:block">
            <div className="flex items-center justify-center gap-4 mb-2">
              <button className="text-muted-foreground hover:text-foreground transition-colors">
                <Shuffle className="w-4 h-4" />
              </button>
              <button className="text-muted-foreground hover:text-foreground transition-colors">
                <SkipBack className="w-5 h-5" />
              </button>
              <Button
                variant="play"
                size="icon"
                onClick={togglePlay}
                className="w-10 h-10"
              >
                {isPlaying ? (
                  <Pause className="w-5 h-5 fill-current" />
                ) : (
                  <Play className="w-5 h-5 fill-current ml-0.5" />
                )}
              </Button>
              <button className="text-muted-foreground hover:text-foreground transition-colors">
                <SkipForward className="w-5 h-5" />
              </button>
              <button className="text-muted-foreground hover:text-foreground transition-colors">
                <Repeat className="w-4 h-4" />
              </button>
            </div>

            {/* Progress Bar */}
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground w-10 text-right">
                {formatTime(currentTime)}
              </span>
              <div className="flex-1">
                <Slider
                  value={[progress]}
                  max={100}
                  step={0.1}
                  onValueChange={seekToPercent}
                  className="cursor-pointer"
                />
              </div>
              <span className="text-xs text-muted-foreground w-10">
                {formatTime(duration)}
              </span>
            </div>
          </div>

          {/* Mobile Play/Pause */}
          <div className="md:hidden">
            <Button variant="play" size="icon-sm" onClick={togglePlay}>
              {isPlaying ? (
                <Pause className="w-4 h-4 fill-current" />
              ) : (
                <Play className="w-4 h-4 fill-current ml-0.5" />
              )}
            </Button>
          </div>

          {/* Volume Control */}
          <div className="hidden md:flex items-center gap-2 w-36">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-5 h-5" />
              ) : (
                <Volume2 className="w-5 h-5" />
              )}
            </button>
            <Slider
              value={[isMuted ? 0 : volume]}
              max={100}
              step={1}
              onValueChange={(value) => {
                setVolume(value[0]);
                setIsMuted(value[0] === 0);
              }}
              className="cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AudioPlayer;
