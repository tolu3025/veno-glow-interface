import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Calendar, MapPin, Plus, Loader2, Ticket } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";

const EventsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [isOrganizer, setIsOrganizer] = useState(false);

  useEffect(() => {
    const load = async () => {
      const [eventsRes, roleRes] = await Promise.all([
        supabase
          .from("events")
          .select("*, ticket_types(id, name, price, quantity, sold)")
          .eq("status", "active")
          .gte("event_date", new Date().toISOString())
          .order("event_date", { ascending: true }),
        user ? supabase
          .from("user_roles")
          .select("id")
          .eq("user_id", user.id)
          .eq("role", "organizer")
          .maybeSingle() : Promise.resolve({ data: null }),
      ]);
      setEvents(eventsRes.data || []);
      setIsOrganizer(!!roleRes.data);
      setLoading(false);
    };
    load();
  }, [user]);

  const filtered = events.filter(e =>
    e.title.toLowerCase().includes(search.toLowerCase()) ||
    e.venue.toLowerCase().includes(search.toLowerCase()) ||
    e.category.toLowerCase().includes(search.toLowerCase())
  );

  const getMinPrice = (event: any) => {
    const types = event.ticket_types || [];
    if (types.length === 0) return 0;
    return Math.min(...types.map((t: any) => Number(t.price)));
  };

  const getTotalAvailable = (event: any) => {
    const types = event.ticket_types || [];
    return types.reduce((s: number, t: any) => s + (t.quantity - t.sold), 0);
  };

  return (
    <div className="px-5 pt-10 pb-24 space-y-4 max-w-md mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Events</h1>
          <p className="text-sm text-muted-foreground">Discover events on campus</p>
        </div>
        {isOrganizer && (
          <Button size="sm" onClick={() => navigate("/events/new")} className="gap-1">
            <Plus className="h-3.5 w-3.5" /> Create
          </Button>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search events..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center space-y-2">
            <Ticket className="h-10 w-10 text-muted-foreground mx-auto" />
            <p className="font-semibold">No upcoming events</p>
            <p className="text-sm text-muted-foreground">{isOrganizer ? "Be the first to create an event!" : "Check back later for upcoming events."}</p>
            {isOrganizer && <Button variant="outline" onClick={() => navigate("/events/new")}>Create Event</Button>}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map(event => (
            <Card
              key={event.id}
              className="cursor-pointer hover:shadow-md transition-shadow overflow-hidden"
              onClick={() => navigate(`/events/${event.id}`)}
            >
              {event.image_url && (
                <div className="h-36 bg-muted">
                  <img src={event.image_url} alt={event.title} className="w-full h-full object-cover" />
                </div>
              )}
              <CardContent className={`${event.image_url ? "p-4" : "p-4"} space-y-2`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-semibold truncate">{event.title}</h3>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                      <Calendar className="h-3 w-3 shrink-0" />
                      {format(new Date(event.event_date), "MMM d, yyyy · h:mm a")}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3 shrink-0" />
                      {event.venue}
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-xs shrink-0">{event.category}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold font-mono-num text-primary">
                    {getMinPrice(event) === 0 ? "Free" : `From ₦${getMinPrice(event).toLocaleString()}`}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {getTotalAvailable(event)} tickets left
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default EventsPage;
