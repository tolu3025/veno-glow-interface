import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, Loader2, Calendar, MapPin, Image } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { friendlyInvoke } from "@/lib/friendlyInvoke";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface TicketType {
  name: string;
  price: number;
  quantity: number;
  description: string;
}

const categories = ["Party", "Concert", "Workshop", "Sports", "Religious", "Academic", "Cultural", "Other"];

const CreateEventPage = () => {
  const navigate = useNavigate();
  const { profile, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [isOrganizer, setIsOrganizer] = useState<boolean | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [venue, setVenue] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [category, setCategory] = useState("Party");
  const [imageUrl, setImageUrl] = useState("");
  const [settlementBank, setSettlementBank] = useState("");
  const [settlementAccount, setSettlementAccount] = useState("");
  const [settlementName, setSettlementName] = useState("");
  const [ticketTypes, setTicketTypes] = useState<TicketType[]>([
    { name: "Regular", price: 0, quantity: 100, description: "" },
  ]);

  const addTicketType = () => {
    setTicketTypes([...ticketTypes, { name: "", price: 0, quantity: 50, description: "" }]);
  };

  const removeTicketType = (idx: number) => {
    if (ticketTypes.length <= 1) return;
    setTicketTypes(ticketTypes.filter((_, i) => i !== idx));
  };

  const updateTicketType = (idx: number, field: keyof TicketType, value: any) => {
    const updated = [...ticketTypes];
    updated[idx] = { ...updated[idx], [field]: value };
    setTicketTypes(updated);
  };

  const handleSubmit = async () => {
    if (!title || !venue || !eventDate) {
      toast.error("Fill in event title, venue, and date");
      return;
    }
    if (ticketTypes.some(t => !t.name || t.quantity < 1)) {
      toast.error("Each ticket type needs a name and quantity");
      return;
    }

    setLoading(true);
    try {
      const data = await friendlyInvoke<any>("manage-events", {
        body: {
          action: "create_event",
          title, description, venue,
          event_date: new Date(eventDate).toISOString(),
          end_date: endDate ? new Date(endDate).toISOString() : null,
          category, image_url: imageUrl || null,
          ticket_types: ticketTypes,
          settlement_bank_name: settlementBank || null,
          settlement_account_number: settlementAccount || null,
          settlement_account_name: settlementName || null,
        },
      }, "Failed to create event");
      toast.success("Event created!");
      navigate(`/events/${data.event_id}`);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const checkRole = async () => {
      if (!user) return;
      const { data } = await supabase
        .from("user_roles")
        .select("id")
        .eq("user_id", user.id)
        .eq("role", "organizer")
        .maybeSingle();
      setIsOrganizer(!!data);
    };
    checkRole();
  }, [user]);

  if (isOrganizer === false) {
    return (
      <div className="px-5 pt-10 pb-24 max-w-md mx-auto">
        <Card>
          <CardContent className="p-6 text-center space-y-3">
            <p className="font-semibold">Organizer Access Required</p>
            <p className="text-sm text-muted-foreground">Only approved organizers can create events. Contact an admin to get organizer access.</p>
            <Button onClick={() => navigate("/events")}>Back to Events</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="px-5 pt-10 pb-24 space-y-4 max-w-md mx-auto">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)}><ArrowLeft className="h-5 w-5" /></button>
        <h1 className="text-xl font-bold">Create Event</h1>
      </div>

      {/* Event Details */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Event Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input placeholder="Event title" value={title} onChange={e => setTitle(e.target.value)} maxLength={100} />
          <Textarea placeholder="Description (optional)" value={description} onChange={e => setDescription(e.target.value)} maxLength={500} />
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
            <Input placeholder="Venue / Location" value={venue} onChange={e => setVenue(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-muted-foreground">Start Date & Time</label>
              <Input type="datetime-local" value={eventDate} onChange={e => setEventDate(e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-muted-foreground">End (optional)</label>
              <Input type="datetime-local" value={endDate} onChange={e => setEndDate(e.target.value)} />
            </div>
          </div>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger><SelectValue placeholder="Category" /></SelectTrigger>
            <SelectContent>
              {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground flex items-center gap-1">
              <Image className="h-3.5 w-3.5" /> Event Image (optional)
            </label>
            <Input
              type="file"
              accept="image/*"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                if (file.size > 5 * 1024 * 1024) { toast.error("Image must be under 5MB"); return; }
                const ext = file.name.split(".").pop() || "jpg";
                const path = `${user?.id}/${Date.now()}.${ext}`;
                const { error: uploadError } = await supabase.storage.from("event-images").upload(path, file);
                if (uploadError) { toast.error("Upload failed"); return; }
                const { data: urlData } = supabase.storage.from("event-images").getPublicUrl(path);
                setImageUrl(urlData.publicUrl);
                toast.success("Image uploaded!");
              }}
            />
            {imageUrl && (
              <img src={imageUrl} alt="Preview" className="w-full h-32 object-cover rounded-lg" />
            )}
          </div>
        </CardContent>
      </Card>

      {/* Ticket Types */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm">Ticket Types</CardTitle>
            <Button variant="ghost" size="sm" onClick={addTicketType} className="text-xs gap-1">
              <Plus className="h-3 w-3" /> Add
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {ticketTypes.map((tt, idx) => (
            <div key={idx} className="space-y-2 p-3 bg-muted rounded-lg relative">
              {ticketTypes.length > 1 && (
                <button
                  onClick={() => removeTicketType(idx)}
                  className="absolute top-2 right-2 text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
              <Input
                placeholder="e.g. Regular, VIP, VVIP"
                value={tt.name}
                onChange={e => updateTicketType(idx, "name", e.target.value)}
              />
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-muted-foreground">Price (₦)</label>
                  <Input
                    type="number"
                    min="0"
                    value={tt.price}
                    onChange={e => updateTicketType(idx, "price", Number(e.target.value))}
                    className="font-mono-num"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Quantity</label>
                  <Input
                    type="number"
                    min="1"
                    value={tt.quantity}
                    onChange={e => updateTicketType(idx, "quantity", Number(e.target.value))}
                  />
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Settlement Details */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Settlement Account (Optional)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">Revenue settles to your wallet by default. Add bank details for automatic bank settlement.</p>
          <Input placeholder="Bank name" value={settlementBank} onChange={e => setSettlementBank(e.target.value)} />
          <Input placeholder="Account number" value={settlementAccount} onChange={e => setSettlementAccount(e.target.value)} maxLength={10} className="font-mono-num" />
          <Input placeholder="Account name" value={settlementName} onChange={e => setSettlementName(e.target.value)} />
        </CardContent>
      </Card>

      <Button className="w-full" onClick={handleSubmit} disabled={loading}>
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Event"}
      </Button>
    </div>
  );
};

export default CreateEventPage;
