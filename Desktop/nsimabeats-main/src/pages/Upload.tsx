import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import {
  Upload as UploadIcon,
  Music,
  Image,
  X,
  Loader2,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Navbar from "@/components/layout/Navbar";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

const genres = [
  "Afrobeats",
  "Amapiano",
  "Highlife",
  "Afro-Soul",
  "Gengetone",
  "Afro-Trap",
  "Afro-Pop",
  "Dancehall",
  "Reggae",
];

const moods = [
  "Chill",
  "Energetic",
  "Emotional",
  "Groovy",
  "Hype",
  "Smooth",
  "Intense",
  "Mellow",
  "Dark",
  "Happy",
];

const keys = [
  "C",
  "C#",
  "D",
  "D#",
  "E",
  "F",
  "F#",
  "G",
  "G#",
  "A",
  "A#",
  "B",
  "Cm",
  "C#m",
  "Dm",
  "D#m",
  "Em",
  "Fm",
  "F#m",
  "Gm",
  "G#m",
  "Am",
  "A#m",
  "Bm",
];

// Sanitize file names for storage (remove special chars, spaces)
const sanitizeFileName = (name: string): string => {
  const ext = name.split('.').pop() || '';
  const baseName = name.replace(/\.[^/.]+$/, '');
  const sanitized = baseName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50);
  return `${sanitized}.${ext}`;
};

const Upload = () => {
  const { user, profile, isProducer } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [title, setTitle] = useState("");
  const [genre, setGenre] = useState("");
  const [bpm, setBpm] = useState("");
  const [key, setKey] = useState("");
  const [mood, setMood] = useState("");
  const [description, setDescription] = useState("");
  const [priceBasic, setPriceBasic] = useState("29.99");
  const [pricePremium, setPricePremium] = useState("49.99");
  const [priceUnlimited, setPriceUnlimited] = useState("99.99");
  const [priceExclusive, setPriceExclusive] = useState("299.99");

  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [stemsFile, setStemsFile] = useState<File | null>(null);

  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Redirect if not logged in
  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container pt-32 text-center">
          <AlertCircle className="w-16 h-16 text-primary mx-auto mb-4" />
          <h1 className="font-display text-2xl font-bold mb-2">Sign In Required</h1>
          <p className="text-muted-foreground mb-6">You need to be signed in to upload beats.</p>
          <Button variant="gold" onClick={() => navigate("/auth")}>
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  // Block upload if not a verified producer
  if (!isProducer) {
    const isPendingProducer = profile?.role === "producer" && profile?.producer_status === "pending";
    const needsApplication = profile?.role !== "producer";

    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container pt-32 text-center max-w-2xl mx-auto">
          <AlertCircle className="w-16 h-16 text-primary mx-auto mb-4" />
          <h1 className="font-display text-2xl font-bold mb-2">
            {isPendingProducer ? "Application Under Review" : "Producer Verification Required"}
          </h1>
          <p className="text-muted-foreground mb-6">
            {isPendingProducer
              ? "Your producer application is currently under review. You'll be able to upload beats once approved."
              : "You need to be a verified producer to upload beats. Complete your producer application to get started."}
          </p>
          {needsApplication ? (
            <Button variant="gold" onClick={() => navigate("/apply")}>
              Apply as Producer
            </Button>
          ) : (
            <Button variant="outline" onClick={() => navigate("/dashboard")}>
              Go to Dashboard
            </Button>
          )}
        </div>
      </div>
    );
  }

  const handleAudioChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.includes("audio")) {
        toast({
          title: "Invalid file",
          description: "Please upload an audio file (MP3, WAV)",
          variant: "destructive",
        });
        return;
      }
      // Validate file size (50MB max)
      if (file.size > 50 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Audio file must be under 50MB",
          variant: "destructive",
        });
        return;
      }
      setAudioFile(file);
    }
  }, [toast]);

  const handleStemsChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.includes("audio") && !file.name.endsWith(".zip")) {
        toast({
          title: "Invalid file",
          description: "Please upload an audio file or ZIP archive",
          variant: "destructive",
        });
        return;
      }
      if (file.size > 100 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Stems file must be under 100MB",
          variant: "destructive",
        });
        return;
      }
      setStemsFile(file);
    }
  }, [toast]);

  const handleCoverChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.includes("image")) {
        toast({
          title: "Invalid file",
          description: "Please upload an image file (JPG, PNG)",
          variant: "destructive",
        });
        return;
      }
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Cover image must be under 5MB",
          variant: "destructive",
        });
        return;
      }
      setCoverFile(file);
      setCoverPreview(URL.createObjectURL(file));
    }
  }, [toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!audioFile) {
      toast({
        title: "Missing audio",
        description: "Please upload your beat audio file",
        variant: "destructive",
      });
      return;
    }

    if (!title || !genre || !bpm) {
      toast({
        title: "Missing info",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);
    setUploadProgress(10);

    try {
      // Upload audio file
      const audioFileName = `${user.id}/${Date.now()}-${sanitizeFileName(audioFile.name)}`;
      const { error: audioError } = await supabase.storage
        .from("beats")
        .upload(audioFileName, audioFile);

      if (audioError) throw audioError;
      setUploadProgress(50);

      // For private buckets, store the storage path, not a public URL
      // The path will be used to generate signed URLs for download
      const audioStoragePath = audioFileName;
      let coverUrl = null;
      if (coverFile) {
        const coverFileName = `${user.id}/${Date.now()}-${sanitizeFileName(coverFile.name)}`;
        const { error: coverError } = await supabase.storage
          .from("covers")
          .upload(coverFileName, coverFile);

        if (coverError) throw coverError;
        
        const { data: coverUrlData } = supabase.storage
          .from("covers")
          .getPublicUrl(coverFileName);
        coverUrl = coverUrlData.publicUrl;
      }
      setUploadProgress(60);

      // Upload stems if provided
      let stemsUrl = null;
      if (stemsFile) {
        const stemsFileName = `${user.id}/${Date.now()}-stems-${sanitizeFileName(stemsFile.name)}`;
        const { error: stemsError } = await supabase.storage
          .from("beats")
          .upload(stemsFileName, stemsFile);

        if (!stemsError) {
          const { data: stemsUrlData } = supabase.storage
            .from("beats")
            .getPublicUrl(stemsFileName);
          stemsUrl = stemsUrlData.publicUrl;
        }
      }

      setUploadProgress(70);

      // Also upload to previews bucket for public preview
      const previewFileName = `${user.id}/${Date.now()}-preview-${sanitizeFileName(audioFile.name)}`;
      await supabase.storage.from("previews").upload(previewFileName, audioFile);
      const { data: previewUrlData } = supabase.storage
        .from("previews")
        .getPublicUrl(previewFileName);

      setUploadProgress(85);

      // Insert beat record
      const { error: insertError } = await supabase.from("beats").insert({
        producer_id: user.id,
        title,
        genre,
        bpm: parseInt(bpm),
        key: key || null,
        mood: mood || null,
        description: description || null,
        price_basic: parseFloat(priceBasic),
        price_premium: pricePremium ? parseFloat(pricePremium) : null,
        price_unlimited: priceUnlimited ? parseFloat(priceUnlimited) : null,
        price_exclusive: priceExclusive ? parseFloat(priceExclusive) : null,
        audio_url: audioStoragePath, // Store storage path for private bucket
        preview_url: previewUrlData.publicUrl,
        cover_url: coverUrl,
        stems_url: stemsUrl,
        status: "pending",
      });

      if (insertError) throw insertError;
      setUploadProgress(100);

      toast({
        title: "Beat uploaded!",
        description: "Your beat has been submitted for admin review.",
      });

      // Reset form
      setTitle("");
      setGenre("");
      setBpm("");
      setKey("");
      setMood("");
      setDescription("");
      setAudioFile(null);
      setCoverFile(null);
      setCoverPreview(null);
      setStemsFile(null);

      navigate("/dashboard");
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <>
      <Helmet>
        <title>Upload Beat - Nsimabeats</title>
        <meta name="description" content="Upload your beat to Nsimabeats marketplace" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Navbar />

        <main className="container pt-28 pb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl mx-auto"
          >
            <div className="mb-8">
              <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
                Upload Beat
              </h1>
              <p className="text-muted-foreground">
                Share your music with the world. All beats go through admin review before publishing.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Audio Upload */}
              <div className="glass-card p-6 rounded-2xl">
                <h2 className="font-display font-semibold text-lg mb-4 flex items-center gap-2">
                  <Music className="w-5 h-5 text-primary" />
                  Audio File *
                </h2>
                
                {!audioFile ? (
                  <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary/50 transition-colors bg-surface/50">
                    <UploadIcon className="w-10 h-10 text-muted-foreground mb-3" />
                    <span className="text-sm text-muted-foreground">
                      Click to upload audio (MP3, WAV)
                    </span>
                    <span className="text-xs text-muted-foreground mt-1">
                      Max 50MB
                    </span>
                    <input
                      type="file"
                      accept="audio/*"
                      onChange={handleAudioChange}
                      className="hidden"
                    />
                  </label>
                ) : (
                  <div className="flex items-center justify-between p-4 rounded-xl bg-surface border border-border">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Music className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground truncate max-w-xs">
                          {audioFile.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {(audioFile.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => setAudioFile(null)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Cover Image */}
              <div className="glass-card p-6 rounded-2xl">
                <h2 className="font-display font-semibold text-lg mb-4 flex items-center gap-2">
                  <Image className="w-5 h-5 text-primary" />
                  Cover Image (Optional)
                </h2>
                
                <div className="flex gap-6">
                  {coverPreview && (
                    <div className="relative w-32 h-32 rounded-xl overflow-hidden">
                      <img
                        src={coverPreview}
                        alt="Cover preview"
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setCoverFile(null);
                          setCoverPreview(null);
                        }}
                        className="absolute top-2 right-2 w-6 h-6 rounded-full bg-background/80 flex items-center justify-center"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                  
                  <label className={cn(
                    "flex flex-col items-center justify-center border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary/50 transition-colors bg-surface/50",
                    coverPreview ? "w-32 h-32" : "flex-1 h-32"
                  )}>
                    <Image className="w-6 h-6 text-muted-foreground mb-2" />
                    <span className="text-xs text-muted-foreground">
                      {coverPreview ? "Change" : "Upload cover"}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleCoverChange}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Stems Upload */}
              <div className="glass-card p-6 rounded-2xl">
                <h2 className="font-display font-semibold text-lg mb-4 flex items-center gap-2">
                  <Music className="w-5 h-5 text-primary" />
                  Stems (Optional)
                </h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Upload stems/stems pack (ZIP file or audio). Required for Premium and Unlimited licenses.
                </p>
                {!stemsFile ? (
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary/50 transition-colors bg-surface/50">
                    <UploadIcon className="w-10 h-10 text-muted-foreground mb-3" />
                    <span className="text-sm text-muted-foreground">
                      Click to upload stems (ZIP or audio)
                    </span>
                    <span className="text-xs text-muted-foreground mt-1">
                      Max 100MB
                    </span>
                    <input
                      type="file"
                      accept=".zip,audio/*"
                      onChange={handleStemsChange}
                      className="hidden"
                    />
                  </label>
                ) : (
                  <div className="flex items-center justify-between p-4 rounded-xl bg-surface border border-border">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Music className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground truncate max-w-xs">
                          {stemsFile.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {(stemsFile.size / (1024 * 1024)).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => setStemsFile(null)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Beat Details */}
              <div className="glass-card p-6 rounded-2xl">
                <h2 className="font-display font-semibold text-lg mb-4">
                  Beat Details
                </h2>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Beat title"
                      className="mt-1.5 bg-surface border-border"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="genre">Genre *</Label>
                    <Select value={genre} onValueChange={setGenre} required>
                      <SelectTrigger className="mt-1.5 bg-surface border-border">
                        <SelectValue placeholder="Select genre" />
                      </SelectTrigger>
                      <SelectContent>
                        {genres.map((g) => (
                          <SelectItem key={g} value={g}>
                            {g}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="bpm">BPM *</Label>
                    <Input
                      id="bpm"
                      type="number"
                      min="60"
                      max="200"
                      value={bpm}
                      onChange={(e) => setBpm(e.target.value)}
                      placeholder="e.g. 120"
                      className="mt-1.5 bg-surface border-border"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="key">Key</Label>
                    <Select value={key} onValueChange={setKey}>
                      <SelectTrigger className="mt-1.5 bg-surface border-border">
                        <SelectValue placeholder="Select key" />
                      </SelectTrigger>
                      <SelectContent>
                        {keys.map((k) => (
                          <SelectItem key={k} value={k}>
                            {k}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="mood">Mood</Label>
                    <Select value={mood} onValueChange={setMood}>
                      <SelectTrigger className="mt-1.5 bg-surface border-border">
                        <SelectValue placeholder="Select mood" />
                      </SelectTrigger>
                      <SelectContent>
                        {moods.map((m) => (
                          <SelectItem key={m} value={m}>
                            {m}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Describe your beat..."
                      className="mt-1.5 bg-surface border-border resize-none"
                      rows={3}
                    />
                  </div>
                </div>
              </div>

              {/* Pricing */}
              <div className="glass-card p-6 rounded-2xl">
                <h2 className="font-display font-semibold text-lg mb-4">
                  License Pricing (MWK)
                </h2>
                
                <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="priceBasic">Basic *</Label>
                    <div className="relative mt-1.5">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">MK</span>
                      <Input
                        id="priceBasic"
                        type="number"
                        step="0.01"
                        min="0"
                        value={priceBasic}
                        onChange={(e) => setPriceBasic(e.target.value)}
                        className="pl-7 bg-surface border-border"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="pricePremium">Premium</Label>
                    <div className="relative mt-1.5">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">MK</span>
                      <Input
                        id="pricePremium"
                        type="number"
                        step="0.01"
                        min="0"
                        value={pricePremium}
                        onChange={(e) => setPricePremium(e.target.value)}
                        className="pl-7 bg-surface border-border"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="priceUnlimited">Unlimited</Label>
                    <div className="relative mt-1.5">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">MK</span>
                      <Input
                        id="priceUnlimited"
                        type="number"
                        step="0.01"
                        min="0"
                        value={priceUnlimited}
                        onChange={(e) => setPriceUnlimited(e.target.value)}
                        className="pl-7 bg-surface border-border"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="priceExclusive">Exclusive</Label>
                    <div className="relative mt-1.5">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">MK</span>
                      <Input
                        id="priceExclusive"
                        type="number"
                        step="0.01"
                        min="0"
                        value={priceExclusive}
                        onChange={(e) => setPriceExclusive(e.target.value)}
                        className="pl-7 bg-surface border-border"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Upload Progress */}
              {uploading && (
                <div className="glass-card p-6 rounded-2xl">
                  <div className="flex items-center gap-4 mb-3">
                    <Loader2 className="w-5 h-5 animate-spin text-primary" />
                    <span className="font-medium">Uploading your beat...</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-gold to-amber"
                      initial={{ width: 0 }}
                      animate={{ width: `${uploadProgress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                </div>
              )}

              {/* Submit */}
              <div className="flex justify-end gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(-1)}
                  disabled={uploading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="gold"
                  disabled={uploading || !audioFile || !title || !genre || !bpm}
                  className="min-w-[140px]"
                >
                  {uploading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <UploadIcon className="w-4 h-4 mr-2" />
                      Upload Beat
                    </>
                  )}
                </Button>
              </div>
            </form>
          </motion.div>
        </main>
      </div>
    </>
  );
};

export default Upload;
