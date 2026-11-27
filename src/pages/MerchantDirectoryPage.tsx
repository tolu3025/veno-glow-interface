import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Search, Store, Star, ShoppingBag, Truck, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { friendlyInvoke } from "@/lib/friendlyInvoke";
import EmptyState from "@/components/shared/EmptyState";
import CampusBadge from "@/components/shared/CampusBadge";
import { useAuth } from "@/contexts/AuthContext";
import { useUserCampus } from "@/hooks/useUserCampus";
import { MERCHANT_PORTAL_URL } from "@/components/shared/ExternalMerchantRedirect";

const categoryIcons: Record<string, string> = {
  "food_drinks": "🍔", "printing_stationery": "🖨️", "fashion_accessories": "👕",
  "laundry": "🧺", "barbing_beauty": "💇", "electronics_repairs": "🔧",
  "health_pharmacy": "💊", "transport": "🚗", "other": "📦",
};

const categoryLabels: Record<string, string> = {
  "food_drinks": "Food & Drinks", "printing_stationery": "Printing", "fashion_accessories": "Fashion",
  "laundry": "Laundry", "barbing_beauty": "Beauty", "electronics_repairs": "Electronics",
  "health_pharmacy": "Health", "transport": "Transport", "other": "Other",
};

// Aliases so ?category=food or ?category=printing works from Services grid.
const CATEGORY_ALIASES: Record<string, string> = {
  food: "food_drinks",
  drinks: "food_drinks",
  printing: "printing_stationery",
  stationery: "printing_stationery",
  fashion: "fashion_accessories",
  beauty: "barbing_beauty",
  electronics: "electronics_repairs",
  health: "health_pharmacy",
};

const normalizeCategory = (raw: string | null) => {
  if (!raw) return "all";
  const key = raw.toLowerCase();
  return CATEGORY_ALIASES[key] ?? key;
};

// For categories that have a dedicated flow, send the student there instead of the generic store.
const categoryStorePath = (category: string, merchantId: string, deliveryMode: boolean) => {
  if (category === "printing_stationery") return `/services/printing/${merchantId}`;
  if (category === "laundry") return `/services/laundry/${merchantId}`;
  return `/merchants/store/${merchantId}${deliveryMode ? "?mode=delivery" : ""}`;
};

const MerchantDirectoryPage = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { campus } = useUserCampus();
  const [searchParams, setSearchParams] = useSearchParams();
  const isDeliveryMode = searchParams.get("mode") === "delivery";
  const [merchants, setMerchants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState(() => normalizeCategory(searchParams.get("category")));
  const [isMerchant, setIsMerchant] = useState(false);
  const [merchantLoading, setMerchantLoading] = useState(true);

  // Sync category state when the URL changes (e.g. deep-link from Services grid).
  useEffect(() => {
    setCategory(normalizeCategory(searchParams.get("category")));
  }, [searchParams]);

  useEffect(() => {
    loadMerchants();
  }, [search, category]);


  useEffect(() => {
    checkMerchantStatus();
  }, []);

  const checkMerchantStatus = async () => {
    try {
      const data = await friendlyInvoke<{ merchant?: any }>("manage-merchant", {
        body: { action: "get_my_merchant" },
      });
      setIsMerchant(!!data?.merchant);
    } catch {
      // Not a merchant
    } finally {
      setMerchantLoading(false);
    }
  };

  const loadMerchants = async () => {
    setLoading(true);
    try {
      const data = await friendlyInvoke<{ merchants?: any[] }>("manage-merchant", {
        body: { action: "get_directory", search, category },
      }, "Couldn't load merchants. Please try again.");
      setMerchants(data?.merchants || []);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  const allCategories = ["all", ...Object.keys(categoryLabels)];

  return (
    <div className="px-5 pt-10 pb-4 space-y-5">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">{isDeliveryMode ? "Order & Deliver" : "Campus Merchants"}</h1>
        {!isDeliveryMode && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => window.open(MERCHANT_PORTAL_URL, "_blank", "noopener,noreferrer")}
            className="gap-1 text-xs"
          >
            <Store className="h-3.5 w-3.5" /> Become One <ExternalLink className="h-3 w-3" />
          </Button>
        )}
      </div>
      {isDeliveryMode && (
        <div className="bg-primary/10 rounded-lg p-3 flex items-center gap-2 text-xs text-primary">
          <Truck className="h-4 w-4 shrink-0" />
          <span>Select a store, add items to cart, and toggle "Deliver to me" at checkout.</span>
        </div>
      )}

      <CampusBadge variant="banner" />

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search merchants..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 no-scrollbar">
        {allCategories.map(c => (
          <Button
            key={c}
            size="sm"
            variant={category === c ? "default" : "outline"}
            className="text-xs whitespace-nowrap h-8"
            onClick={() => {
              setCategory(c);
              const next = new URLSearchParams(searchParams);
              if (c === "all") next.delete("category"); else next.set("category", c);
              setSearchParams(next, { replace: true });
            }}
          >
            {c === "all" ? "All" : `${categoryIcons[c] || ""} ${categoryLabels[c] || c}`}
          </Button>
        ))}

      </div>

      {/* Merchant List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <Card key={i}><CardContent className="p-4 h-20 animate-pulse bg-muted/50" /></Card>
          ))}
        </div>
      ) : merchants.length === 0 ? (
        campus && !search && category === "all" ? (
          <EmptyState
            icon={Store}
            title={`Not live at ${campus.name} yet`}
            description="No vendors have signed up on your campus. Want to be the first? Tap Become One above to apply on our merchant portal."
          />
        ) : (
          <EmptyState icon={ShoppingBag} title="No merchants found" description="Try a different search or category." />
        )
      ) : (
        <div className="space-y-3">
          {merchants.map((m: any) => {
            const target = categoryStorePath(m.category, m.id, isDeliveryMode);
            const isSpecial = m.category === "printing_stationery" || m.category === "laundry";
            return (
              <Card key={m.id} className="hover:bg-muted/30 transition-colors">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-xl cursor-pointer" onClick={() => navigate(target)}>
                    {categoryIcons[m.category] || "🏪"}
                  </div>
                  <div className="flex-1 min-w-0 cursor-pointer" onClick={() => navigate(target)}>
                    <p className="font-medium truncate">{m.business_name}</p>
                    {m.description && <p className="text-xs text-muted-foreground truncate">{m.description}</p>}
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-[9px] h-4">{categoryLabels[m.category] || m.category}</Badge>
                      {m.total_transactions > 0 && (
                        <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                          <Star className="h-2.5 w-2.5 fill-current text-yellow-500" /> {m.total_transactions} sales
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <Button size="sm" variant="default" className="text-xs h-7" onClick={() => navigate(target)}>
                      <Store className="h-3 w-3 mr-1" />
                      {isSpecial ? "Open" : isDeliveryMode ? "Order" : "Store"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}

        </div>
      )}
    </div>
  );
};

export default MerchantDirectoryPage;
