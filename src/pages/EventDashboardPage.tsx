import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, Users, CreditCard, CheckCircle, Ticket, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { friendlyInvoke } from "@/lib/friendlyInvoke";
import { format } from "date-fns";

const EventDashboardPage = () => {
  const { id: eventId } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await friendlyInvoke<any>("manage-events", {
          body: { action: "get_organizer_stats", event_id: eventId },
        }, "Couldn't load dashboard. Please try again.");
        if (res?.success) setData(res);
      } catch {
        // Silent — UI handles null data state
      }
      setLoading(false);
    };
    load();
  }, [eventId]);

  if (loading) {
    return <div className="flex justify-center pt-20"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }

  if (!data) {
    return (
      <div className="px-5 pt-10 text-center">
        <p className="text-muted-foreground">Could not load dashboard</p>
        <Button variant="outline" className="mt-3" onClick={() => navigate(-1)}>Go Back</Button>
      </div>
    );
  }

  const { event, ticketTypes, tickets, stats } = data;

  return (
    <div className="px-5 pt-10 pb-24 space-y-4 max-w-lg mx-auto">
      <div className="flex items-center gap-3">
        <button onClick={() => navigate(-1)}><ArrowLeft className="h-5 w-5" /></button>
        <div>
          <h1 className="text-lg font-bold">{event.title}</h1>
          <p className="text-xs text-muted-foreground">Organizer Dashboard</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <Ticket className="h-5 w-5 text-primary mx-auto mb-1" />
            <p className="text-2xl font-bold font-mono-num">{stats.totalSold}</p>
            <p className="text-xs text-muted-foreground">Tickets Sold</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <TrendingUp className="h-5 w-5 text-accent mx-auto mb-1" />
            <p className="text-2xl font-bold font-mono-num text-accent">
              ₦{Number(stats.totalRevenue).toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground">Total Revenue</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <CheckCircle className="h-5 w-5 text-accent mx-auto mb-1" />
            <p className="text-2xl font-bold font-mono-num">{stats.totalCheckedIn}</p>
            <p className="text-xs text-muted-foreground">Checked In</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <Users className="h-5 w-5 text-primary mx-auto mb-1" />
            <p className="text-2xl font-bold font-mono-num">{stats.checkInRate}%</p>
            <p className="text-xs text-muted-foreground">Check-in Rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Scan button */}
      <Button className="w-full gap-2" onClick={() => navigate(`/events/${eventId}/scan`)}>
        <CheckCircle className="h-4 w-4" /> Scan Tickets
      </Button>

      <Tabs defaultValue="sales">
        <TabsList className="w-full">
          <TabsTrigger value="sales" className="flex-1">Sales</TabsTrigger>
          <TabsTrigger value="attendees" className="flex-1">Attendees</TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="space-y-3">
          {/* Ticket Type Breakdown */}
          {ticketTypes.map((tt: any) => (
            <Card key={tt.id}>
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold">{tt.name}</p>
                    <p className="text-xs text-muted-foreground">{tt.sold} / {tt.quantity} sold</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono-num font-semibold text-primary">
                      ₦{(Number(tt.price) * tt.sold).toLocaleString()}
                    </p>
                    <p className="text-xs text-muted-foreground font-mono-num">
                      ₦{Number(tt.price).toLocaleString()} each
                    </p>
                  </div>
                </div>
                {/* Progress bar */}
                <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${tt.quantity > 0 ? (tt.sold / tt.quantity) * 100 : 0}%` }}
                  />
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Settlement Info */}
          <Card>
            <CardContent className="p-4 space-y-2">
              <p className="text-sm font-semibold">Settlement</p>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Status</span>
                <Badge variant={event.settlement_status === "settled" ? "default" : "secondary"} className="text-xs">
                  {event.settlement_status}
                </Badge>
              </div>
              {event.settlement_account_number && (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Bank</span>
                    <span>{event.settlement_bank_name}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Account</span>
                    <span className="font-mono-num">{event.settlement_account_number}</span>
                  </div>
                </>
              )}
              <p className="text-xs text-muted-foreground">
                Revenue settles to your wallet. Bank settlement available upon request.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="attendees" className="space-y-2">
          {tickets.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center text-sm text-muted-foreground">
                No tickets sold yet
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  {tickets.map((t: any) => (
                    <div key={t.id} className="flex items-center justify-between p-3">
                      <div>
                        <p className="text-sm font-medium">{t.buyer_name}</p>
                        <p className="text-xs text-muted-foreground">{t.buyer_matric}</p>
                      </div>
                      <div className="text-right">
                        <Badge
                          variant={t.status === "used" ? "default" : t.status === "valid" ? "secondary" : "destructive"}
                          className="text-xs"
                        >
                          {t.status === "used" ? "Checked In" : t.status}
                        </Badge>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {format(new Date(t.created_at), "MMM d, h:mm a")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EventDashboardPage;
