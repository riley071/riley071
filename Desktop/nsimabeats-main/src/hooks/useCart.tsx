import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "@/hooks/use-toast";

export type LicenseType = "basic" | "premium" | "unlimited" | "exclusive";

export interface CartItem {
  id: string;
  beat_id: string;
  license_type: LicenseType;
  price: number;
  beat?: {
    id: string;
    title: string;
    producer: string;
    cover_url: string | null;
    genre: string;
    bpm: number;
    price_basic: number;
    price_premium: number | null;
    price_unlimited: number | null;
    price_exclusive: number | null;
  };
}

interface CartContextType {
  items: CartItem[];
  loading: boolean;
  addToCart: (beatId: string, licenseType: LicenseType, price: number) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  updateCartItem: (itemId: string, licenseType: LicenseType, price: number) => Promise<void>;
  clearCart: () => Promise<void>;
  getTotal: () => number;
  getItemCount: () => number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchCart();
    } else {
      setItems([]);
      setLoading(false);
    }
  }, [user]);

  const fetchCart = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("cart_items")
        .select(`
          *,
          beats (
            id,
            title,
            genre,
            bpm,
            price_basic,
            price_premium,
            price_unlimited,
            price_exclusive,
            cover_url,
            profiles!beats_producer_id_fkey (full_name)
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const formattedItems: CartItem[] = (data || []).map((item: any) => ({
        id: item.id,
        beat_id: item.beat_id,
        license_type: item.license_type,
        price: Number(item.price),
        beat: item.beats ? {
          id: item.beats.id,
          title: item.beats.title,
          producer: item.beats.profiles?.full_name || "Unknown Producer",
          cover_url: item.beats.cover_url,
          genre: item.beats.genre,
          bpm: item.beats.bpm,
          price_basic: Number(item.beats.price_basic),
          price_premium: item.beats.price_premium ? Number(item.beats.price_premium) : null,
          price_unlimited: item.beats.price_unlimited ? Number(item.beats.price_unlimited) : null,
          price_exclusive: item.beats.price_exclusive ? Number(item.beats.price_exclusive) : null,
        } : undefined,
      }));

      setItems(formattedItems);
    } catch (error: any) {
      console.error("Error fetching cart:", error);
      toast({
        title: "Error",
        description: "Failed to load cart items.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (beatId: string, licenseType: LicenseType, price: number) => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to add items to your cart.",
        variant: "destructive",
      });
      return;
    }

    try {
      // First, check if item already exists in cart
      const { data: existing, error: checkError } = await supabase
        .from("cart_items")
        .select("id, price")
        .eq("user_id", user.id)
        .eq("beat_id", beatId)
        .eq("license_type", licenseType)
        .maybeSingle();

      if (checkError && checkError.code !== "PGRST116") {
        throw checkError;
      }

      if (existing) {
        // Item exists, update price if it changed
        if (Number(existing.price) !== price) {
          const { error: updateError } = await supabase
            .from("cart_items")
            .update({ price: price })
            .eq("id", existing.id);

          if (updateError) throw updateError;
        }

        toast({
          title: "Already in cart",
          description: "This item is already in your cart.",
        });
      } else {
        // Item doesn't exist, insert it
        const { error: insertError } = await supabase
          .from("cart_items")
          .insert({
            user_id: user.id,
            beat_id: beatId,
            license_type: licenseType,
            price: price,
          });

        if (insertError) {
          // If it's a unique constraint violation, the item was added between check and insert
          if (insertError.code === "23505" || insertError.message?.includes("duplicate") || insertError.message?.includes("unique")) {
            toast({
              title: "Already in cart",
              description: "This item is already in your cart.",
            });
          } else {
            throw insertError;
          }
        } else {
          toast({
            title: "Added to cart",
            description: "Item has been added to your cart.",
          });
        }
      }

      await fetchCart();
    } catch (error: any) {
      console.error("Error adding to cart:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to add item to cart. Please try again.",
        variant: "destructive",
      });
    }
  };

  const removeFromCart = async (itemId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("cart_items")
        .delete()
        .eq("id", itemId)
        .eq("user_id", user.id);

      if (error) throw error;

      toast({
        title: "Removed from cart",
        description: "Item has been removed from your cart.",
      });

      await fetchCart();
    } catch (error: any) {
      console.error("Error removing from cart:", error);
      toast({
        title: "Error",
        description: "Failed to remove item from cart.",
        variant: "destructive",
      });
    }
  };

  const updateCartItem = async (itemId: string, licenseType: LicenseType, price: number) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("cart_items")
        .update({
          license_type: licenseType,
          price: price,
        })
        .eq("id", itemId)
        .eq("user_id", user.id);

      if (error) throw error;

      await fetchCart();
    } catch (error: any) {
      console.error("Error updating cart item:", error);
      toast({
        title: "Error",
        description: "Failed to update cart item.",
        variant: "destructive",
      });
    }
  };

  const clearCart = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("cart_items")
        .delete()
        .eq("user_id", user.id);

      if (error) throw error;

      await fetchCart();
    } catch (error: any) {
      console.error("Error clearing cart:", error);
      toast({
        title: "Error",
        description: "Failed to clear cart.",
        variant: "destructive",
      });
    }
  };

  const getTotal = () => {
    return items.reduce((sum, item) => sum + item.price, 0);
  };

  const getItemCount = () => {
    return items.length;
  };

  return (
    <CartContext.Provider
      value={{
        items,
        loading,
        addToCart,
        removeFromCart,
        updateCartItem,
        clearCart,
        getTotal,
        getItemCount,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};

