import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, CheckCircle, Share2, Download } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { QRCodeSVG } from "qrcode.react";
import { format } from "date-fns";

const TicketViewPage = () => {
  const { qrCode = "" } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [ticket, setTicket] = useState<any>(null);
  const [event, setEvent] = useState<any>(null);
  const [ticketType, setTicketType] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: ticketData } = await supabase
        .from("tickets")
        .select("*, events(*), ticket_types(name, price)")
        .eq("qr_code", qrCode)
        .single();

      if (ticketData) {
        setTicket(ticketData);
        setEvent(ticketData.events);
        setTicketType(ticketData.ticket_types);
      }
      setLoading(false);
    };
    load();
  }, [qrCode]);

  const shareTicket = () => {
    const text = `🎫 My ticket for ${event?.title}\n📅 ${format(new Date(event?.event_date), "MMM d, yyyy · h:mm a")}\n📍 ${event?.venue}\nTicket: ${ticket?.qr_code}`;
    if (navigator.share) {
      navigator.share({ title: `Ticket: ${event?.title}`, text });
    } else {
      navigator.clipboard.writeText(text);
    }
  };

  if (loading) {
    return <div className="flex justify-center pt-20"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }

  if (!ticket || !event) {
    return (
      <div className="px-5 pt-10 text-center">
        <p className="text-muted-foreground">Ticket not found</p>
        <Button variant="outline" className="mt-3" onClick={() => navigate("/events")}>Browse Events</Button>
      </div>
    );
  }

  const isUsed = ticket.status === "used";

  return (
    <div className="px-5 pt-10 pb-24 space-y-4 max-w-md mx-auto">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)}><ArrowLeft className="h-5 w-5" /></button>
        <h1 className="text-xl font-bold">Your Ticket</h1>
      </div>

      {/* Ticket Card */}
      <Card className="overflow-hidden">
        {/* Top section */}
        <div className="bg-primary text-primary-foreground p-5 space-y-2">
          <h2 className="text-lg font-bold">{event.title}</h2>
          <p className="text-sm opacity-80">{format(new Date(event.event_date), "EEEE, MMMM d, yyyy")}</p>
          <p className="text-sm opacity-80">{format(new Date(event.event_date), "h:mm a")} · {event.venue}</p>
          <Badge variant={isUsed ? "secondary" : "default"} className="mt-1">
            {ticketType?.name}
          </Badge>
        </div>

        {/* Divider */}
        <div className="relative h-4">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-background" />
          <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-8 h-8 rounded-full bg-background" />
          <div className="absolute left-8 right-8 top-1/2 border-t border-dashed border-border" />
        </div>

        {/* QR Code & Details */}
        <CardContent className="p-5 space-y-4">
          <div className="flex justify-center">
            <div className={`p-3 bg-white rounded-xl ${isUsed ? "opacity-40" : ""}`}>
              <QRCodeSVG
                value={ticket.qr_code}
                size={180}
                level="H"
                includeMargin={false}
              />
            </div>
          </div>

          {isUsed && (
            <div className="text-center space-y-1">
              <CheckCircle className="h-8 w-8 text-accent mx-auto" />
              <p className="text-sm font-semibold text-accent">Already Checked In</p>
              <p className="text-xs text-muted-foreground">
                {ticket.checked_in_at && format(new Date(ticket.checked_in_at), "MMM d, h:mm a")}
              </p>
            </div>
          )}

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Attendee</span>
              <span className="font-medium">{ticket.buyer_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Matric No.</span>
              <span className="font-medium">{ticket.buyer_matric}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Amount Paid</span>
              <span className="font-semibold font-mono-num">
                {Number(ticket.amount_paid) === 0 ? "Free" : `₦${Number(ticket.amount_paid).toLocaleString()}`}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Reference</span>
              <span className="font-mono-num text-xs">{ticket.transaction_reference}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status</span>
              <Badge variant={isUsed ? "secondary" : "default"} className="text-xs">
                {ticket.status}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Button variant="outline" className="w-full gap-2" onClick={shareTicket}>
        <Share2 className="h-4 w-4" /> Share Ticket
      </Button>
    </div>
  );
};

export default TicketViewPage;
