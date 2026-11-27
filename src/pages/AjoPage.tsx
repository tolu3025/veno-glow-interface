import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Users, Search, Shield, Clock, TrendingUp, TrendingDown, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import EmptyState from "@/components/shared/EmptyState";

const frequencyLabel: Record<string, string> = { daily: "Daily", weekly: "Weekly", monthly: "Monthly" };
const orderLabel: Record<string, string> = { random_ballot: "Random Ballot", admin_assigned: "Admin Assigned", first_come: "First Come" };

const MONITOR_EMAIL = "toluwanimioyetade@gmail.com";

const AjoPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tab, setTab] = useState("discover");
  const [publicGroups, setPublicGroups] = useState<any[]>([]);
  const [myGroups, setMyGroups] = useState<any[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [freqFilter, setFreqFilter] = useState("all");

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // Load public groups
      const { data: pub } = await supabase
        .from("ajo_groups")
        .select("*")
        .eq("is_public", true)
        .eq("status", "recruiting")
        .order("created_at", { ascending: false });

      setPublicGroups(pub || []);

      // Load my groups via edge function — get member groups
      const { data: myMembers } = await supabase
        .from("ajo_members")
        .select("group_id, position, total_contributed, total_collected, ajo_groups(*)")
        .eq("user_id", user.id)
        .eq("status", "active");

      const active: any[] = [];
      const completed: any[] = [];

      (myMembers || []).forEach((m: any) => {
        const g = m.ajo_groups;
        if (!g) return;
        const entry = { ...g, my_position: m.position, total_contributed: m.total_contributed, total_collected: m.total_collected };
        if (g.status === "completed") completed.push(entry);
        else active.push(entry);
      });

      setMyGroups(active);
      setHistory(completed);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredPublic = publicGroups.filter((g) => {
    if (search && !g.title.toLowerCase().includes(search.toLowerCase())) return false;
    if (freqFilter !== "all" && g.frequency !== freqFilter) return false;
    return true;
  });

  const getNextDueDate = (group: any) => {
    if (group.status !== "active" || !group.start_date) return null;
    const start = new Date(group.start_date);
    const cycle = group.current_cycle;
    if (group.frequency === "daily") start.setDate(start.getDate() + cycle);
    else if (group.frequency === "weekly") start.setDate(start.getDate() + cycle * 7);
    else start.setMonth(start.getMonth() + cycle);
    return start;
  };

  const getCountdown = (date: Date | null) => {
    if (!date) return "";
    const diff = date.getTime() - Date.now();
    if (diff <= 0) return "Due now";
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    if (days > 0) return `${days}d ${hours}h`;
    return `${hours}h`;
  };

  return (
    <div className="px-5 pt-10 pb-4 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Ajo Savings</h1>
          <p className="text-xs text-muted-foreground">Rotating savings circles</p>
        </div>
        {(user?.email || "").toLowerCase() === MONITOR_EMAIL && (
          <Button size="sm" onClick={() => navigate("/ajo/new")} className="gap-1">
            <Plus className="h-4 w-4" /> Create
          </Button>
        )}
      </div>

      <Tabs value={tab} onValueChange={setTab} className="w-full">
        <TabsList className="w-full grid grid-cols-3">
          <TabsTrigger value="discover">Discover</TabsTrigger>
          <TabsTrigger value="my-ajos">My Ajos</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        {/* DISCOVER TAB */}
        <TabsContent value="discover" className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search groups..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 h-9" />
            </div>
            <Select value={freqFilter} onValueChange={setFreqFilter}>
              <SelectTrigger className="w-28 h-9">
                <Filter className="h-3.5 w-3.5 mr-1" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="daily">Daily</SelectItem>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="flex justify-center py-10">
              <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            </div>
          ) : filteredPublic.length === 0 ? (
            <EmptyState icon={Users} title="No groups found" description="Be the first to create an Ajo savings circle!" />
          ) : (
            <div className="space-y-3">
              {filteredPublic.map((g) => (
                <Card key={g.id} className="cursor-pointer hover:shadow-soft transition-shadow" onClick={() => navigate(`/ajo/${g.id}`)}>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-sm truncate flex-1">{g.title}</h3>
                      <Badge variant="outline" className="text-[10px] ml-2">{frequencyLabel[g.frequency]}</Badge>
                    </div>
                    <p className="font-mono-num text-lg font-bold text-primary">
                      ₦{Number(g.contribution_amount).toLocaleString("en-NG")}<span className="text-xs font-normal text-muted-foreground">/{g.frequency}</span>
                    </p>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{g.filled_slots}/{g.total_slots} slots filled</span>
                        <span>{Math.round((g.filled_slots / g.total_slots) * 100)}%</span>
                      </div>
                      <Progress value={(g.filled_slots / g.total_slots) * 100} className="h-2" />
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="secondary" className="text-[10px] gap-1">
                        <Users className="h-3 w-3" /> {orderLabel[g.order_type]}
                      </Badge>
                      <Badge variant="secondary" className="text-[10px] gap-1">
                        <Shield className="h-3 w-3" /> KYC Lvl {g.min_kyc_level}+
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* MY AJOS TAB */}
        <TabsContent value="my-ajos" className="space-y-3">
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            </div>
          ) : myGroups.length === 0 ? (
            <EmptyState icon={Users} title="No active Ajos" description="Join or create an Ajo savings circle to get started." />
          ) : (
            myGroups.map((g) => {
              const due = getNextDueDate(g);
              const countdown = getCountdown(due);
              return (
                <Card key={g.id} className="cursor-pointer hover:shadow-soft transition-shadow" onClick={() => navigate(`/ajo/${g.id}`)}>
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-sm truncate flex-1">{g.title}</h3>
                      <Badge variant={g.status === "active" ? "default" : "secondary"} className="text-[10px]">
                        {g.status === "recruiting" ? "Recruiting" : `Cycle ${g.current_cycle}/${g.total_slots}`}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="font-mono-num text-lg font-bold">
                        ₦{Number(g.contribution_amount).toLocaleString("en-NG")}
                      </p>
                      {countdown && (
                        <div className="flex items-center gap-1 text-xs">
                          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="font-mono-num font-semibold text-primary">{countdown}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Position #{g.my_position}</span>
                      <span>{frequencyLabel[g.frequency]}</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>

        {/* HISTORY TAB */}
        <TabsContent value="history" className="space-y-3">
          {loading ? (
            <div className="flex justify-center py-10">
              <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            </div>
          ) : history.length === 0 ? (
            <EmptyState icon={Clock} title="No history yet" description="Completed Ajo cycles will appear here." />
          ) : (
            history.map((g) => {
              const net = Number(g.total_collected) - Number(g.total_contributed);
              return (
                <Card key={g.id} className="cursor-pointer hover:shadow-soft transition-shadow" onClick={() => navigate(`/ajo/${g.id}`)}>
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-sm truncate flex-1">{g.title}</h3>
                      <Badge variant="outline" className="text-[10px]">Completed</Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <p className="text-[10px] text-muted-foreground">Contributed</p>
                        <p className="font-mono-num text-sm font-bold">₦{Number(g.total_contributed).toLocaleString("en-NG")}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground">Collected</p>
                        <p className="font-mono-num text-sm font-bold">₦{Number(g.total_collected).toLocaleString("en-NG")}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-muted-foreground">Net</p>
                        <div className="flex items-center justify-center gap-0.5">
                          {net >= 0 ? <TrendingUp className="h-3 w-3 text-accent" /> : <TrendingDown className="h-3 w-3 text-destructive" />}
                          <p className={`font-mono-num text-sm font-bold ${net >= 0 ? "text-accent" : "text-destructive"}`}>
                            ₦{Math.abs(net).toLocaleString("en-NG")}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AjoPage;
