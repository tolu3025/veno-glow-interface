import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Users, Shield, Clock, Loader2, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { friendlyInvoke } from "@/lib/friendlyInvoke";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const freqLabel: Record<string, string> = { daily: "Daily", weekly: "Weekly", monthly: "Monthly" };

const AjoInvitePage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [group, setGroup] = useState<any>(null);
  const [creatorName, setCreatorName] = useState("");
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    if (id) fetchGroup();
  }, [id]);

  const fetchGroup = async () => {
    setLoading(true);
    try {
      let groupData: any = null;
      try {
        const data = await friendlyInvoke<{ group?: any; creator_name?: string }>(
          "manage-ajo",
          { body: { action: "get_public_group", group_id: id } }
        );
        if (data?.group) {
          groupData = data.group;
          if (data.creator_name) setCreatorName(data.creator_name);
        }
      } catch {
        // Fall through to direct query
      }

      if (!groupData) {
        const { data: directData } = await supabase
          .from("ajo_groups")
          .select("*")
          .eq("id", id!)
          .single();
        if (directData) {
          groupData = directData;
          try {
            const { data: profile } = await supabase
              .from("profiles")
              .select("full_name")
              .eq("id", directData.creator_id)
              .single();
            if (profile) setCreatorName(profile.full_name);
          } catch {}
        }
      }

      if (groupData) setGroup(groupData);
    } catch {
      // Silent fail
    }
    setLoading(false);
  };

  const handleJoin = async () => {
    if (!user) {
      // Store pending join and redirect to register
      sessionStorage.setItem("pending_ajo_join", id!);
      navigate(`/login?redirect=/ajo/invite/${id}`);
      return;
    }

    setJoining(true);
    try {
      const data = await friendlyInvoke<any>("manage-ajo", {
        body: { action: "join", group_id: id },
      }, "Failed to join group");
      toast.success(`Joined! You're position #${data.position}`);
      navigate(`/ajo/${id}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to join group");
    } finally {
      setJoining(false);
    }
  };

  // Auto-join if returning from login with pending join
  useEffect(() => {
    const pending = sessionStorage.getItem("pending_ajo_join");
    if (pending === id && user && group?.status === "recruiting") {
      sessionStorage.removeItem("pending_ajo_join");
      handleJoin();
    }
  }, [user, group]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!group) {
    return (
      <div className="px-5 pt-10 text-center space-y-4">
        <h1 className="text-lg font-bold">Group Not Found</h1>
        <p className="text-sm text-muted-foreground">This Ajo group may have been removed.</p>
        <Button onClick={() => navigate("/")}>Go Home</Button>
      </div>
    );
  }

  const isFull = group.filled_slots >= group.total_slots;
  const isRecruiting = group.status === "recruiting";

  return (
    <div className="px-5 pt-10 pb-8 space-y-5 max-w-md mx-auto">
      <button onClick={() => navigate("/")} className="flex items-center gap-1 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Home
      </button>

      <div className="text-center space-y-2">
        <h1 className="text-xl font-bold">You're Invited!</h1>
        <p className="text-sm text-muted-foreground">Join this Ajo savings group</p>
      </div>

      <Card className="bg-primary text-primary-foreground overflow-hidden relative">
        <CardContent className="p-5 space-y-3">
          <h2 className="text-lg font-bold">{group.title}</h2>
          {group.description && <p className="text-sm opacity-80">{group.description}</p>}
          <p className="font-mono-num text-3xl font-bold">
            ₦{Number(group.contribution_amount).toLocaleString("en-NG")}
            <span className="text-sm font-normal opacity-70">/{group.frequency}</span>
          </p>
          <div className="flex gap-2 flex-wrap">
            <Badge variant="secondary" className="text-[10px] bg-primary-foreground/20 text-primary-foreground border-0">
              {freqLabel[group.frequency] || group.frequency}
            </Badge>
            <Badge variant="secondary" className="text-[10px] bg-primary-foreground/20 text-primary-foreground border-0">
              <Shield className="h-3 w-3 mr-0.5" /> KYC {group.min_kyc_level}+
            </Badge>
          </div>
          {creatorName && <p className="text-xs opacity-70">Created by {creatorName}</p>}
        </CardContent>
        <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-accent/20" />
      </Card>

      {/* Slots */}
      <Card>
        <CardContent className="p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium">Slots</span>
            <span className="font-mono-num">{group.filled_slots}/{group.total_slots}</span>
          </div>
          <Progress value={(group.filled_slots / group.total_slots) * 100} className="h-2" />
          <div className="bg-muted/50 rounded-lg p-3 space-y-1">
            <p className="text-xs font-semibold">Total Pot Per Cycle</p>
            <p className="font-mono-num text-lg font-bold">
              ₦{(Number(group.contribution_amount) * group.total_slots).toLocaleString("en-NG")}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Action */}
      {isRecruiting && !isFull ? (
        <Button onClick={handleJoin} disabled={joining} className="w-full gap-2" size="lg">
          {joining ? <Loader2 className="h-4 w-4 animate-spin" /> : <Users className="h-4 w-4" />}
          {user ? "Join This Ajo" : "Sign In to Join"}
        </Button>
      ) : (
        <Card className="border-muted">
          <CardContent className="p-4 text-center text-sm text-muted-foreground">
            {isFull ? "This group is full." : "This group is no longer accepting members."}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AjoInvitePage;
