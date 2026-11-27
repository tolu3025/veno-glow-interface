import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Users, Clock, Shield, Bell, UserMinus, Play, CheckCircle, AlertCircle, Loader2, FileText, Share2, Link as LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { friendlyInvoke } from "@/lib/friendlyInvoke";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const freqLabel: Record<string, string> = { daily: "Daily", weekly: "Weekly", monthly: "Monthly" };
const orderLabel: Record<string, string> = { random_ballot: "Random Ballot", admin_assigned: "Admin Assigned", first_come: "First Come" };

const AjoDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, wallet, refreshWallet } = useAuth();
  const [details, setDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [pinDialog, setPinDialog] = useState(false);
  const [pin, setPin] = useState("");
  const [disbursementAnim, setDisbursementAnim] = useState(false);
  const [joinDialog, setJoinDialog] = useState(false);
  const [agreed, setAgreed] = useState(false);

  useEffect(() => {
    loadDetails();
  }, [id]);

  const loadDetails = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await friendlyInvoke<any>("manage-ajo", {
        body: { action: "get_details", group_id: id },
      }, "Failed to load group details");
      setDetails(data);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const confirmJoin = async () => {
    setActionLoading(true);
    try {
      const data = await friendlyInvoke<any>("manage-ajo", {
        body: { action: "join", group_id: id },
      }, "Failed to join group");
      if (data?.already_member) {
        toast.info("You're already a member of this group");
        setJoinDialog(false);
        loadDetails();
        return;
      }
      toast.success(`Joined! You're position #${data.position}`);
      setJoinDialog(false);
      setAgreed(false);
      loadDetails();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleContribute = async () => {
    if (pin.length < 4) { toast.error("Enter your 4-digit PIN"); return; }
    setActionLoading(true);
    try {
      const data = await friendlyInvoke<any>("manage-ajo", {
        body: { action: "contribute", group_id: id, pin },
      }, "Contribution failed. Please try again.");
      setPinDialog(false);
      setPin("");
      toast.success("Contribution successful!");
      if (data.all_paid) {
        setDisbursementAnim(true);
        setTimeout(() => setDisbursementAnim(false), 3000);
      }
      await refreshWallet();
      loadDetails();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleStart = async () => {
    setActionLoading(true);
    try {
      await friendlyInvoke("manage-ajo", {
        body: { action: "start", group_id: id },
      }, "Failed to start group");
      toast.success("Ajo started!");
      loadDetails();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemind = async () => {
    setActionLoading(true);
    try {
      const data = await friendlyInvoke<any>("manage-ajo", {
        body: { action: "admin_remind", group_id: id },
      }, "Failed to send reminders");
      toast.success(`Reminders sent to ${data.reminded} members`);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRemoveMember = async (memberUserId: string) => {
    if (!confirm("Remove this member from the group?")) return;
    setActionLoading(true);
    try {
      await friendlyInvoke("manage-ajo", {
        body: { action: "remove_member", group_id: id, member_user_id: memberUserId },
      }, "Failed to remove member");
      toast.success("Member removed");
      loadDetails();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!details?.group) {
    return (
      <div className="px-5 pt-10 pb-4 space-y-5">
        <button onClick={() => navigate("/ajo")} className="flex items-center gap-1 text-sm text-muted-foreground">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <p className="text-center text-muted-foreground">Group not found</p>
      </div>
    );
  }

  const { group, members, contributions, disbursements, creator_name, is_member, is_creator, user_member } = details;
  const activeMembers = (members || []).filter((m: any) => m.status === "active");
  const myContribution = (contributions || []).find((c: any) => c.member_id === user_member?.id);
  const hasPaid = myContribution?.status === "paid";
  const paidCount = (contributions || []).filter((c: any) => c.status === "paid").length;
  const recipientMember = activeMembers.find((m: any) => m.position === group.current_cycle);

  // Calculate expected collection dates for each member position
  const getExpectedDate = (position: number) => {
    if (!group.start_date) return null;
    const start = new Date(group.start_date);
    const cyclesAway = position - 1;
    const d = new Date(start);
    if (group.frequency === "daily") d.setDate(d.getDate() + cyclesAway);
    else if (group.frequency === "weekly") d.setDate(d.getDate() + cyclesAway * 7);
    else d.setMonth(d.getMonth() + cyclesAway);
    return d;
  };

  return (
    <div className="px-5 pt-10 pb-4 space-y-5">
      {/* Disbursement animation overlay */}
      {disbursementAnim && (
        <div className="fixed inset-0 z-50 bg-background/90 flex items-center justify-center">
          <div className="text-center space-y-4 animate-in fade-in zoom-in duration-500">
            <div className="h-20 w-20 rounded-full bg-accent/20 flex items-center justify-center mx-auto">
              <CheckCircle className="h-10 w-10 text-accent animate-pulse" />
            </div>
            <h2 className="text-xl font-bold">All Contributions In! 🎉</h2>
            <p className="text-lg font-mono-num font-bold text-primary">
              ₦{(group.contribution_amount * group.filled_slots).toLocaleString("en-NG")}
            </p>
            <p className="text-sm text-muted-foreground">Disbursed to position #{group.current_cycle}</p>
          </div>
        </div>
      )}

      <button onClick={() => navigate("/ajo")} className="flex items-center gap-1 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>

      {/* Group Header */}
      <Card className="bg-primary text-primary-foreground overflow-hidden relative">
        <CardContent className="p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-bold">{group.title}</h1>
            <Badge variant="outline" className="border-primary-foreground/30 text-primary-foreground text-[10px]">
              {group.status === "recruiting" ? "Recruiting" : group.status === "active" ? `Cycle ${group.current_cycle}` : group.status}
            </Badge>
          </div>
          {group.description && <p className="text-sm opacity-80">{group.description}</p>}
          <p className="font-mono-num text-3xl font-bold">
            ₦{Number(group.contribution_amount).toLocaleString("en-NG")}
            <span className="text-sm font-normal opacity-70">/{group.frequency}</span>
          </p>
          <div className="flex gap-2 flex-wrap">
            <Badge variant="secondary" className="text-[10px] bg-primary-foreground/20 text-primary-foreground border-0">
              {freqLabel[group.frequency]}
            </Badge>
            <Badge variant="secondary" className="text-[10px] bg-primary-foreground/20 text-primary-foreground border-0">
              {orderLabel[group.order_type]}
            </Badge>
            <Badge variant="secondary" className="text-[10px] bg-primary-foreground/20 text-primary-foreground border-0">
              <Shield className="h-3 w-3 mr-0.5" /> KYC {group.min_kyc_level}+
            </Badge>
          </div>
          <p className="text-xs opacity-70">Created by {creator_name}</p>
        </CardContent>
        <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-accent/20" />
      </Card>

      {/* Progress */}
      <Card>
        <CardContent className="p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium">Slots</span>
            <span className="font-mono-num">{group.filled_slots}/{group.total_slots}</span>
          </div>
          <Progress value={(group.filled_slots / group.total_slots) * 100} className="h-2" />
          {group.status === "active" && contributions && (
            <>
              <div className="flex justify-between text-sm mt-3">
                <span className="font-medium">Cycle {group.current_cycle} Contributions</span>
                <span className="font-mono-num">{paidCount}/{activeMembers.length}</span>
              </div>
              <Progress value={(paidCount / Math.max(activeMembers.length, 1)) * 100} className="h-2" />
              {recipientMember && (
                <p className="text-xs text-muted-foreground">
                  Collecting: Position #{group.current_cycle} — {(recipientMember as any).profiles?.full_name || "Member"}
                </p>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Action buttons */}
      {!is_member && group.status === "recruiting" && (
        <Button onClick={() => setJoinDialog(true)} disabled={actionLoading} className="w-full gap-2">
          <Users className="h-4 w-4" /> Join This Ajo
        </Button>
      )}

      {is_member && group.status === "active" && !hasPaid && myContribution && (
        <Button onClick={() => setPinDialog(true)} disabled={actionLoading} className="w-full gap-2">
          Contribute ₦{Number(group.contribution_amount).toLocaleString("en-NG")}
        </Button>
      )}

      {is_member && hasPaid && (
        <Card className="border-accent/30 bg-accent/5">
          <CardContent className="p-3 flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-accent" />
            <span className="text-sm font-medium">You've contributed for cycle {group.current_cycle}</span>
          </CardContent>
        </Card>
      )}

      {/* Share Invite Link */}
      {group.status === "recruiting" && (
        <Button
          variant="outline"
          className="w-full gap-2"
          onClick={() => {
            const url = `${window.location.origin}/ajo/invite/${id}`;
            if (navigator.share) {
              navigator.share({ title: `Join ${group.title} on Kuka Pay`, text: `Join my Ajo savings group "${group.title}" — ₦${Number(group.contribution_amount).toLocaleString("en-NG")}/${group.frequency}`, url });
            } else {
              navigator.clipboard.writeText(url);
              toast.success("Invite link copied!");
            }
          }}
        >
          <Share2 className="h-4 w-4" /> Share Invite Link
        </Button>
      )}

      {/* Admin controls */}
      {is_creator && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <h3 className="font-semibold text-sm">Admin Controls</h3>
            <div className="flex gap-2 flex-wrap">
              {group.status === "recruiting" && (
                <Button size="sm" onClick={handleStart} disabled={actionLoading || group.filled_slots < 2} className="gap-1">
                  <Play className="h-3.5 w-3.5" /> Start Group
                </Button>
              )}
              {group.status === "active" && (
                <Button size="sm" variant="outline" onClick={handleRemind} disabled={actionLoading} className="gap-1">
                  <Bell className="h-3.5 w-3.5" /> Send Reminders
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Members */}
      <div>
        <h3 className="font-semibold text-sm mb-3">Members ({activeMembers.length})</h3>
        <div className="space-y-2">
          {activeMembers.map((m: any) => {
            const contrib = (contributions || []).find((c: any) => c.member_id === m.id);
            const isPaid = contrib?.status === "paid";
            const isCollecting = m.position === group.current_cycle;
            return (
              <Card key={m.id} className={isCollecting ? "border-accent/30 bg-accent/5" : ""}>
                <CardContent className="p-3 flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-xs font-bold font-mono-num">#{m.position}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{m.profiles?.full_name || "Member"}</p>
                    <div className="flex items-center gap-1.5">
                      {isCollecting && <Badge variant="default" className="text-[9px] h-4">Collecting</Badge>}
                      {group.status === "active" && contrib && (
                        <Badge variant={isPaid ? "outline" : "secondary"} className={`text-[9px] h-4 ${isPaid ? "text-accent border-accent/30" : ""}`}>
                          {isPaid ? "Paid" : "Pending"}
                        </Badge>
                      )}
                      {group.start_date && (
                        <span className="text-[9px] text-muted-foreground font-mono-num">
                          Collects: {getExpectedDate(m.position)?.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                        </span>
                      )}
                    </div>
                  </div>
                  {is_creator && m.user_id !== user?.id && (
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive" onClick={() => handleRemoveMember(m.user_id)}>
                      <UserMinus className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Contribution Ledger */}
      {disbursements && disbursements.length > 0 && (
        <div>
          <h3 className="font-semibold text-sm mb-3">Disbursement History</h3>
          <div className="space-y-2">
            {disbursements.map((d: any) => {
              const recipient = (members || []).find((m: any) => m.id === d.recipient_member_id);
              return (
                <Card key={d.id}>
                  <CardContent className="p-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">Cycle {d.cycle_number}</p>
                      <p className="text-xs text-muted-foreground">{recipient?.profiles?.full_name || "Member"}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-mono-num text-sm font-bold">₦{Number(d.amount).toLocaleString("en-NG")}</p>
                      {d.disbursed_at && <p className="text-[10px] text-muted-foreground">{new Date(d.disbursed_at).toLocaleDateString()}</p>}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* PIN Dialog */}
      <Dialog open={pinDialog} onOpenChange={setPinDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Contribution</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="bg-muted/50 rounded-lg p-3 space-y-1">
              <p className="text-xs text-muted-foreground">Amount</p>
              <p className="font-mono-num text-xl font-bold">₦{Number(group.contribution_amount).toLocaleString("en-NG")}</p>
              {myContribution && new Date() > new Date(myContribution.due_date) && (
                <div className="flex items-center gap-1 text-destructive text-xs">
                  <AlertCircle className="h-3 w-3" />
                  <span>Late fee: {group.late_fee_percent}% (₦{(group.contribution_amount * group.late_fee_percent / 100).toLocaleString("en-NG")})</span>
                </div>
              )}
              <p className="text-xs text-muted-foreground">Balance: ₦{(wallet?.balance ?? 0).toLocaleString("en-NG")}</p>
            </div>
            <div className="space-y-2">
              <Label>Transaction PIN</Label>
              <Input type="password" inputMode="numeric" maxLength={6} placeholder="Enter PIN" value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setPinDialog(false); setPin(""); }}>Cancel</Button>
            <Button onClick={handleContribute} disabled={actionLoading || pin.length < 4}>
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Join Agreement Dialog */}
      <Dialog open={joinDialog} onOpenChange={setJoinDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><FileText className="h-5 w-5" /> Ajo Agreement</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <p>By joining <span className="font-bold">{group.title}</span>, you agree to:</p>
            <ul className="space-y-2 text-muted-foreground">
              <li>• Contribute <span className="font-mono-num font-bold text-foreground">₦{Number(group.contribution_amount).toLocaleString("en-NG")}</span> every {group.frequency} cycle</li>
              <li>• Late contributions incur a <span className="font-bold text-foreground">{group.late_fee_percent}%</span> late fee</li>
              <li>• Missing <span className="font-bold text-foreground">{group.max_missed}</span> contributions results in automatic removal</li>
              <li>• Collection order: <span className="font-bold text-foreground">{orderLabel[group.order_type]}</span></li>
              <li>• Your position in the cycle determines when you receive the pool</li>
            </ul>
            <div className="flex items-center gap-2 pt-2">
              <Checkbox id="agree" checked={agreed} onCheckedChange={(c) => setAgreed(!!c)} />
              <label htmlFor="agree" className="text-sm font-medium cursor-pointer">I understand and agree to these terms</label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setJoinDialog(false); setAgreed(false); }}>Cancel</Button>
            <Button onClick={confirmJoin} disabled={!agreed || actionLoading}>
              {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Join Group"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AjoDetailPage;