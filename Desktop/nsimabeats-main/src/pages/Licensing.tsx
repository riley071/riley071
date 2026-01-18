import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Helmet } from "react-helmet-async";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { format } from "date-fns";
import { CalendarIcon, ArrowRight, FileText, Briefcase, Video, Film, Heart, Users, Music2, Mail, Phone, Building2, User, Clock, MapPin, DollarSign, Send, CheckCircle2 } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

const licenseFormSchema = z.object({
  companyName: z.string().min(1, "Company/NGO name is required"),
  contactPerson: z.string().min(1, "Contact person name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(1, "Phone number is required"),
  projectType: z.enum(["Corporate", "NGO", "Film/TV", "Documentary", "Advocacy", "Other"], {
    required_error: "Please select a project type",
  }),
  campaignDuration: z.string().min(1, "Campaign duration is required"),
  territory: z.string().min(1, "Territory is required"),
  budgetRange: z.string().min(1, "Budget range is required"),
  musicTypeMood: z.string().optional(),
  deadline: z.date().optional(),
  campaignBrief: z.string().optional(),
});

type LicenseFormValues = z.infer<typeof licenseFormSchema>;

const useCases = [
  { id: "corporate", name: "Corporate", icon: Briefcase, description: "Brand campaigns, commercials, corporate events" },
  { id: "ngo", name: "NGO", icon: Heart, description: "Non-profit campaigns, awareness programs" },
  { id: "film-tv", name: "Film/TV", icon: Film, description: "Feature films, TV shows, series" },
  { id: "documentary", name: "Documentary", icon: Video, description: "Documentaries, docuseries" },
  { id: "advocacy", name: "Advocacy", icon: Users, description: "Social movements, political campaigns" },
];

const themes = [
  { id: "hope", name: "Hope", color: "bg-blue-500/10 text-blue-600 border-blue-200" },
  { id: "unity", name: "Unity", color: "bg-purple-500/10 text-purple-600 border-purple-200" },
  { id: "love", name: "Love", color: "bg-pink-500/10 text-pink-600 border-pink-200" },
  { id: "struggle", name: "Struggle", color: "bg-orange-500/10 text-orange-600 border-orange-200" },
  { id: "faith", name: "Faith", color: "bg-indigo-500/10 text-indigo-600 border-indigo-200" },
  { id: "youth", name: "Youth", color: "bg-green-500/10 text-green-600 border-green-200" },
  { id: "heritage", name: "Heritage", color: "bg-amber-500/10 text-amber-600 border-amber-200" },
];

const Licensing = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedUseCase, setSelectedUseCase] = useState<string | null>(null);
  const [selectedThemes, setSelectedThemes] = useState<string[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const form = useForm<LicenseFormValues>({
    resolver: zodResolver(licenseFormSchema),
    defaultValues: {
      companyName: "",
      contactPerson: "",
      email: user?.email || "",
      phone: "",
      projectType: undefined,
      campaignDuration: "",
      territory: "",
      budgetRange: "",
      musicTypeMood: "",
      deadline: undefined,
      campaignBrief: "",
    },
  });

  const onSubmit = async (data: LicenseFormValues) => {
    setSubmitting(true);
    try {
      // Create sync ticket in database
      const { data: ticket, error } = await supabase
        .from("sync_tickets")
        .insert({
          company_name: data.companyName,
          contact_person: data.contactPerson,
          email: data.email,
          phone: data.phone,
          project_type: data.projectType,
          campaign_duration: data.campaignDuration,
          territory: data.territory,
          budget_range: data.budgetRange,
          music_type_mood: data.musicTypeMood || null,
          deadline: data.deadline ? format(data.deadline, "yyyy-MM-dd") : null,
          campaign_brief: data.campaignBrief || null,
          status: "pending",
          user_id: user?.id || null,
        })
        .select()
        .single();

      if (error) throw error;

      // TODO: Send confirmation email (can be implemented via Supabase Edge Function or email service)
      // For now, we'll just show a success message
      
      setSubmitted(true);
      toast({
        title: "License Request Submitted!",
        description: "We've received your request and will contact you within 48 hours.",
      });

      // Reset form after 3 seconds
      setTimeout(() => {
        setSubmitted(false);
        form.reset();
        setShowForm(false);
      }, 3000);
    } catch (error: any) {
      console.error("Error submitting license request:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to submit license request. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const toggleTheme = (themeId: string) => {
    setSelectedThemes((prev) =>
      prev.includes(themeId) ? prev.filter((id) => id !== themeId) : [...prev, themeId]
    );
  };

  return (
    <>
      <Helmet>
        <title>Music Licensing - Nsimabeats</title>
        <meta name="description" content="License premium African music for your corporate campaigns, films, documentaries, and advocacy projects." />
      </Helmet>
      <div className="min-h-screen bg-background">
        <Navbar />

        {/* Hero Section */}
        <section className="relative pt-32 pb-20 px-4 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-background" />
          <div className="container mx-auto relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="max-w-4xl mx-auto text-center"
            >
              <Badge className="mb-6 bg-primary/10 text-primary border-primary/30">
                Powered by Gold Mountain Music • Publishing by Universal
              </Badge>
              <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6">
                Music Licensing
                <br />
                <span className="text-gradient-gold">Made Simple</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
                From brief to broadcast in under 48 hours. License premium African music for your corporate campaigns, films, documentaries, and advocacy projects.
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
                <Button
                  size="lg"
                  className="gap-2"
                  onClick={() => navigate("/marketplace")}
                >
                  Browse Sync Packs
                  <ArrowRight className="w-4 h-4" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="gap-2"
                  onClick={() => {
                    setShowForm(true);
                    document.getElementById("license-form")?.scrollIntoView({ behavior: "smooth" });
                  }}
                >
                  <FileText className="w-4 h-4" />
                  Request License
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="gap-2"
                  onClick={() => {
                    setShowForm(true);
                    form.setValue("campaignBrief", "");
                    document.getElementById("license-form")?.scrollIntoView({ behavior: "smooth" });
                  }}
                >
                  <Briefcase className="w-4 h-4" />
                  Submit Campaign Brief
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Use Case Browsing */}
        <section className="py-16 px-4 bg-card/50">
          <div className="container mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
                Browse by Use Case
              </h2>
              <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
                Find the perfect music for your specific project type
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {useCases.map((useCase) => {
                  const Icon = useCase.icon;
                  return (
                    <motion.div
                      key={useCase.id}
                      whileHover={{ y: -4 }}
                      onClick={() => {
                        setSelectedUseCase(useCase.id);
                        setShowForm(true);
                        form.setValue("projectType", useCase.id === "corporate" ? "Corporate" : useCase.id === "film-tv" ? "Film/TV" : useCase.id === "ngo" ? "NGO" : useCase.id === "advocacy" ? "Advocacy" : "Documentary");
                        document.getElementById("license-form")?.scrollIntoView({ behavior: "smooth" });
                      }}
                    >
                      <Card className="cursor-pointer hover:border-primary transition-colors h-full">
                        <CardHeader>
                          <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                            <Icon className="w-6 h-6 text-primary" />
                          </div>
                          <CardTitle>{useCase.name}</CardTitle>
                          <CardDescription>{useCase.description}</CardDescription>
                        </CardHeader>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Theme Filtering */}
        <section className="py-16 px-4">
          <div className="container mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
                Browse by Theme
              </h2>
              <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
                Discover music that matches your campaign's emotional tone
              </p>
              <div className="flex flex-wrap items-center justify-center gap-4">
                {themes.map((theme) => (
                  <Badge
                    key={theme.id}
                    variant="outline"
                    className={cn(
                      "px-6 py-3 text-base cursor-pointer transition-all hover:scale-105",
                      selectedThemes.includes(theme.id) ? theme.color : "border-border"
                    )}
                    onClick={() => toggleTheme(theme.id)}
                  >
                    {theme.name}
                  </Badge>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Request License Form */}
        <section id="license-form" className="py-16 px-4 bg-card/50">
          <div className="container mx-auto max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl md:text-3xl">Request a License</CardTitle>
                  <CardDescription>
                    Fill out the form below and we'll get back to you within 48 hours with a customized quote.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {submitted ? (
                    <div className="text-center py-12">
                      <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                      <h3 className="text-2xl font-bold mb-2">Request Submitted!</h3>
                      <p className="text-muted-foreground">
                        We've received your request and will contact you within 48 hours.
                      </p>
                    </div>
                  ) : (
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      {/* Company/NGO Name */}
                      <div className="space-y-2">
                        <Label htmlFor="companyName" className="flex items-center gap-2">
                          <Building2 className="w-4 h-4" />
                          Company/NGO Name <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="companyName"
                          {...form.register("companyName")}
                          placeholder="Enter your company or NGO name"
                        />
                        {form.formState.errors.companyName && (
                          <p className="text-sm text-destructive">
                            {form.formState.errors.companyName.message}
                          </p>
                        )}
                      </div>

                      {/* Contact Person */}
                      <div className="space-y-2">
                        <Label htmlFor="contactPerson" className="flex items-center gap-2">
                          <User className="w-4 h-4" />
                          Contact Person <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="contactPerson"
                          {...form.register("contactPerson")}
                          placeholder="Full name of contact person"
                        />
                        {form.formState.errors.contactPerson && (
                          <p className="text-sm text-destructive">
                            {form.formState.errors.contactPerson.message}
                          </p>
                        )}
                      </div>

                      {/* Email & Phone */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label htmlFor="email" className="flex items-center gap-2">
                            <Mail className="w-4 h-4" />
                            Email <span className="text-destructive">*</span>
                          </Label>
                          <Input
                            id="email"
                            type="email"
                            {...form.register("email")}
                            placeholder="contact@example.com"
                          />
                          {form.formState.errors.email && (
                            <p className="text-sm text-destructive">
                              {form.formState.errors.email.message}
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="phone" className="flex items-center gap-2">
                            <Phone className="w-4 h-4" />
                            Phone <span className="text-destructive">*</span>
                          </Label>
                          <Input
                            id="phone"
                            type="tel"
                            {...form.register("phone")}
                            placeholder="+1 (555) 000-0000"
                          />
                          {form.formState.errors.phone && (
                            <p className="text-sm text-destructive">
                              {form.formState.errors.phone.message}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Project Type */}
                      <div className="space-y-2">
                        <Label htmlFor="projectType" className="flex items-center gap-2">
                          <Briefcase className="w-4 h-4" />
                          Project Type <span className="text-destructive">*</span>
                        </Label>
                        <Select
                          value={form.watch("projectType")}
                          onValueChange={(value) => form.setValue("projectType", value as any)}
                        >
                          <SelectTrigger id="projectType">
                            <SelectValue placeholder="Select project type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Corporate">Corporate</SelectItem>
                            <SelectItem value="NGO">NGO</SelectItem>
                            <SelectItem value="Film/TV">Film/TV</SelectItem>
                            <SelectItem value="Documentary">Documentary</SelectItem>
                            <SelectItem value="Advocacy">Advocacy</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                        {form.formState.errors.projectType && (
                          <p className="text-sm text-destructive">
                            {form.formState.errors.projectType.message}
                          </p>
                        )}
                      </div>

                      {/* Campaign Duration */}
                      <div className="space-y-2">
                        <Label htmlFor="campaignDuration" className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          Campaign Duration <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="campaignDuration"
                          {...form.register("campaignDuration")}
                          placeholder="e.g., 6 months, 1 year, Ongoing"
                        />
                        {form.formState.errors.campaignDuration && (
                          <p className="text-sm text-destructive">
                            {form.formState.errors.campaignDuration.message}
                          </p>
                        )}
                      </div>

                      {/* Territory */}
                      <div className="space-y-2">
                        <Label htmlFor="territory" className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          Territory <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="territory"
                          {...form.register("territory")}
                          placeholder="e.g., Worldwide, Africa, North America"
                        />
                        {form.formState.errors.territory && (
                          <p className="text-sm text-destructive">
                            {form.formState.errors.territory.message}
                          </p>
                        )}
                      </div>

                      {/* Budget Range */}
                      <div className="space-y-2">
                        <Label htmlFor="budgetRange" className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4" />
                          Budget Range <span className="text-destructive">*</span>
                        </Label>
                        <Select
                          value={form.watch("budgetRange")}
                          onValueChange={(value) => form.setValue("budgetRange", value)}
                        >
                          <SelectTrigger id="budgetRange">
                            <SelectValue placeholder="Select budget range" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Under MK 1,690,000">Under MK 1,690,000</SelectItem>
                            <SelectItem value="MK 1,690,000 - MK 8,450,000">MK 1,690,000 - MK 8,450,000</SelectItem>
                            <SelectItem value="MK 8,450,000 - MK 16,900,000">MK 8,450,000 - MK 16,900,000</SelectItem>
                            <SelectItem value="MK 16,900,000 - MK 42,250,000">MK 16,900,000 - MK 42,250,000</SelectItem>
                            <SelectItem value="MK 42,250,000 - MK 84,500,000">MK 42,250,000 - MK 84,500,000</SelectItem>
                            <SelectItem value="MK 84,500,000+">MK 84,500,000+</SelectItem>
                          </SelectContent>
                        </Select>
                        {form.formState.errors.budgetRange && (
                          <p className="text-sm text-destructive">
                            {form.formState.errors.budgetRange.message}
                          </p>
                        )}
                      </div>

                      {/* Music Type/Mood */}
                      <div className="space-y-2">
                        <Label htmlFor="musicTypeMood" className="flex items-center gap-2">
                          <Music2 className="w-4 h-4" />
                          Music Type/Mood
                        </Label>
                        <Input
                          id="musicTypeMood"
                          {...form.register("musicTypeMood")}
                          placeholder="e.g., Upbeat, Emotional, African, Electronic"
                        />
                      </div>

                      {/* Deadline */}
                      <div className="space-y-2">
                        <Label className="flex items-center gap-2">
                          <CalendarIcon className="w-4 h-4" />
                          Deadline
                        </Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !form.watch("deadline") && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {form.watch("deadline") ? (
                                format(form.watch("deadline")!, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={form.watch("deadline")}
                              onSelect={(date) => form.setValue("deadline", date)}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>

                      {/* Campaign Brief */}
                      <div className="space-y-2">
                        <Label htmlFor="campaignBrief" className="flex items-center gap-2">
                          <FileText className="w-4 h-4" />
                          Campaign Brief (Optional)
                        </Label>
                        <Textarea
                          id="campaignBrief"
                          {...form.register("campaignBrief")}
                          placeholder="Tell us about your campaign, target audience, and any specific requirements..."
                          rows={6}
                        />
                      </div>

                      {/* Submit Button */}
                      <Button
                        type="submit"
                        size="lg"
                        className="w-full gap-2"
                        disabled={submitting}
                      >
                        {submitting ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Submitting...
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4" />
                            Submit License Request
                          </>
                        )}
                      </Button>
                    </form>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </section>

        <Footer />
      </div>
    </>
  );
};

export default Licensing;
