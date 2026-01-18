import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import Navbar from "@/components/layout/Navbar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import {
  Music,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Play,
  Shield,
  FileText,
  Mail,
  Phone,
  Building2,
  MapPin,
  DollarSign,
  Calendar as CalendarIcon,
} from "lucide-react";

interface Beat {
  id: string;
  title: string;
  genre: string;
  bpm: number;
  price_basic: number;
  status: string;
  created_at: string;
  admin_notes: string | null;
  producer_id: string;
  preview_url: string | null;
  profiles?: { full_name: string | null; email: string | null };
}

interface ProducerApplication {
  id: string;
  email: string | null;
  full_name: string | null;
  producer_status: string | null;
  created_at: string;
  bio: string | null;
}

interface SyncTicket {
  id: string;
  company_name: string;
  contact_person: string;
  email: string;
  phone: string;
  project_type: string;
  campaign_duration: string;
  territory: string;
  budget_range: string;
  music_type_mood: string | null;
  deadline: string | null;
  campaign_brief: string | null;
  status: string;
  admin_notes: string | null;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
  user_id: string | null;
}

const Admin = () => {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useAdmin();
  const navigate = useNavigate();

  const [beats, setBeats] = useState<Beat[]>([]);
  const [producers, setProducers] = useState<ProducerApplication[]>([]);
  const [syncTickets, setSyncTickets] = useState<SyncTicket[]>([]);
  const [payoutRequests, setPayoutRequests] = useState<any[]>([]);
  const [loadingBeats, setLoadingBeats] = useState(true);
  const [loadingProducers, setLoadingProducers] = useState(true);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [loadingPayouts, setLoadingPayouts] = useState(true);
  const [adminNotes, setAdminNotes] = useState<Record<string, string>>({});
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !adminLoading) {
      if (!user) {
        navigate("/auth");
      } else if (!isAdmin) {
        navigate("/");
        toast({
          title: "Access Denied",
          description: "You don't have admin privileges.",
          variant: "destructive",
        });
      }
    }
  }, [user, isAdmin, authLoading, adminLoading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchBeats();
      fetchProducers();
      fetchSyncTickets();
      fetchPayoutRequests();
    }
  }, [isAdmin]);

  const fetchBeats = async () => {
    setLoadingBeats(true);
    const { data, error } = await supabase
      .from("beats")
      .select("*, profiles(full_name, email)")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching beats:", error);
      toast({ title: "Error loading beats", variant: "destructive" });
    } else {
      setBeats(data || []);
    }
    setLoadingBeats(false);
  };

  const fetchProducers = async () => {
    setLoadingProducers(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("role", "producer")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching producers:", error);
      toast({ title: "Error loading producers", variant: "destructive" });
    } else {
      setProducers(data || []);
    }
    setLoadingProducers(false);
  };

  const fetchSyncTickets = async () => {
    setLoadingTickets(true);
    const { data, error } = await supabase
      .from("sync_tickets")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching sync tickets:", error);
      toast({ title: "Error loading sync tickets", variant: "destructive" });
    } else {
      setSyncTickets(data || []);
    }
    setLoadingTickets(false);
  };

  const fetchPayoutRequests = async () => {
    setLoadingPayouts(true);
    const { data, error } = await supabase
      .from("payout_requests")
      .select("*, profiles(full_name, email)")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching payout requests:", error);
      toast({ title: "Error loading payout requests", variant: "destructive" });
    } else {
      setPayoutRequests(data || []);
    }
    setLoadingPayouts(false);
  };

  const updatePayoutStatus = async (
    payoutId: string,
    status: "approved" | "rejected" | "completed"
  ) => {
    setProcessingId(payoutId);
    try {
      if (status === "approved") {
        // Move from available_balance to processing
        const payout = payoutRequests.find((p) => p.id === payoutId);
        if (payout) {
          const { data: wallet } = await supabase
            .from("producer_wallets")
            .select("*")
            .eq("producer_id", payout.producer_id)
            .single();

          if (wallet && wallet.available_balance >= payout.amount) {
            await supabase
              .from("producer_wallets")
              .update({
                available_balance: wallet.available_balance - payout.amount,
              })
              .eq("producer_id", payout.producer_id);
          }
        }
      }

      if (status === "completed") {
        const payout = payoutRequests.find((p) => p.id === payoutId);
        if (payout) {
          const { data: wallet } = await supabase
            .from("producer_wallets")
            .select("*")
            .eq("producer_id", payout.producer_id)
            .single();

          if (wallet) {
            await supabase
              .from("producer_wallets")
              .update({
                total_paid_out: wallet.total_paid_out + payout.amount,
              })
              .eq("producer_id", payout.producer_id);
          }
        }
      }

      const { error } = await supabase
        .from("payout_requests")
        .update({
          status,
          processed_by: user?.id,
          processed_at: status === "completed" ? new Date().toISOString() : null,
          admin_notes: adminNotes[payoutId] || null,
        })
        .eq("id", payoutId);

      if (error) throw error;

      toast({
        title: "Payout updated",
        description: `Payout request has been ${status}.`,
      });

      fetchPayoutRequests();
    } catch (error: any) {
      toast({
        title: "Error updating payout",
        description: error.message || "Failed to update payout request.",
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const updateBeatStatus = async (
    beatId: string,
    status: "published" | "rejected"
  ) => {
    setProcessingId(beatId);
    const { error } = await supabase
      .from("beats")
      .update({
        status,
        admin_notes: adminNotes[beatId] || null,
      })
      .eq("id", beatId);

    if (error) {
      toast({ title: "Error updating beat", variant: "destructive" });
    } else {
      toast({
        title: status === "published" ? "Beat Published" : "Beat Rejected",
        description: `The beat has been ${status}.`,
      });
      fetchBeats();
    }
    setProcessingId(null);
  };

  const updateProducerStatus = async (
    userId: string,
    status: "approved" | "rejected"
  ) => {
    setProcessingId(userId);
    const { error } = await supabase
      .from("profiles")
      .update({ producer_status: status })
      .eq("id", userId);

    if (error) {
      toast({ title: "Error updating producer", variant: "destructive" });
    } else {
      toast({
        title: status === "approved" ? "Producer Approved" : "Producer Rejected",
        description: `The producer application has been ${status}.`,
      });
      fetchProducers();
    }
    setProcessingId(null);
  };

  const updateSyncTicketStatus = async (
    ticketId: string,
    status: "pending" | "reviewing" | "quoted" | "approved" | "rejected" | "completed"
  ) => {
    setProcessingId(ticketId);
    const { error } = await supabase
      .from("sync_tickets")
      .update({
        status,
        admin_notes: adminNotes[ticketId] || null,
      })
      .eq("id", ticketId);

    if (error) {
      toast({ title: "Error updating sync ticket", variant: "destructive" });
    } else {
      toast({
        title: "Sync Ticket Updated",
        description: `The ticket status has been updated to ${status}.`,
      });
      fetchSyncTickets();
    }
    setProcessingId(null);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="outline" className="border-yellow-500 text-yellow-500">
            <Clock className="w-3 h-3 mr-1" /> Pending
          </Badge>
        );
      case "reviewing":
        return (
          <Badge variant="outline" className="border-blue-500 text-blue-500">
            <Clock className="w-3 h-3 mr-1" /> Reviewing
          </Badge>
        );
      case "quoted":
        return (
          <Badge variant="outline" className="border-purple-500 text-purple-500">
            <FileText className="w-3 h-3 mr-1" /> Quoted
          </Badge>
        );
      case "processing":
        return (
          <Badge variant="outline" className="border-blue-600 text-blue-600">
            <Clock className="w-3 h-3 mr-1" /> Processing
          </Badge>
        );
      case "approved":
      case "published":
        return (
          <Badge variant="outline" className="border-green-500 text-green-500">
            <CheckCircle className="w-3 h-3 mr-1" /> {status === "published" ? "Published" : "Approved"}
          </Badge>
        );
      case "completed":
        return (
          <Badge variant="outline" className="border-green-600 text-green-600">
            <CheckCircle className="w-3 h-3 mr-1" /> Completed
          </Badge>
        );
      case "rejected":
        return (
          <Badge variant="outline" className="border-red-500 text-red-500">
            <XCircle className="w-3 h-3 mr-1" /> Rejected
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (authLoading || adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) return null;

  const pendingBeats = beats.filter((b) => b.status === "pending");
  const pendingProducers = producers.filter((p) => p.producer_status === "pending");

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8 pt-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-8"
        >
          {/* Header */}
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary/10">
              <Shield className="w-8 h-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Admin Dashboard</h1>
              <p className="text-muted-foreground">
                Manage beats and producer applications
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <Card className="bg-card/50 border-border/50">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-3 rounded-lg bg-yellow-500/10">
                  <Clock className="w-6 h-6 text-yellow-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{pendingBeats.length}</p>
                  <p className="text-sm text-muted-foreground">Pending Beats</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card/50 border-border/50">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-3 rounded-lg bg-green-500/10">
                  <Music className="w-6 h-6 text-green-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {beats.filter((b) => b.status === "published").length}
                  </p>
                  <p className="text-sm text-muted-foreground">Published Beats</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card/50 border-border/50">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-3 rounded-lg bg-blue-500/10">
                  <Users className="w-6 h-6 text-blue-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{pendingProducers.length}</p>
                  <p className="text-sm text-muted-foreground">
                    Pending Applications
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card/50 border-border/50">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-3 rounded-lg bg-purple-500/10">
                  <CheckCircle className="w-6 h-6 text-purple-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {producers.filter((p) => p.producer_status === "approved").length}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Approved Producers
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card/50 border-border/50">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-3 rounded-lg bg-indigo-500/10">
                  <FileText className="w-6 h-6 text-indigo-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {syncTickets.filter((t) => t.status === "pending").length}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Pending Tickets
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-card/50 border-border/50">
              <CardContent className="p-4 flex items-center gap-4">
                <div className="p-3 rounded-lg bg-emerald-500/10">
                  <DollarSign className="w-6 h-6 text-emerald-500" />
                </div>
                <div>
                  <p className="text-2xl font-bold">
                    {payoutRequests.filter((p) => p.status === "pending").length}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Pending Payouts
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="beats" className="space-y-6">
            <TabsList className="bg-card/50">
              <TabsTrigger value="beats" className="gap-2">
                <Music className="w-4 h-4" />
                Beats
                {pendingBeats.length > 0 && (
                  <Badge variant="destructive" className="ml-1">
                    {pendingBeats.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="producers" className="gap-2">
                <Users className="w-4 h-4" />
                Producers
                {pendingProducers.length > 0 && (
                  <Badge variant="destructive" className="ml-1">
                    {pendingProducers.length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="sync-tickets" className="gap-2">
                <FileText className="w-4 h-4" />
                Sync Tickets
                {syncTickets.filter((t) => t.status === "pending").length > 0 && (
                  <Badge variant="destructive" className="ml-1">
                    {syncTickets.filter((t) => t.status === "pending").length}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="payouts" className="gap-2">
                <DollarSign className="w-4 h-4" />
                Payouts
                {payoutRequests.filter((p) => p.status === "pending").length > 0 && (
                  <Badge variant="destructive" className="ml-1">
                    {payoutRequests.filter((p) => p.status === "pending").length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            {/* Beats Tab */}
            <TabsContent value="beats" className="space-y-4">
              {loadingBeats ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : beats.length === 0 ? (
                <Card className="bg-card/50 border-border/50">
                  <CardContent className="py-12 text-center">
                    <Music className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No beats to review</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {beats.map((beat) => (
                    <motion.div
                      key={beat.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <Card className="bg-card/50 border-border/50 hover:border-primary/30 transition-colors">
                        <CardContent className="p-6">
                          <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                            <div className="flex-1 space-y-3">
                              <div className="flex items-start justify-between">
                                <div>
                                  <h3 className="text-lg font-semibold">
                                    {beat.title}
                                  </h3>
                                  <p className="text-sm text-muted-foreground">
                                    by {beat.profiles?.full_name || beat.profiles?.email || "Unknown"}
                                  </p>
                                </div>
                                {getStatusBadge(beat.status)}
                              </div>

                              <div className="flex flex-wrap gap-2 text-sm">
                                <Badge variant="secondary">{beat.genre}</Badge>
                                <Badge variant="outline">{beat.bpm} BPM</Badge>
                                <Badge variant="outline">
                                  MK {beat.price_basic}
                                </Badge>
                              </div>

                              {beat.preview_url && (
                                <audio
                                  controls
                                  className="w-full h-10"
                                  src={beat.preview_url}
                                />
                              )}

                              <p className="text-xs text-muted-foreground">
                                Submitted:{" "}
                                {new Date(beat.created_at).toLocaleDateString()}
                              </p>
                            </div>

                            {beat.status === "pending" && (
                              <div className="space-y-3 lg:w-80">
                                <Textarea
                                  placeholder="Admin notes (optional)..."
                                  value={adminNotes[beat.id] || ""}
                                  onChange={(e) =>
                                    setAdminNotes({
                                      ...adminNotes,
                                      [beat.id]: e.target.value,
                                    })
                                  }
                                  className="text-sm"
                                />
                                <div className="flex gap-2">
                                  <Button
                                    onClick={() =>
                                      updateBeatStatus(beat.id, "published")
                                    }
                                    disabled={processingId === beat.id}
                                    className="flex-1"
                                  >
                                    {processingId === beat.id ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <>
                                        <CheckCircle className="w-4 h-4 mr-2" />
                                        Approve
                                      </>
                                    )}
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    onClick={() =>
                                      updateBeatStatus(beat.id, "rejected")
                                    }
                                    disabled={processingId === beat.id}
                                    className="flex-1"
                                  >
                                    <XCircle className="w-4 h-4 mr-2" />
                                    Reject
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Producers Tab */}
            <TabsContent value="producers" className="space-y-4">
              {loadingProducers ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : producers.length === 0 ? (
                <Card className="bg-card/50 border-border/50">
                  <CardContent className="py-12 text-center">
                    <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      No producer applications
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {producers.map((producer) => (
                    <motion.div
                      key={producer.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <Card className="bg-card/50 border-border/50 hover:border-primary/30 transition-colors">
                        <CardContent className="p-6">
                          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                            <div className="space-y-2">
                              <div className="flex items-center gap-3">
                                <h3 className="text-lg font-semibold">
                                  {producer.full_name || "No name"}
                                </h3>
                                {getStatusBadge(producer.producer_status || "pending")}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {producer.email}
                              </p>
                              {producer.bio && (
                                <p className="text-sm text-muted-foreground line-clamp-2">
                                  {producer.bio}
                                </p>
                              )}
                              <p className="text-xs text-muted-foreground">
                                Applied:{" "}
                                {new Date(producer.created_at).toLocaleDateString()}
                              </p>
                            </div>

                            {producer.producer_status === "pending" && (
                              <div className="flex gap-2">
                                <Button
                                  onClick={() =>
                                    updateProducerStatus(producer.id, "approved")
                                  }
                                  disabled={processingId === producer.id}
                                >
                                  {processingId === producer.id ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <>
                                      <CheckCircle className="w-4 h-4 mr-2" />
                                      Approve
                                    </>
                                  )}
                                </Button>
                                <Button
                                  variant="destructive"
                                  onClick={() =>
                                    updateProducerStatus(producer.id, "rejected")
                                  }
                                  disabled={processingId === producer.id}
                                >
                                  <XCircle className="w-4 h-4 mr-2" />
                                  Reject
                                </Button>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Sync Tickets Tab */}
            <TabsContent value="sync-tickets" className="space-y-4">
              {loadingTickets ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : syncTickets.length === 0 ? (
                <Card className="bg-card/50 border-border/50">
                  <CardContent className="py-12 text-center">
                    <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No sync tickets</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {syncTickets.map((ticket) => (
                    <motion.div
                      key={ticket.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <Card className="bg-card/50 border-border/50 hover:border-primary/30 transition-colors">
                        <CardContent className="p-6">
                          <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                            <div className="flex-1 space-y-4">
                              <div className="flex items-start justify-between">
                                <div>
                                  <h3 className="text-lg font-semibold flex items-center gap-2">
                                    <Building2 className="w-5 h-5 text-primary" />
                                    {ticket.company_name}
                                  </h3>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {ticket.project_type} • {ticket.campaign_duration}
                                  </p>
                                </div>
                                {getStatusBadge(ticket.status)}
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <User className="w-4 h-4" />
                                  <span>{ticket.contact_person}</span>
                                </div>
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <Mail className="w-4 h-4" />
                                  <span>{ticket.email}</span>
                                </div>
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <Phone className="w-4 h-4" />
                                  <span>{ticket.phone}</span>
                                </div>
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <MapPin className="w-4 h-4" />
                                  <span>{ticket.territory}</span>
                                </div>
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <DollarSign className="w-4 h-4" />
                                  <span>{ticket.budget_range}</span>
                                </div>
                                {ticket.deadline && (
                                  <div className="flex items-center gap-2 text-muted-foreground">
                                    <CalendarIcon className="w-4 h-4" />
                                    <span>
                                      Deadline: {new Date(ticket.deadline).toLocaleDateString()}
                                    </span>
                                  </div>
                                )}
                              </div>

                              {ticket.music_type_mood && (
                                <div>
                                  <p className="text-sm font-medium mb-1">Music Type/Mood:</p>
                                  <Badge variant="secondary">{ticket.music_type_mood}</Badge>
                                </div>
                              )}

                              {ticket.campaign_brief && (
                                <div>
                                  <p className="text-sm font-medium mb-1">Campaign Brief:</p>
                                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                    {ticket.campaign_brief}
                                  </p>
                                </div>
                              )}

                              <p className="text-xs text-muted-foreground">
                                Submitted: {new Date(ticket.created_at).toLocaleString()}
                              </p>
                            </div>

                            {ticket.status !== "completed" && ticket.status !== "rejected" && (
                              <div className="space-y-3 lg:w-80">
                                <Textarea
                                  placeholder="Admin notes (optional)..."
                                  value={adminNotes[ticket.id] || ""}
                                  onChange={(e) =>
                                    setAdminNotes({
                                      ...adminNotes,
                                      [ticket.id]: e.target.value,
                                    })
                                  }
                                  className="text-sm"
                                />
                                <div className="grid grid-cols-2 gap-2">
                                  {ticket.status === "pending" && (
                                    <Button
                                      onClick={() => updateSyncTicketStatus(ticket.id, "reviewing")}
                                      disabled={processingId === ticket.id}
                                      variant="outline"
                                      size="sm"
                                    >
                                      {processingId === ticket.id ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                      ) : (
                                        "Review"
                                      )}
                                    </Button>
                                  )}
                                  {ticket.status === "reviewing" && (
                                    <Button
                                      onClick={() => updateSyncTicketStatus(ticket.id, "quoted")}
                                      disabled={processingId === ticket.id}
                                      variant="outline"
                                      size="sm"
                                    >
                                      {processingId === ticket.id ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                      ) : (
                                        "Mark Quoted"
                                      )}
                                    </Button>
                                  )}
                                  <Button
                                    onClick={() => updateSyncTicketStatus(ticket.id, "approved")}
                                    disabled={processingId === ticket.id}
                                    size="sm"
                                  >
                                    {processingId === ticket.id ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <>
                                        <CheckCircle className="w-4 h-4 mr-2" />
                                        Approve
                                      </>
                                    )}
                                  </Button>
                                  <Button
                                    onClick={() => updateSyncTicketStatus(ticket.id, "completed")}
                                    disabled={processingId === ticket.id}
                                    variant="outline"
                                    size="sm"
                                  >
                                    {processingId === ticket.id ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                      "Complete"
                                    )}
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    onClick={() => updateSyncTicketStatus(ticket.id, "rejected")}
                                    disabled={processingId === ticket.id}
                                    size="sm"
                                    className="col-span-2"
                                  >
                                    {processingId === ticket.id ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <>
                                        <XCircle className="w-4 h-4 mr-2" />
                                        Reject
                                      </>
                                    )}
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Payout Requests Tab */}
            <TabsContent value="payouts" className="space-y-4">
              {loadingPayouts ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : payoutRequests.length === 0 ? (
                <Card className="bg-card/50 border-border/50">
                  <CardContent className="py-12 text-center">
                    <DollarSign className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No payout requests</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {payoutRequests.map((request) => (
                    <motion.div
                      key={request.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <Card className="bg-card/50 border-border/50 hover:border-primary/30 transition-colors">
                        <CardContent className="p-6">
                          <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                            <div className="flex-1 space-y-4">
                              <div className="flex items-start justify-between">
                                <div>
                                  <h3 className="text-lg font-semibold flex items-center gap-2">
                                    <User className="w-5 h-5 text-primary" />
                                    {request.profiles?.full_name || request.profiles?.email || "Unknown Producer"}
                                  </h3>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {request.payout_method.replace("_", " ").toUpperCase()}
                                  </p>
                                </div>
                                {getStatusBadge(request.status)}
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <DollarSign className="w-4 h-4" />
                                  <span className="font-semibold text-foreground">Amount: MK {parseFloat(request.amount).toFixed(2)}</span>
                                </div>
                                {request.payout_details && (
                                  <div className="flex items-start gap-2 text-muted-foreground">
                                    <CreditCard className="w-4 h-4 mt-0.5" />
                                    <span className="break-words">{typeof request.payout_details === 'object' ? request.payout_details.details : request.payout_details}</span>
                                  </div>
                                )}
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <CalendarIcon className="w-4 h-4" />
                                  <span>
                                    Requested: {new Date(request.created_at).toLocaleString()}
                                  </span>
                                </div>
                                {request.processed_at && (
                                  <div className="flex items-center gap-2 text-muted-foreground">
                                    <CheckCircle className="w-4 h-4" />
                                    <span>
                                      Processed: {new Date(request.processed_at).toLocaleString()}
                                    </span>
                                  </div>
                                )}
                              </div>

                              {request.admin_notes && (
                                <div>
                                  <p className="text-sm font-medium mb-1">Admin Notes:</p>
                                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                                    {request.admin_notes}
                                  </p>
                                </div>
                              )}
                            </div>

                            {request.status === "pending" && (
                              <div className="space-y-3 lg:w-80">
                                <Textarea
                                  placeholder="Admin notes (optional)..."
                                  value={adminNotes[request.id] || ""}
                                  onChange={(e) =>
                                    setAdminNotes({
                                      ...adminNotes,
                                      [request.id]: e.target.value,
                                    })
                                  }
                                  className="text-sm"
                                />
                                <div className="grid grid-cols-2 gap-2">
                                  <Button
                                    onClick={() => updatePayoutStatus(request.id, "approved")}
                                    disabled={processingId === request.id}
                                    size="sm"
                                  >
                                    {processingId === request.id ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <>
                                        <CheckCircle className="w-4 h-4 mr-2" />
                                        Approve
                                      </>
                                    )}
                                  </Button>
                                  <Button
                                    onClick={() => updatePayoutStatus(request.id, "processing")}
                                    disabled={processingId === request.id || request.status !== "approved"}
                                    variant="outline"
                                    size="sm"
                                  >
                                    {processingId === request.id ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                      "Mark Processing"
                                    )}
                                  </Button>
                                  <Button
                                    onClick={() => updatePayoutStatus(request.id, "completed")}
                                    disabled={processingId === request.id || request.status !== "processing"}
                                    variant="outline"
                                    size="sm"
                                  >
                                    {processingId === request.id ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                      "Complete"
                                    )}
                                  </Button>
                                  <Button
                                    variant="destructive"
                                    onClick={() => updatePayoutStatus(request.id, "rejected")}
                                    disabled={processingId === request.id}
                                    size="sm"
                                    className="col-span-2"
                                  >
                                    {processingId === request.id ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <>
                                        <XCircle className="w-4 h-4 mr-2" />
                                        Reject
                                      </>
                                    )}
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
};

export default Admin;
