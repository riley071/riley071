import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import {
  Upload,
  Music,
  DollarSign,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Plus,
  Wallet,
  ArrowUpRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import Navbar from "@/components/layout/Navbar";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface Beat {
  id: string;
  title: string;
  genre: string;
  bpm: number;
  price_basic: number;
  cover_url: string | null;
  status: string;
  plays_count: number;
  created_at: string;
}

const statusConfig = {
  pending: { icon: Clock, color: "text-yellow-500", bg: "bg-yellow-500/10", label: "Pending Review" },
  approved: { icon: CheckCircle, color: "text-blue-500", bg: "bg-blue-500/10", label: "Approved" },
  published: { icon: CheckCircle, color: "text-green-500", bg: "bg-green-500/10", label: "Published" },
  rejected: { icon: XCircle, color: "text-red-500", bg: "bg-red-500/10", label: "Rejected" },
  unpublished: { icon: AlertCircle, color: "text-muted-foreground", bg: "bg-muted", label: "Unpublished" },
};

const Dashboard = () => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [beats, setBeats] = useState<Beat[]>([]);
  const [loadingBeats, setLoadingBeats] = useState(true);
  const [wallet, setWallet] = useState<any>(null);
  const [loadingWallet, setLoadingWallet] = useState(true);
  const [earnings, setEarnings] = useState<any[]>([]);
  const [loadingEarnings, setLoadingEarnings] = useState(true);
  const [licenses, setLicenses] = useState<any[]>([]);
  const [loadingLicenses, setLoadingLicenses] = useState(true);
  const [showPayoutDialog, setShowPayoutDialog] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState("");
  const [payoutMethod, setPayoutMethod] = useState("bank_transfer");
  const [payoutDetails, setPayoutDetails] = useState("");
  const [requestingPayout, setRequestingPayout] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchBeats();
      fetchLicenses();
      if (profile?.role === "producer") {
        fetchWallet();
        fetchEarnings();
      }
    }
  }, [user, profile]);

  const fetchBeats = async () => {
    const { data, error } = await supabase
      .from("beats")
      .select("*")
      .eq("producer_id", user?.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setBeats(data as Beat[]);
    }
    setLoadingBeats(false);
  };

  const fetchWallet = async () => {
    setLoadingWallet(true);
    const { data, error } = await supabase
      .from("producer_wallets")
      .select("*")
      .eq("producer_id", user?.id)
      .single();

    if (!error && data) {
      setWallet(data);
    }
    setLoadingWallet(false);
  };

  const fetchEarnings = async () => {
    setLoadingEarnings(true);
    const { data, error } = await supabase
      .from("producer_earnings")
      .select("*, beats(title), orders(id, created_at)")
      .eq("producer_id", user?.id)
      .order("created_at", { ascending: false })
      .limit(10);

    if (!error && data) {
      setEarnings(data);
    }
    setLoadingEarnings(false);
  };

  const fetchLicenses = async () => {
    setLoadingLicenses(true);
    const { data, error } = await supabase
      .from("licenses")
      .select("*, beats(title, genre, cover_url, producer_id, profiles(full_name))")
      .eq("user_id", user?.id)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setLicenses(data);
    }
    setLoadingLicenses(false);
  };

  const handleRequestPayout = async () => {
    if (!wallet || !payoutAmount || parseFloat(payoutAmount) <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid payout amount.",
        variant: "destructive",
      });
      return;
    }

    if (parseFloat(payoutAmount) > (wallet.available_balance || 0)) {
      toast({
        title: "Insufficient balance",
        description: "You cannot request more than your available balance.",
        variant: "destructive",
      });
      return;
    }

    if (!payoutDetails.trim()) {
      toast({
        title: "Details required",
        description: "Please provide payout details (account number, etc.).",
        variant: "destructive",
      });
      return;
    }

    setRequestingPayout(true);

    try {
      const { error } = await supabase.from("payout_requests").insert({
        producer_id: user?.id,
        amount: parseFloat(payoutAmount),
        payout_method: payoutMethod,
        payout_details: { details: payoutDetails },
        status: "pending",
      });

      if (error) throw error;

      toast({
        title: "Payout request submitted",
        description: "Your payout request has been submitted for admin approval.",
      });

      setShowPayoutDialog(false);
      setPayoutAmount("");
      setPayoutDetails("");
      fetchWallet();
    } catch (error: any) {
      toast({
        title: "Request failed",
        description: error.message || "Failed to submit payout request.",
        variant: "destructive",
      });
    } finally {
      setRequestingPayout(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const totalEarnings = wallet?.total_earned || 0;
  const availableBalance = wallet?.available_balance || 0;
  const pendingBalance = wallet?.pending_balance || 0;
  const totalPlays = beats.reduce((sum, beat) => sum + beat.plays_count, 0);
  const publishedBeats = beats.filter((b) => b.status === "published").length;

  return (
    <>
      <Helmet>
        <title>Dashboard - Nsimabeats</title>
      </Helmet>

      <div className="min-h-screen bg-background">
        <Navbar />

        <main className="container pt-28 pb-20">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="font-display text-3xl font-bold text-foreground">
                Welcome, {profile?.full_name || "Producer"}
              </h1>
              <p className="text-muted-foreground">
                Manage your beats and track your performance
              </p>
            </div>
            <Link to="/upload">
              <Button variant="gold" className="gap-2">
                <Plus className="w-4 h-4" />
                Upload New Beat
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            {[
              { icon: Music, label: "Total Beats", value: beats.length },
              { icon: Eye, label: "Published", value: publishedBeats },
              { icon: DollarSign, label: "Total Earnings", value: `MK ${totalEarnings.toFixed(2)}` },
              { icon: Eye, label: "Total Plays", value: totalPlays.toLocaleString() },
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="glass-card p-6 rounded-xl"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <stat.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-display font-bold text-foreground">
                      {stat.value}
                    </p>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Wallet Section for Producers */}
          {profile?.role === "producer" && (
            <div className="glass-card rounded-2xl overflow-hidden mb-10">
              <div className="p-6 border-b border-border">
                <h2 className="font-display font-semibold text-lg">Producer Wallet</h2>
              </div>
              <div className="p-6">
                {loadingWallet ? (
                  <div className="text-center py-8">
                    <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-3 gap-4 mb-6">
                    <div className="p-4 rounded-xl bg-primary/10 border border-primary/20">
                      <p className="text-sm text-muted-foreground mb-1">Available Balance</p>
                      <p className="text-2xl font-bold text-primary">
                        MK {(availableBalance || 0).toFixed(2)}
                      </p>
                    </div>
                    <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                      <p className="text-sm text-muted-foreground mb-1">Pending Balance</p>
                      <p className="text-2xl font-bold text-yellow-600">
                        MK {(pendingBalance || 0).toFixed(2)}
                      </p>
                    </div>
                    <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20">
                      <p className="text-sm text-muted-foreground mb-1">Total Paid Out</p>
                      <p className="text-2xl font-bold text-green-600">
                        MK {(wallet?.total_paid_out || 0).toFixed(2)}
                      </p>
                    </div>
                  </div>
                )}
                {availableBalance > 0 && (
                  <Dialog open={showPayoutDialog} onOpenChange={setShowPayoutDialog}>
                    <DialogTrigger asChild>
                      <Button variant="gold" className="w-full gap-2">
                        <ArrowUpRight className="w-4 h-4" />
                        Request Payout
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Request Payout</DialogTitle>
                        <DialogDescription>
                          Request a payout from your available balance. Admin approval required.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div>
                          <Label>Available Balance</Label>
                          <div className="text-2xl font-bold text-primary mt-1">
                            MK {(availableBalance || 0).toFixed(2)}
                          </div>
                        </div>
                        <div>
                          <Label htmlFor="payoutAmount">Payout Amount (MWK)</Label>
                          <Input
                            id="payoutAmount"
                            type="number"
                            step="0.01"
                            min="0.01"
                            max={availableBalance}
                            value={payoutAmount}
                            onChange={(e) => setPayoutAmount(e.target.value)}
                            placeholder="0.00"
                          />
                        </div>
                        <div>
                          <Label htmlFor="payoutMethod">Payout Method</Label>
                          <Select value={payoutMethod} onValueChange={setPayoutMethod}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                              <SelectItem value="mpamba">Mpamba</SelectItem>
                              <SelectItem value="airtel_money">Airtel Money</SelectItem>
                              <SelectItem value="paypal">PayPal</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="payoutDetails">Account Details</Label>
                          <Textarea
                            id="payoutDetails"
                            value={payoutDetails}
                            onChange={(e) => setPayoutDetails(e.target.value)}
                            placeholder="Enter your account number, mobile number, or payment details..."
                            rows={4}
                          />
                        </div>
                        <Button
                          onClick={handleRequestPayout}
                          disabled={requestingPayout || !payoutAmount || !payoutDetails}
                          className="w-full"
                        >
                          {requestingPayout ? "Submitting..." : "Submit Request"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </div>
            </div>
          )}

          {/* Purchased Licenses (for all users) */}
          <div className="glass-card rounded-2xl overflow-hidden mb-10">
            <div className="p-6 border-b border-border">
              <h2 className="font-display font-semibold text-lg">My Purchased Beats</h2>
            </div>
            {loadingLicenses ? (
              <div className="p-12 text-center">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
              </div>
            ) : licenses.length === 0 ? (
              <div className="p-12 text-center">
                <Music className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-display font-semibold text-lg mb-2">No purchased beats yet</h3>
                <p className="text-muted-foreground mb-6">
                  Purchase beats from the marketplace to see them here
                </p>
                <Link to="/marketplace">
                  <Button variant="gold">Browse Marketplace</Button>
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {licenses.map((license) => (
                  <div key={license.id} className="flex items-center gap-4 p-4 hover:bg-surface/50 transition-colors">
                    <div className="w-14 h-14 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                      {license.beats?.cover_url ? (
                        <img
                          src={license.beats.cover_url}
                          alt={license.beats.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Music className="w-6 h-6 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-foreground truncate">
                        {license.beats?.title || "Unknown Beat"}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {license.beats?.profiles?.full_name || "Unknown Producer"} • {license.license_type.charAt(0).toUpperCase() + license.license_type.slice(1)} License
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          if (!license.audio_url) {
                            toast({
                              title: "No download available",
                              description: "Audio file not found for this license.",
                              variant: "destructive",
                            });
                            return;
                          }

                          try {
                            let storagePath = license.audio_url;
                            
                            // Helper function to extract storage path from Supabase storage URL
                            const extractStoragePath = (url: string): string | null => {
                              // Pattern for Supabase storage URLs:
                              // https://project.supabase.co/storage/v1/object/public/beats/path/to/file
                              // or
                              // https://project.supabase.co/storage/v1/object/sign/beats/path/to/file
                              const match = url.match(/\/storage\/v1\/object\/(?:public|sign)\/beats\/(.+?)(?:\?|$)/);
                              if (match && match[1]) {
                                return decodeURIComponent(match[1]);
                              }
                              return null;
                            };
                            
                            // Always extract the path from URL if it's a full URL
                            // The beats bucket is private, so we can't use public URLs
                            if (license.audio_url.startsWith('http')) {
                              const extracted = extractStoragePath(license.audio_url);
                              
                              if (extracted) {
                                storagePath = extracted;
                              } else {
                                // Not a Supabase storage URL, show error
                                toast({
                                  title: "Invalid download URL",
                                  description: "The download link format is not recognized.",
                                  variant: "destructive",
                                });
                                return;
                              }
                            }
                            
                            // Clean up the path (remove leading slashes, query params, etc.)
                            storagePath = storagePath.replace(/^\/+/, '').split('?')[0].trim();
                            
                            if (!storagePath) {
                              toast({
                                title: "Invalid path",
                                description: "Could not extract file path from URL.",
                                variant: "destructive",
                              });
                              return;
                            }
                            
                            console.log("Creating signed URL for storage path:", storagePath);
                            
                            // Create a signed URL for the private bucket
                            // This requires the user to have a license (enforced by RLS policy)
                            const { data, error } = await supabase.storage
                              .from("beats")
                              .createSignedUrl(storagePath, 3600); // 1 hour expiry
                            
                            if (error) {
                              console.error("Storage error:", {
                                error,
                                message: error.message,
                                path: storagePath,
                                original_url: license.audio_url,
                              });
                              
                              // Provide specific error messages
                              if (error.message?.includes("Bucket not found")) {
                                toast({
                                  title: "Bucket not found",
                                  description: "The storage bucket 'beats' does not exist. Please contact support.",
                                  variant: "destructive",
                                });
                              } else if (error.message?.includes("not found") || error.message?.includes("does not exist")) {
                                toast({
                                  title: "File not found",
                                  description: "The audio file could not be found in storage. Please contact support.",
                                  variant: "destructive",
                                });
                              } else if (error.message?.includes("permission") || error.message?.includes("policy")) {
                                toast({
                                  title: "Access denied",
                                  description: "You don't have permission to download this file. Please contact support if you believe this is an error.",
                                  variant: "destructive",
                                });
                              } else {
                                toast({
                                  title: "Download failed",
                                  description: error.message || "Could not generate download link. Please contact support.",
                                  variant: "destructive",
                                });
                              }
                              return;
                            }
                            
                            if (data?.signedUrl) {
                              // Open the signed URL in a new tab
                              window.open(data.signedUrl, "_blank");
                            } else {
                              throw new Error("No signed URL returned from storage");
                            }
                          } catch (error: any) {
                            console.error("Download error:", error);
                            toast({
                              title: "Download failed",
                              description: error.message || "An unexpected error occurred. Please contact support.",
                              variant: "destructive",
                            });
                          }
                        }}
                      >
                        Download
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Beats List (for producers) */}
          {profile?.role === "producer" && (
          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-border">
              <h2 className="font-display font-semibold text-lg">Your Beats</h2>
            </div>

            {loadingBeats ? (
              <div className="p-12 text-center">
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
              </div>
            ) : beats.length === 0 ? (
              <div className="p-12 text-center">
                <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-display font-semibold text-lg mb-2">No beats yet</h3>
                <p className="text-muted-foreground mb-6">
                  Upload your first beat to start selling
                </p>
                <Link to="/upload">
                  <Button variant="gold">Upload Beat</Button>
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {beats.map((beat, index) => {
                  const status = statusConfig[beat.status as keyof typeof statusConfig] || statusConfig.pending;
                  const StatusIcon = status.icon;
                  
                  return (
                    <motion.div
                      key={beat.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center gap-4 p-4 hover:bg-surface/50 transition-colors"
                    >
                      {/* Cover */}
                      <div className="w-14 h-14 rounded-lg bg-muted overflow-hidden flex-shrink-0">
                        {beat.cover_url ? (
                          <img
                            src={beat.cover_url}
                            alt={beat.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Music className="w-6 h-6 text-muted-foreground" />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-foreground truncate">
                          {beat.title}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {beat.genre} • {beat.bpm} BPM
                        </p>
                      </div>

                      {/* Status */}
                      <div className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium", status.bg, status.color)}>
                        <StatusIcon className="w-3.5 h-3.5" />
                        {status.label}
                      </div>

                      {/* Price */}
                      <div className="text-right">
                        <p className="font-semibold text-foreground">
                          MK {beat.price_basic}
                        </p>
                        <p className="text-xs text-muted-foreground">Basic</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
          )}
        </main>
      </div>
    </>
  );
};

export default Dashboard;
