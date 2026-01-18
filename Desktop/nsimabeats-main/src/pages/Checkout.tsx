import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CreditCard, Smartphone, CheckCircle2, Loader2 } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useCart } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { generateLicensePDF } from "@/lib/generateLicensePDF";

type PaymentMethod = "card" | "mpamba" | "airtel_money" | "bank_transfer";

const Checkout = () => {
  const { items, loading: cartLoading, getTotal, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");
  const [processing, setProcessing] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);

  // Form fields
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCVC, setCardCVC] = useState("");
  const [cardName, setCardName] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [paymentReference, setPaymentReference] = useState("");

  useEffect(() => {
    if (!cartLoading && items.length === 0 && !orderComplete) {
      navigate("/cart");
    }
  }, [items, cartLoading, navigate, orderComplete]);

  if (!user) {
    navigate("/auth");
    return null;
  }

  const total = getTotal();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);

    try {
      // Create order (using any to avoid strict generated types issues for now)
      const { data: order, error: orderError } = await supabase
        // @ts-ignore - orders table exists in Supabase but not in generated types
        .from("orders")
        .insert({
          user_id: user.id,
          total_amount: total,
          status: "pending",
          payment_method: paymentMethod,
          payment_reference: paymentReference || null,
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = items.map((item) => ({
        order_id: order.id,
        beat_id: item.beat_id,
        license_type: item.license_type,
        price: item.price,
      }));

      // Insert order items (orders_items not in generated types)
      // @ts-ignore
      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Fetch user profile for PDF generation
      const { data: userProfile } = await supabase
        .from("profiles")
        .select("full_name, email")
        .eq("id", user.id)
        .single();

      // Create licenses with PDF generation
      const licenses = await Promise.all(
        items.map(async (item) => {
          // Fetch the full beat data to get audio_url, title, and producer info
          const { data: beatData } = await supabase
            .from("beats")
            .select("audio_url, title, producer_id, profiles(full_name)")
            .eq("id", item.beat_id)
            .single();

          // Generate PDF license
          let licenseDocumentUrl = null;
          try {
            const licenseId = crypto.randomUUID();
            const pdfBlob = await generateLicensePDF({
              licenseId,
              beatTitle: beatData?.title || "Unknown Beat",
              producerName: (beatData?.profiles as any)?.full_name || "Unknown Producer",
              licenseType: item.license_type,
              purchaseDate: new Date().toISOString(),
              buyerName: userProfile?.full_name || user.email || "Unknown Buyer",
              buyerEmail: userProfile?.email || user.email || "",
              orderId: order.id,
              price: item.price,
            });

            // Upload PDF to storage
            const pdfFileName = `licenses/${user.id}/${order.id}/${licenseId}.pdf`;
            const { error: uploadError } = await supabase.storage
              .from("beats") // Using beats bucket for now, could create dedicated bucket
              .upload(pdfFileName, pdfBlob, {
                contentType: "application/pdf",
              });

            if (uploadError) {
              console.error("PDF upload error:", uploadError);
              // Don't throw - continue without PDF URL
            } else {
              // Get public URL for the PDF
              const { data: pdfUrlData } = supabase.storage
                .from("beats")
                .getPublicUrl(pdfFileName);
              licenseDocumentUrl = pdfUrlData.publicUrl;
            }
          } catch (pdfError) {
            console.error("PDF generation error:", pdfError);
            // Continue without PDF - don't fail the entire checkout
          }

          return {
            user_id: user.id,
            beat_id: item.beat_id,
            order_id: order.id,
            license_type: item.license_type,
            audio_url: beatData?.audio_url || "",
            license_document_url: licenseDocumentUrl,
          };
        })
      );

      // Insert licenses (licenses not in generated types)
      // @ts-ignore
      const { error: licensesError } = await supabase
        .from("licenses")
        .insert(licenses);

      if (licensesError) throw licensesError;

      // Update order status to completed
      // Update order status
      // @ts-ignore
      const { error: updateError } = await supabase
        .from("orders")
        .update({
          status: "completed",
          payment_confirmed_at: new Date().toISOString(),
        })
        .eq("id", order.id);

      if (updateError) throw updateError;

      // Create producer earnings for each order item
      for (const item of items) {
        // Get beat producer_id
        const { data: beatData } = await supabase
          .from("beats")
          .select("producer_id, price_basic, price_premium, price_unlimited, price_exclusive")
          .eq("id", item.beat_id)
          .single();

        if (beatData && beatData.producer_id) {
          // Calculate platform fee (20% commission)
          const platformFee = item.price * 0.20;
          const earningsAmount = item.price - platformFee;

          // Get order_item_id
          // @ts-ignore
          const { data: orderItemData } = await supabase
            .from("order_items")
            .select("id")
            .eq("order_id", order.id)
            .eq("beat_id", item.beat_id)
            .single();

          // Create earnings record
          // Insert producer earnings (table not in generated types)
          // @ts-ignore
          await supabase.from("producer_earnings").insert({
            producer_id: beatData.producer_id,
            order_id: order.id,
            order_item_id: orderItemData?.id || null,
            beat_id: item.beat_id,
            sale_amount: item.price,
            platform_fee: platformFee,
            earnings_amount: earningsAmount,
            status: "pending",
          });

          // Update or create wallet
          // @ts-ignore
          const { data: wallet } = await supabase
            .from("producer_wallets")
            .select("*")
            .eq("producer_id", beatData.producer_id)
            .single();

          if (wallet) {
            // @ts-ignore
            await supabase
              .from("producer_wallets")
              .update({
                pending_balance: wallet.pending_balance + earningsAmount,
                total_earned: wallet.total_earned + earningsAmount,
              })
              .eq("producer_id", beatData.producer_id);
          } else {
            // @ts-ignore
            await supabase.from("producer_wallets").insert({
              producer_id: beatData.producer_id,
              pending_balance: earningsAmount,
              total_earned: earningsAmount,
            });
          }
        }
      }

      // Clear cart
      await clearCart();

      setOrderId(order.id);
      setOrderComplete(true);

      toast({
        title: "Order completed!",
        description: "Your beats are now available for download.",
      });
    } catch (error: any) {
      console.error("Checkout error:", error);
      toast({
        title: "Payment failed",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  if (orderComplete) {
    return (
      <>
        <Helmet>
          <title>Order Complete - Nsimabeats</title>
        </Helmet>
        <div className="min-h-screen bg-background">
          <Navbar />
          <main className="pt-32 pb-24">
            <div className="container max-w-2xl">
              <div className="text-center">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 className="w-10 h-10 text-primary" />
                </div>
                <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
                  Order Complete!
                </h1>
                <p className="text-muted-foreground mb-8">
                  Thank you for your purchase. Your beats are now available in your dashboard.
                </p>
                <div className="space-y-4">
                  <Link to="/dashboard">
                    <Button variant="gold" size="lg" className="gap-2">
                      View My Beats
                      <ArrowLeft className="w-4 h-4 rotate-180" />
                    </Button>
                  </Link>
                  <Link to="/marketplace">
                    <Button variant="outline" size="lg">
                      Continue Shopping
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </main>
          <Footer />
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Checkout - Nsimabeats</title>
      </Helmet>
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-32 pb-24">
          <div className="container max-w-4xl">
            <Link to="/cart" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8">
              <ArrowLeft className="w-4 h-4" />
              Back to Cart
            </Link>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Checkout Form */}
              <div className="lg:col-span-2">
                <div className="bg-card border border-border rounded-xl p-6 md:p-8">
                  <h2 className="font-display text-2xl font-bold mb-6">Payment Details</h2>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Payment Method Selection */}
                    <div>
                      <Label className="text-base mb-4 block">Payment Method</Label>
                      <RadioGroup
                        value={paymentMethod}
                        onValueChange={(value) => setPaymentMethod(value as PaymentMethod)}
                        className="space-y-3"
                      >
                        <div className="flex items-center space-x-2 p-4 rounded-lg border border-border hover:border-primary/50 transition-colors">
                          <RadioGroupItem value="card" id="card" />
                          <Label htmlFor="card" className="flex-1 cursor-pointer flex items-center gap-3">
                            <CreditCard className="w-5 h-5" />
                            <span>Credit/Debit Card</span>
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2 p-4 rounded-lg border border-border hover:border-primary/50 transition-colors">
                          <RadioGroupItem value="mpamba" id="mpamba" />
                          <Label htmlFor="mpamba" className="flex-1 cursor-pointer flex items-center gap-3">
                            <Smartphone className="w-5 h-5" />
                            <span>Mpamba</span>
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2 p-4 rounded-lg border border-border hover:border-primary/50 transition-colors">
                          <RadioGroupItem value="airtel_money" id="airtel_money" />
                          <Label htmlFor="airtel_money" className="flex-1 cursor-pointer flex items-center gap-3">
                            <Smartphone className="w-5 h-5" />
                            <span>Airtel Money</span>
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2 p-4 rounded-lg border border-border hover:border-primary/50 transition-colors">
                          <RadioGroupItem value="bank_transfer" id="bank_transfer" />
                          <Label htmlFor="bank_transfer" className="flex-1 cursor-pointer flex items-center gap-3">
                            <CreditCard className="w-5 h-5" />
                            <span>Bank Transfer</span>
                          </Label>
                        </div>
                      </RadioGroup>
                    </div>

                    {/* Card Payment Fields */}
                    {paymentMethod === "card" && (
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="cardName">Cardholder Name</Label>
                          <Input
                            id="cardName"
                            value={cardName}
                            onChange={(e) => setCardName(e.target.value)}
                            placeholder="John Doe"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="cardNumber">Card Number</Label>
                          <Input
                            id="cardNumber"
                            value={cardNumber}
                            onChange={(e) => setCardNumber(e.target.value.replace(/\s/g, ""))}
                            placeholder="1234 5678 9012 3456"
                            maxLength={16}
                            required
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="cardExpiry">Expiry Date</Label>
                            <Input
                              id="cardExpiry"
                              value={cardExpiry}
                              onChange={(e) => setCardExpiry(e.target.value)}
                              placeholder="MM/YY"
                              maxLength={5}
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="cardCVC">CVC</Label>
                            <Input
                              id="cardCVC"
                              value={cardCVC}
                              onChange={(e) => setCardCVC(e.target.value)}
                              placeholder="123"
                              maxLength={4}
                              required
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Mobile Money Fields */}
                    {(paymentMethod === "mpamba" || paymentMethod === "airtel_money") && (
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="mobileNumber">Mobile Number</Label>
                          <Input
                            id="mobileNumber"
                            value={mobileNumber}
                            onChange={(e) => setMobileNumber(e.target.value)}
                            placeholder="0991234567"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="paymentReference">Payment Reference (Optional)</Label>
                          <Input
                            id="paymentReference"
                            value={paymentReference}
                            onChange={(e) => setPaymentReference(e.target.value)}
                            placeholder="Transaction reference number"
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            If you've already made the payment, enter the reference number here.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Bank Transfer Fields */}
                    {paymentMethod === "bank_transfer" && (
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="bankAccount">Bank Account Number</Label>
                          <Input
                            id="bankAccount"
                            value={mobileNumber}
                            onChange={(e) => setMobileNumber(e.target.value)}
                            placeholder="Enter your bank account number"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="paymentReference">Transaction Reference</Label>
                          <Input
                            id="paymentReference"
                            value={paymentReference}
                            onChange={(e) => setPaymentReference(e.target.value)}
                            placeholder="Bank transfer reference number"
                            required
                          />
                          <p className="text-xs text-muted-foreground mt-1">
                            Please include the transaction reference when making your bank transfer.
                          </p>
                        </div>
                      </div>
                    )}

                    <Button
                      type="submit"
                      variant="gold"
                      size="lg"
                      className="w-full gap-2"
                      disabled={processing || items.length === 0}
                    >
                      {processing ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          Complete Purchase
                          <CreditCard className="w-4 h-4" />
                        </>
                      )}
                    </Button>
                  </form>
                </div>
              </div>

              {/* Order Summary */}
              <div className="lg:col-span-1">
                <div className="bg-card border border-border rounded-xl p-6 sticky top-24">
                  <h2 className="font-display font-semibold text-xl mb-6">Order Summary</h2>

                  <div className="space-y-4 mb-6">
                    {items.map((item) => (
                      <div key={item.id} className="flex items-start gap-3">
                        {item.beat?.cover_url && (
                          <img
                            src={item.beat.cover_url}
                            alt={item.beat.title}
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{item.beat?.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.license_type.charAt(0).toUpperCase() + item.license_type.slice(1)}
                          </p>
                          <p className="text-sm font-semibold text-primary mt-1">
                            MK {item.price.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t border-border pt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="font-medium">MK {total.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Processing Fee</span>
                      <span className="font-medium">MK 0.00</span>
                    </div>
                    <div className="border-t border-border pt-2">
                      <div className="flex justify-between">
                        <span className="font-display font-semibold text-lg">Total</span>
                        <span className="font-display font-bold text-xl text-primary">
                          MK {total.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
};

export default Checkout;

