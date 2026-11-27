import { useState, useEffect } from "react";
import { Loader2, CheckCircle, XCircle, Clock, User } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import EmptyState from "@/components/shared/EmptyState";

const AdminRunnersPage = () => {
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [notes, setNotes] = useState<Record<string, string>>({});

  const fetchApplications = async () => {
    setLoading(true);
    const { data } = await supabase.from("runner_applications")
      .select("*").order("created_at", { ascending: false });

    // Fetch profile names for each application
    if (data?.length) {
      const userIds = data.map((a: any) => a.user_id);
      const { data: profiles } = await supabase.from("profiles")
        .select("id, full_name, matric_number, kyc_level").in("id", userIds);

      const profileMap = (profiles || []).reduce((acc: any, p: any) => {
        acc[p.id] = p;
        return acc;
      }, {});

      setApplications(data.map((a: any) => ({ ...a, profile: profileMap[a.user_id] })));
    } else {
      setApplications([]);
    }
    setLoading(false);
  };

  useEffect(() => { fetchApplications(); }, []);

  const handleAction = async (id: string, status: "approved" | "rejected") => {
    setActionLoading(id);
    const updateData: any = {
      status,
      admin_notes: notes[id] || null,
    };
    if (status === "approved") updateData.approved_at = new Date().toISOString();

    const { error } = await supabase.from("runner_applications")
      .update(updateData).eq("id", id);

    setActionLoading(null);

    if (error) {
      toast.error("Failed to update application");
      return;
    }

    // Notify applicant
    const app = applications.find(a => a.id === id);
    if (app) {
      await supabase.rpc("create_notification", {
        p_user_id: app.user_id,
        p_title: status === "approved" ? "Runner Application Approved ✅" : "Runner Application Rejected",
        p_message: status === "approved"
          ? "You can now accept delivery errands!"
          : notes[id] || "Your runner application was not approved.",
        p_type: "general",
        p_metadata: {},
      });
    }

    toast.success(`Application ${status}`);
    fetchApplications();
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <h2 className="text-lg font-bold">Runner Applications</h2>

      {applications.length === 0 ? (
        <EmptyState icon={User} title="No applications" description="No runner applications submitted yet." />
      ) : (
        <div className="space-y-3">
          {applications.map((a) => (
            <Card key={a.id}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-sm">{a.profile?.full_name || "Unknown"}</p>
                    <p className="text-xs text-muted-foreground">{a.profile?.matric_number}</p>
                  </div>
                  <Badge className={`border-0 text-[10px] ${
                    a.status === "pending" ? "bg-yellow-500/10 text-yellow-600" :
                    a.status === "approved" ? "bg-accent/10 text-accent" :
                    "bg-destructive/10 text-destructive"
                  }`}>
                    {a.status === "pending" ? <Clock className="h-3 w-3 mr-1" /> :
                     a.status === "approved" ? <CheckCircle className="h-3 w-3 mr-1" /> :
                     <XCircle className="h-3 w-3 mr-1" />}
                    {a.status}
                  </Badge>
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>KYC Level: {a.profile?.kyc_level || 0}</span>
                  <span>•</span>
                  <span>{format(new Date(a.created_at), "MMM d, yyyy")}</span>
                </div>

                {a.status === "pending" && (
                  <>
                    <Textarea
                      placeholder="Admin notes (optional)"
                      value={notes[a.id] || ""}
                      onChange={(e) => setNotes(prev => ({ ...prev, [a.id]: e.target.value }))}
                      className="text-xs"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive"
                        onClick={() => handleAction(a.id, "rejected")}
                        disabled={actionLoading === a.id}
                      >
                        {actionLoading === a.id ? <Loader2 className="h-3 w-3 animate-spin" /> : "Reject"}
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleAction(a.id, "approved")}
                        disabled={actionLoading === a.id}
                      >
                        {actionLoading === a.id ? <Loader2 className="h-3 w-3 animate-spin" /> : "Approve"}
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminRunnersPage;
