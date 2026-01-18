import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import {
  Upload as UploadIcon,
  User,
  FileText,
  Music,
  CreditCard,
  Loader2,
  CheckCircle,
  AlertCircle,
  Camera,
  FileCheck,
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

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
  "Hip-Hop",
  "R&B",
  "Trap",
];

const daws = [
  "FL Studio",
  "Ableton Live",
  "Logic Pro",
  "Pro Tools",
  "Cubase",
  "Studio One",
  "Reason",
  "Reaper",
  "Other",
];

const ProducerApplication = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [bio, setBio] = useState(profile?.bio || "");
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [daw, setDaw] = useState("");
  const [payoutEmail, setPayoutEmail] = useState("");
  const [payoutPhone, setPayoutPhone] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [mpesaNumber, setMpesaNumber] = useState("");

  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState<string | null>(
    profile?.avatar_url || null
  );
  const [sampleBeat1, setSampleBeat1] = useState<File | null>(null);
  const [sampleBeat2, setSampleBeat2] = useState<File | null>(null);
  const [sampleBeat3, setSampleBeat3] = useState<File | null>(null);
  const [idFile, setIdFile] = useState<File | null>(null);
  const [idFileName, setIdFileName] = useState<string>("");

  const [submitting, setSubmitting] = useState(false);

  // Redirect if not logged in
  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container pt-32 text-center">
          <AlertCircle className="w-16 h-16 text-primary mx-auto mb-4" />
          <h1 className="font-display text-2xl font-bold mb-2">Sign In Required</h1>
          <p className="text-muted-foreground mb-6">You need to be signed in to apply as a producer.</p>
          <Button variant="gold" onClick={() => navigate("/auth")}>
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  // If already approved, redirect to dashboard
  if (profile?.producer_status === "approved") {
    navigate("/dashboard");
    return null;
  }

  const handleProfilePictureChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.includes("image")) {
        toast({
          title: "Invalid file",
          description: "Please upload an image file (JPG, PNG)",
          variant: "destructive",
        });
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Profile picture must be under 5MB",
          variant: "destructive",
        });
        return;
      }
      setProfilePicture(file);
      setProfilePicturePreview(URL.createObjectURL(file));
    }
  }, [toast]);

  const handleSampleBeatChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (file: File | null) => void
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.includes("audio")) {
        toast({
          title: "Invalid file",
          description: "Please upload an audio file (MP3, WAV)",
          variant: "destructive",
        });
        return;
      }
      if (file.size > 50 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Audio file must be under 50MB",
          variant: "destructive",
        });
        return;
      }
      setter(file);
    }
  };

  const handleIdFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "ID document must be under 10MB",
          variant: "destructive",
        });
        return;
      }
      setIdFile(file);
      setIdFileName(file.name);
    }
  }, [toast]);

  const toggleGenre = (genre: string) => {
    setSelectedGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!bio || selectedGenres.length === 0 || !daw || !idFile) {
      toast({
        title: "Missing required fields",
        description: "Please fill in all required fields including at least one sample beat.",
        variant: "destructive",
      });
      return;
    }

    if (sampleBeat1 === null && sampleBeat2 === null && sampleBeat3 === null) {
      toast({
        title: "Sample beats required",
        description: "Please upload at least one sample beat.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      // Upload profile picture if provided (using covers bucket - create avatars bucket later)
      let avatarUrl = profile?.avatar_url || null;
      if (profilePicture) {
        const profileFileName = `${user.id}/profile-${Date.now()}-${profilePicture.name}`;
        const { error: profileError } = await supabase.storage
          .from("covers")
          .upload(profileFileName, profilePicture);

        if (profileError) throw profileError;

        const { data: profileUrlData } = supabase.storage
          .from("covers")
          .getPublicUrl(profileFileName);
        avatarUrl = profileUrlData.publicUrl;
      }

      // Upload sample beats
      const sampleBeatUrls: string[] = [];
      const beats = [sampleBeat1, sampleBeat2, sampleBeat3].filter(Boolean) as File[];

      for (const beat of beats) {
        const beatFileName = `${user.id}/sample-${Date.now()}-${beat.name}`;
        const { error: beatError } = await supabase.storage
          .from("beats")
          .upload(beatFileName, beat);

        if (beatError) throw beatError;

        const { data: beatUrlData } = supabase.storage
          .from("beats")
          .getPublicUrl(beatFileName);
        sampleBeatUrls.push(beatUrlData.publicUrl);
      }

      // Upload ID document (using beats bucket for now - create documents bucket later)
      const idFileName = `${user.id}/id-${Date.now()}-${idFile.name}`;
      const { error: idError } = await supabase.storage
        .from("beats")
        .upload(idFileName, idFile);

      if (idError) throw idError;

      // Store ID file URL in profile metadata (we'll store it in a JSON field or separate column)
      // For now, we'll just note it's uploaded
      const { data: idUrlData } = supabase.storage
        .from("beats")
        .getPublicUrl(idFileName);

      // Update profile with producer application data
      // Note: For production, consider creating a producer_applications table for structured data
      // or adding JSONB column to profiles for metadata
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          role: "producer",
          producer_status: "pending",
          bio: `${bio}\n\nGenres: ${selectedGenres.join(", ")}\nDAW: ${daw}\nSample Beats: ${sampleBeatUrls.length}\nPayout Email: ${payoutEmail || "Not provided"}\nPayout Phone: ${payoutPhone || "Not provided"}`,
          avatar_url: avatarUrl,
        })
        .eq("id", user.id);

      if (updateError) throw updateError;

      // Store sample beats and ID in metadata or separate table
      // For now, we'll use the profile table's existing structure
      // You may need to create a producer_applications table for structured data

      toast({
        title: "Application Submitted!",
        description: "Your producer application has been submitted for review. We'll notify you once it's approved.",
      });

      navigate("/dashboard");
    } catch (error: any) {
      console.error("Application error:", error);
      toast({
        title: "Application failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Become a Verified Producer - Nsimabeats</title>
        <meta name="description" content="Apply to become a verified producer on Nsimabeats" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Navbar />

        <main className="container pt-28 pb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto"
          >
            <div className="mb-8 text-center">
              <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
                Become a Verified Producer
              </h1>
              <p className="text-muted-foreground">
                Complete your producer application to start uploading and selling beats
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Profile Picture */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Camera className="w-5 h-5" />
                    Profile Picture
                  </CardTitle>
                  <CardDescription>Upload a professional profile picture</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-6">
                    {profilePicturePreview && (
                      <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-border">
                        <img
                          src={profilePicturePreview}
                          alt="Profile preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <label className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary/50 transition-colors bg-surface/50 p-6">
                      <Camera className="w-6 h-6 text-muted-foreground mb-2" />
                      <span className="text-sm text-muted-foreground">
                        {profilePicturePreview ? "Change picture" : "Upload picture"}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleProfilePictureChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                </CardContent>
              </Card>

              {/* Bio */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Bio
                  </CardTitle>
                  <CardDescription>Tell us about yourself and your music</CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Write a brief bio about your music production experience, style, and what makes you unique..."
                    rows={6}
                    className="bg-surface border-border"
                    required
                  />
                </CardContent>
              </Card>

              {/* Genres */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Music className="w-5 h-5" />
                    Genres
                  </CardTitle>
                  <CardDescription>Select the genres you produce (select all that apply)</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-3">
                    {genres.map((genre) => (
                      <button
                        key={genre}
                        type="button"
                        onClick={() => toggleGenre(genre)}
                        className={cn(
                          "px-4 py-2 rounded-full text-sm font-medium transition-colors",
                          selectedGenres.includes(genre)
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                        )}
                      >
                        {genre}
                      </button>
                    ))}
                  </div>
                  {selectedGenres.length === 0 && (
                    <p className="text-sm text-destructive mt-2">Please select at least one genre</p>
                  )}
                </CardContent>
              </Card>

              {/* DAW */}
              <Card>
                <CardHeader>
                  <CardTitle>DAW (Digital Audio Workstation)</CardTitle>
                  <CardDescription>Which DAW do you primarily use?</CardDescription>
                </CardHeader>
                <CardContent>
                  <Select value={daw} onValueChange={setDaw} required>
                    <SelectTrigger className="bg-surface border-border">
                      <SelectValue placeholder="Select your primary DAW" />
                    </SelectTrigger>
                    <SelectContent>
                      {daws.map((d) => (
                        <SelectItem key={d} value={d}>
                          {d}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              {/* Sample Beats */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Music className="w-5 h-5" />
                    Sample Beats
                  </CardTitle>
                  <CardDescription>Upload 1-3 sample beats to showcase your work</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[1, 2, 3].map((num) => {
                    const beatFile = num === 1 ? sampleBeat1 : num === 2 ? sampleBeat2 : sampleBeat3;
                    const setBeatFile = num === 1 ? setSampleBeat1 : num === 2 ? setSampleBeat2 : setSampleBeat3;

                    return (
                      <div key={num}>
                        <Label>Sample Beat {num} {num === 1 && "*"}</Label>
                        {!beatFile ? (
                          <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary/50 transition-colors bg-surface/50 mt-2">
                            <UploadIcon className="w-6 h-6 text-muted-foreground mb-2" />
                            <span className="text-sm text-muted-foreground">
                              Click to upload audio (MP3, WAV)
                            </span>
                            <input
                              type="file"
                              accept="audio/*"
                              onChange={(e) => handleSampleBeatChange(e, setBeatFile)}
                              className="hidden"
                            />
                          </label>
                        ) : (
                          <div className="flex items-center justify-between p-4 rounded-xl bg-surface border border-border mt-2">
                            <div className="flex items-center gap-3">
                              <Music className="w-5 h-5 text-primary" />
                              <span className="text-sm font-medium">{beatFile.name}</span>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setBeatFile(null)}
                            >
                              Remove
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {sampleBeat1 === null && sampleBeat2 === null && sampleBeat3 === null && (
                    <p className="text-sm text-destructive">Please upload at least one sample beat</p>
                  )}
                </CardContent>
              </Card>

              {/* ID Upload */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileCheck className="w-5 h-5" />
                    ID Document
                  </CardTitle>
                  <CardDescription>Upload a government-issued ID for verification</CardDescription>
                </CardHeader>
                <CardContent>
                  {!idFile ? (
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary/50 transition-colors bg-surface/50">
                      <FileCheck className="w-6 h-6 text-muted-foreground mb-2" />
                      <span className="text-sm text-muted-foreground">
                        Click to upload ID (PDF, JPG, PNG)
                      </span>
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={handleIdFileChange}
                        className="hidden"
                        required
                      />
                    </label>
                  ) : (
                    <div className="flex items-center justify-between p-4 rounded-xl bg-surface border border-border">
                      <div className="flex items-center gap-3">
                        <FileCheck className="w-5 h-5 text-primary" />
                        <span className="text-sm font-medium">{idFileName}</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setIdFile(null);
                          setIdFileName("");
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Payout Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    Payout Information
                  </CardTitle>
                  <CardDescription>How would you like to receive payments?</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="payoutEmail">Email</Label>
                    <Input
                      id="payoutEmail"
                      type="email"
                      value={payoutEmail}
                      onChange={(e) => setPayoutEmail(e.target.value)}
                      placeholder="payments@example.com"
                      className="mt-1.5 bg-surface border-border"
                    />
                  </div>
                  <div>
                    <Label htmlFor="payoutPhone">Phone Number</Label>
                    <Input
                      id="payoutPhone"
                      type="tel"
                      value={payoutPhone}
                      onChange={(e) => setPayoutPhone(e.target.value)}
                      placeholder="+1 (555) 000-0000"
                      className="mt-1.5 bg-surface border-border"
                    />
                  </div>
                  <div>
                    <Label htmlFor="bankAccount">Bank Account (Optional)</Label>
                    <Input
                      id="bankAccount"
                      value={bankAccount}
                      onChange={(e) => setBankAccount(e.target.value)}
                      placeholder="Bank account number"
                      className="mt-1.5 bg-surface border-border"
                    />
                  </div>
                  <div>
                    <Label htmlFor="mpesaNumber">Mpamba/Airtel Money (Optional)</Label>
                    <Input
                      id="mpesaNumber"
                      type="tel"
                      value={mpesaNumber}
                      onChange={(e) => setMpesaNumber(e.target.value)}
                      placeholder="Mobile money number"
                      className="mt-1.5 bg-surface border-border"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Submit */}
              <div className="flex justify-end gap-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate(-1)}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="gold"
                  disabled={submitting || !bio || selectedGenres.length === 0 || !daw || !idFile}
                  className="min-w-[180px]"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Submit Application
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

export default ProducerApplication;

