import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Shirt, Search } from "lucide-react";
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
  offers_delivery: boolean | null;
}

const LaundryDirectoryPage = () => {
  const navigate = useNavigate();
  const { campus } = useUserCampus();
  const campusId = campus?.id;
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const rows = await fetchServiceMerchants<Merchant>({
        columns: "id,business_name,description,logo_url,offers_delivery",
        merchantCategories: ["laundry", "laundry_service"],
        productCategories: ["laundry"],
        campusId,
      });
      if (!cancelled) {
        setMerchants(rows);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [campusId]);


  const filtered = merchants.filter((m) =>
    !search || m.business_name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="px-5 pt-12 pb-28 space-y-5">
      <header className="flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="press-scale">
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-[22px] font-bold leading-tight">Laundry</h1>
          <p className="text-[12px] text-muted-foreground">Wash, iron, dry-clean.</p>
        </div>
      </header>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search laundry services…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 h-11 rounded-2xl"
        />
      </div>

      {loading ? (
        <KukaPayLoader isLoading />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Shirt}
          title="No laundry vendors yet"
          description="We're onboarding laundry merchants in your campus."
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((m) => (
            <Card key={m.id} className="rounded-2xl border-0 shadow-soft press-scale">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center overflow-hidden">
                  {m.logo_url ? (
                    <img src={m.logo_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <Shirt className="h-5 w-5 text-primary" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{m.business_name}</p>
                  <p className="text-[12px] text-muted-foreground truncate">
                    {m.description || "Laundry service"}
                  </p>
                </div>
                {m.offers_delivery && <Badge variant="secondary">Pickup</Badge>}
                <Button size="sm" onClick={() => navigate(`/services/laundry/${m.id}`)}>
                  Order
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default LaundryDirectoryPage;
