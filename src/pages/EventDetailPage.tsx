import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Calendar, MapPin, Ticket, Loader2, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { friendlyInvoke } from "@/lib/friendlyInvoke";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { format } from "date-fns";

const EventDetailPage = () => {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [event, setEvent] = useState<any>(null);
  const [ticketTypes, setTicketTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState<any>(null);
  const [pinDialogOpen, setPinDialogOpen] = useState(false);
  const [pin, setPin] = useState("");
  const [purchasing, setPurchasing] = useState(false);
  const [myTickets, setMyTickets] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      const [eventRes, typesRes, ticketsRes] = await Promise.all([
        supabase.from("events").select("*").eq("id", id).single(),
        supabase.from("ticket_types").select("*").eq("event_id", id),
        user ? supabase.from("tickets").select("*").eq("event_id", id).eq("buyer_id", user.id) : Promise.resolve({ data: [] }),
      ]);
      if (eventRes.data) setEvent(eventRes.data);
      if (typesRes.data) setTicketTypes(typesRes.data);
      if (ticketsRes.data) setMyTickets(ticketsRes.data as any[]);
      setLoading(false);
    };
    load();
  }, [id, user]);

  const handlePurchase = (type: any) => {
    if (!profile?.has_transaction_pin) {
      toast.error("Set up your transaction PIN first");
      navigate("/profile");
      return;
    }
    setSelectedType(type);
    setPin("");
    setPinDialogOpen(true);
  };

  const confirmPurchase = async () => {
    if (pin.length !== 4 || !selectedType) return;
    setPurchasing(true);
    try {
      const data = await friendlyInvoke<any>("manage-events", {
        body: {
          action: "purchase_ticket",
          event_id: id,
          ticket_type_id: selectedType.id,
          pin,
        },
      }, "Ticket purchase failed. Please try again.");
      toast.success("Ticket purchased! 🎫");
      setPinDialogOpen(false);
      navigate(`/tickets/${data.qr_code}`);
    } catch (e: any) {
      toast.error(e.message);
      setPin("");
    } finally {
      setPurchasing(false);
    }
  };

  const handlePinKey = (key: string) => {
    if (key === "⌫") setPin(pin.slice(0, -1));
    else if (pin.length < 4) setPin(pin + key);
  };

  const isOrganizer = event?.organizer_id === user?.id;
  const hasTicket = (typeId: string) => myTickets.some(t => t.ticket_type_id === typeId && t.status === "valid");

  if (loading) {
    return (
      <div className="flex justify-center pt-20"><Loader2 className="h-6 w-6 animate-spin" /></div>
    );
  }

  if (!event) {
    return (
      <div className="px-5 pt-10 text-center">
        <p className="text-muted-foreground">Event not found</p>
        <Button variant="outline" className="mt-3" onClick={() => navigate("/events")}>Browse Events</Button>
      </div>
    );
  }

  return (
    <div className="pb-24 max-w-md mx-auto">
      {/* Header Image */}
      {event.image_url && (
        <div className="h-48 bg-muted relative">
          <img src={event.image_url} alt={event.title} className="w-full h-full object-cover" />
          <button
            onClick={() => navigate(-1)}
            className="absolute top-4 left-4 h-8 w-8 rounded-full bg-background/80 backdrop-blur flex items-center justify-center"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="px-5 pt-5 space-y-4">
        {!event.image_url && (
          <button onClick={() => navigate(-1)} className="flex items-center gap-2">
            <ArrowLeft className="h-5 w-5" />
            <span className="text-sm">Back</span>
          </button>
        )}

        {/* Event Info */}
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-2">
            <h1 className="text-xl font-bold">{event.title}</h1>
            <Badge variant="secondary">{event.category}</Badge>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4 shrink-0" />
              {format(new Date(event.event_date), "EEEE, MMMM d, yyyy · h:mm a")}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 shrink-0" />
              {event.venue}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4 shrink-0" />
              {event.total_tickets_sold} attending
            </div>
          </div>
          {event.description && (
            <p className="text-sm text-muted-foreground leading-relaxed">{event.description}</p>
          )}
        </div>

        {/* Organizer Actions */}
        {isOrganizer && (
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => navigate(`/events/${id}/dashboard`)}>
              Organizer Dashboard
            </Button>
            <Button variant="outline" className="flex-1" onClick={() => navigate(`/events/${id}/scan`)}>
              Scan Tickets
            </Button>
          </div>
        )}

        {/* My Tickets */}
        {myTickets.length > 0 && (
          <Card className="border-accent/20 bg-accent/5">
            <CardContent className="p-4 space-y-2">
              <p className="text-sm font-semibold text-accent flex items-center gap-1.5">
                <Ticket className="h-4 w-4" /> Your Tickets
              </p>
              {myTickets.filter(t => t.status === "valid").map(t => (
                <Button
                  key={t.id}
                  variant="outline"
                  className="w-full justify-start gap-2"
                  onClick={() => navigate(`/tickets/${t.qr_code}`)}
                >
                  <Ticket className="h-3.5 w-3.5" />
                  View Ticket
                </Button>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Ticket Types */}
        <div className="space-y-2">
          <h2 className="font-semibold text-sm">Tickets</h2>
          {ticketTypes.map(type => {
            const available = type.quantity - type.sold;
            const soldOut = available <= 0;
            const owned = hasTicket(type.id);
            return (
              <Card key={type.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{type.name}</p>
                      {type.description && (
                        <p className="text-xs text-muted-foreground">{type.description}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">{available} of {type.quantity} left</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold font-mono-num text-primary">
                        {type.price === 0 ? "Free" : `₦${Number(type.price).toLocaleString()}`}
                      </p>
                      {owned ? (
                        <Badge variant="default" className="text-xs mt-1">Purchased</Badge>
                      ) : soldOut ? (
                        <Badge variant="destructive" className="text-xs mt-1">Sold Out</Badge>
                      ) : !isOrganizer ? (
                        <Button size="sm" className="mt-1" onClick={() => handlePurchase(type)}>
                          Buy
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* PIN Dialog */}
      <Dialog open={pinDialogOpen} onOpenChange={setPinDialogOpen}>
        <DialogContent className="max-w-xs">
          <DialogHeader>
            <DialogTitle className="text-center text-sm">
              Confirm Purchase: {selectedType?.name}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-center font-mono-num text-xl font-bold text-primary">
              {selectedType?.price === 0 ? "Free" : `₦${Number(selectedType?.price || 0).toLocaleString()}`}
            </p>
            <div className="flex gap-3 justify-center">
              {[0, 1, 2, 3].map(i => (
                <div
                  key={i}
                  className={`h-12 w-12 rounded-xl border-2 flex items-center justify-center text-xl font-bold transition-all ${
                    i < pin.length ? "border-primary bg-primary/10" : "border-border"
                  }`}
                >
                  {i < pin.length ? "•" : ""}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-2 max-w-[200px] mx-auto">
              {["1","2","3","4","5","6","7","8","9","","0","⌫"].map(key =>
                key === "" ? <div key="empty" /> : (
                  <button
                    key={key}
                    type="button"
                    onClick={() => handlePinKey(key)}
                    className="h-11 rounded-lg bg-muted hover:bg-muted/80 flex items-center justify-center text-sm font-semibold transition-colors active:scale-95"
                  >
                    {key}
                  </button>
                )
              )}
            </div>
            <Button
              className="w-full"
              onClick={confirmPurchase}
              disabled={purchasing || pin.length !== 4}
            >
              {purchasing ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm Purchase"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EventDetailPage;
