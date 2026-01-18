import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useNavigate } from "react-router-dom";
import { ShoppingCart, Trash2, ArrowRight, Minus, Plus } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { useCart, LicenseType } from "@/hooks/useCart";
import { useAuth } from "@/hooks/useAuth";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const licenseLabels: Record<LicenseType, string> = {
  basic: "Basic License",
  premium: "Premium License",
  unlimited: "Unlimited License",
  exclusive: "Exclusive License",
};

const Cart = () => {
  const { items, loading, removeFromCart, updateCartItem, getTotal, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleLicenseChange = (itemId: string, beat: any, newLicense: LicenseType) => {
    let price = 0;
    switch (newLicense) {
      case "basic":
        price = beat.price_basic;
        break;
      case "premium":
        price = beat.price_premium || beat.price_basic;
        break;
      case "unlimited":
        price = beat.price_unlimited || beat.price_basic;
        break;
      case "exclusive":
        price = beat.price_exclusive || beat.price_basic;
        break;
    }
    updateCartItem(itemId, newLicense, price);
  };

  const getAvailableLicenses = (beat: any): LicenseType[] => {
    const available: LicenseType[] = ["basic"];
    if (beat.price_premium) available.push("premium");
    if (beat.price_unlimited) available.push("unlimited");
    if (beat.price_exclusive && !beat.is_exclusive_sold) available.push("exclusive");
    return available;
  };

  const getLicensePrice = (beat: any, licenseType: LicenseType): number => {
    switch (licenseType) {
      case "basic":
        return beat.price_basic;
      case "premium":
        return beat.price_premium || beat.price_basic;
      case "unlimited":
        return beat.price_unlimited || beat.price_basic;
      case "exclusive":
        return beat.price_exclusive || beat.price_basic;
      default:
        return beat.price_basic;
    }
  };

  if (!user) {
    return (
      <>
        <Helmet>
          <title>Cart - Nsimabeats</title>
        </Helmet>
        <div className="min-h-screen bg-background">
          <Navbar />
          <main className="pt-32 pb-24">
            <div className="container text-center">
              <ShoppingCart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h1 className="text-2xl font-bold mb-2">Sign in required</h1>
              <p className="text-muted-foreground mb-6">
                Please sign in to view your cart.
              </p>
              <Link to="/auth">
                <Button variant="gold">Sign In</Button>
              </Link>
            </div>
          </main>
          <Footer />
        </div>
      </>
    );
  }

  if (loading) {
    return (
      <>
        <Helmet>
          <title>Cart - Nsimabeats</title>
        </Helmet>
        <div className="min-h-screen bg-background">
          <Navbar />
          <main className="pt-32 pb-24">
            <div className="container flex justify-center">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          </main>
          <Footer />
        </div>
      </>
    );
  }

  const total = getTotal();

  return (
    <>
      <Helmet>
        <title>Cart - Nsimabeats</title>
      </Helmet>
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-32 pb-24">
          <div className="container max-w-5xl">
            <div className="mb-8">
              <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
                Shopping Cart
              </h1>
              <p className="text-muted-foreground">
                {items.length} {items.length === 1 ? "item" : "items"} in your cart
              </p>
            </div>

            {items.length === 0 ? (
              <div className="text-center py-20">
                <ShoppingCart className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-2">Your cart is empty</h2>
                <p className="text-muted-foreground mb-6">
                  Start adding beats to your cart to get started.
                </p>
                <Link to="/marketplace">
                  <Button variant="gold" className="gap-2">
                    Browse Beats
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Cart Items */}
                <div className="lg:col-span-2 space-y-4">
                  {items.map((item) => {
                    if (!item.beat) return null;
                    const availableLicenses = getAvailableLicenses(item.beat);

                    return (
                      <div
                        key={item.id}
                        className="bg-card border border-border rounded-xl p-6 hover:border-primary/50 transition-colors"
                      >
                        <div className="flex flex-col sm:flex-row gap-4">
                          {/* Cover Image */}
                          <div className="w-full sm:w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
                            <img
                              src={item.beat.cover_url || "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop"}
                              alt={item.beat.title}
                              className="w-full h-full object-cover"
                            />
                          </div>

                          {/* Details */}
                          <div className="flex-1 min-w-0">
                            <h3 className="font-display font-semibold text-lg text-foreground mb-1 truncate">
                              {item.beat.title}
                            </h3>
                            <p className="text-sm text-muted-foreground mb-3">
                              by {item.beat.producer}
                            </p>

                            {/* License Selector */}
                            <div className="mb-4">
                              <label className="text-sm text-muted-foreground mb-2 block">
                                License Type
                              </label>
                              <Select
                                value={item.license_type}
                                onValueChange={(value) =>
                                  handleLicenseChange(item.id, item.beat!, value as LicenseType)
                                }
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  {availableLicenses.map((license) => (
                                    <SelectItem key={license} value={license}>
                                      {licenseLabels[license]} - MK {getLicensePrice(item.beat!, license).toFixed(2)}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            {/* Price */}
                            <div className="flex items-center justify-between">
                              <div>
                                <span className="text-2xl font-display font-bold text-primary">
                                  MK {item.price.toFixed(2)}
                                </span>
                                <span className="text-xs text-muted-foreground ml-1">MWK</span>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => removeFromCart(item.id)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {items.length > 0 && (
                    <Button
                      variant="ghost"
                      onClick={clearCart}
                      className="text-destructive hover:text-destructive"
                    >
                      Clear Cart
                    </Button>
                  )}
                </div>

                {/* Order Summary */}
                <div className="lg:col-span-1">
                  <div className="bg-card border border-border rounded-xl p-6 sticky top-24">
                    <h2 className="font-display font-semibold text-xl mb-6">Order Summary</h2>

                    <div className="space-y-4 mb-6">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Subtotal</span>
                        <span className="font-medium">MK {total.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Processing Fee</span>
                        <span className="font-medium">MK 0.00</span>
                      </div>
                      <div className="border-t border-border pt-4">
                        <div className="flex justify-between">
                          <span className="font-display font-semibold text-lg">Total</span>
                          <span className="font-display font-bold text-xl text-primary">
                            MK {total.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <Button
                      variant="gold"
                      className="w-full gap-2"
                      size="lg"
                      onClick={() => navigate("/checkout")}
                    >
                      Proceed to Checkout
                      <ArrowRight className="w-4 h-4" />
                    </Button>

                    <Link to="/marketplace" className="block mt-4">
                      <Button variant="outline" className="w-full">
                        Continue Shopping
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
};

export default Cart;

