import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, Utensils, Bike, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import EmptyState from "@/components/shared/EmptyState";
import KukaPayLoader from "@/components/shared/KukaPayLoader";
import { useUserCampus } from "@/hooks/useUserCampus";
import { fetchServiceMerchants } from "@/lib/serviceMerchants";

interface Merchant {
  id: string;
  business_name: string;
  description: string | null;
  logo_url: string | null;
  delivery_fee: number | null;
  offers_delivery: boolean | null;
  total_transactions: number | null;
}

/**
 * Dedicated food directory — lists food_drinks merchants nearby.
 * Tapping a vendor opens the merchant store, which is the full food menu
 * with product grid + cart + fulfillment (pickup / merchant delivery / runner).
 */
const FoodDirectoryPage = () => {
  const navigate = useNavigate();
  const { campus } = useUserCampus();
  const campusId = campus?.id;
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "delivery">("all");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const rows = await fetchServiceMerchants<Merchant>({
        columns: "id,business_name,description,logo_url,delivery_fee,offers_delivery,total_transactions",
        merchantCategories: ["food_drinks", "food", "drinks", "food_beverage"],
        productCategories: ["food", "drinks"],
        campusId,
      });
      if (!cancelled) {
        setMerchants(rows);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [campusId]);


  const filtered = merchants.filter((m) => {
    if (search && !m.business_name.toLowerCase().includes(search.toLowerCase())) return false;
    if (filter === "delivery" && !m.offers_delivery) return false;
    return true;
  });

  return (
    <div className="px-5 pt-12 pb-28 space-y-5">
      <header className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="press-scale" aria-label="Back">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="min-w-0">
          <h1 className="text-[22px] font-bold leading-tight">Order Food</h1>
          <p className="text-[12px] text-muted-foreground">Meals, snacks & drinks from campus vendors.</p>
        </div>
      </header>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search food vendors…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-11 rounded-2xl"
        />
      </div>

      <div className="flex gap-2">
        <Button
          size="sm"
          variant={filter === "all" ? "default" : "outline"}
          className="rounded-full h-8 text-xs"
          onClick={() => setFilter("all")}
        >
          All vendors
        </Button>
        <Button
          size="sm"
          variant={filter === "delivery" ? "default" : "outline"}
          className="rounded-full h-8 text-xs gap-1"
          onClick={() => setFilter("delivery")}
        >
          <Bike className="h-3 w-3" /> Delivers
        </Button>
      </div>

      {loading ? (
        <KukaPayLoader isLoading />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Utensils}
          title="No food vendors yet"
          description="We're onboarding more restaurants and kitchens on your campus."
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((m) => (
            <Card
              key={m.id}
              className="rounded-2xl border-0 shadow-soft press-scale cursor-pointer"
              onClick={() => navigate(`/merchants/store/${m.id}`)}
            >
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center overflow-hidden shrink-0">
                  {m.logo_url ? (
                    <img src={m.logo_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <Utensils className="h-6 w-6 text-primary" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{m.business_name}</p>
                  <p className="text-[12px] text-muted-foreground truncate">
                    {m.description || "Food & drinks"}
                  </p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {m.offers_delivery && (
                      <Badge variant="secondary" className="text-[10px] gap-1 h-5">
                        <Bike className="h-2.5 w-2.5" /> Delivery
                      </Badge>
                    )}
                    {(m.total_transactions ?? 0) > 0 && (
                      <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                        <Clock className="h-2.5 w-2.5" /> {m.total_transactions} orders
                      </span>
                    )}
                  </div>
                </div>
                <Button size="sm" className="shrink-0" onClick={(e) => { e.stopPropagation(); navigate(`/merchants/store/${m.id}`); }}>
                  Menu
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default FoodDirectoryPage;
