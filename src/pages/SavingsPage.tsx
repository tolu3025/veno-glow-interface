import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, Plus, Target, Loader2, Trash2, ArrowDownLeft, ArrowUpRight,
  Delete, CheckCircle, Sparkles, PiggyBank,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { friendlyInvoke } from "@/lib/friendlyInvoke";
import { toast } from "sonner";
import { format } from "date-fns";
import { PasscodePad } from "@/components/shared/PasscodePad";

interface SavingsGoal {
  id: string;
  title: string;
  target_amount: number;
  saved_amount: number;
  deadline: string | null;
  status: string;
  created_at: string;
}

const SavingsPage = () => {
  const navigate = useNavigate();
  const { user, wallet, refreshWallet, profile } = useAuth();
  const [goals, setGoals] = useState<SavingsGoal[]>([]);
  const [loading, setLoading] = useState(true);

  // Create goal state
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newTarget, setNewTarget] = useState("");
  const [newDeadline, setNewDeadline] = useState("");
  const [creating, setCreating] = useState(false);

  // Save/Withdraw dialog state
  const [actionGoal, setActionGoal] = useState<SavingsGoal | null>(null);
  const [actionType, setActionType] = useState<"save" | "withdraw">("save");
  const [actionAmount, setActionAmount] = useState("");
  const [pin, setPin] = useState("");
  const [pinStep, setPinStep] = useState(false);
  const [pinError, setPinError] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchGoals = async () => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("savings_goals" as any)
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setGoals((data as any) || []);
    setLoading(false);
  };

  useEffect(() => { fetchGoals(); }, [user]);

  const handleCreateGoal = async () => {
    if (!newTitle.trim()) { toast.error("Enter a goal title"); return; }
    if (!newTarget || Number(newTarget) < 100) { toast.error("Minimum target is ₦100"); return; }
    setCreating(true);
    const { error } = await supabase.from("savings_goals" as any).insert({
      user_id: user!.id,
      title: newTitle.trim(),
      target_amount: Number(newTarget),
      deadline: newDeadline || null,
    } as any);
    setCreating(false);
    if (error) { toast.error("Failed to create goal"); return; }
    toast.success("Savings goal created! 🎯");
    setShowCreate(false);
    setNewTitle(""); setNewTarget(""); setNewDeadline("");
    fetchGoals();
  };

  const openAction = (goal: SavingsGoal, type: "save" | "withdraw") => {
    setActionGoal(goal);
    setActionType(type);
    setActionAmount("");
    setPin("");
    setPinStep(false);
  };

  const handleActionContinue = () => {
    const amt = Number(actionAmount);
    if (!amt || amt < 1) { toast.error("Enter a valid amount"); return; }
    if (actionType === "save" && amt > (wallet?.balance ?? 0)) { toast.error("Insufficient balance"); return; }
    if (actionType === "withdraw" && amt > (actionGoal?.saved_amount ?? 0)) { toast.error("Exceeds saved amount"); return; }
    if (!profile?.has_transaction_pin) { toast.error("Set a transaction PIN first"); return; }
    setPinStep(true);
    setPin("");
  };

  const handleActionSubmit = async (entered?: string) => {
    const usePin = entered ?? pin;
    if (usePin.length !== 4 || !actionGoal) return;
    setActionLoading(true);
    try {
      await friendlyInvoke("manage-savings", {
        body: {
          action: actionType === "save" ? "save_to_goal" : "withdraw_from_goal",
          goal_id: actionGoal.id,
          amount: Number(actionAmount),
          pin: usePin,
        },
      }, "Action failed");
      toast.success(actionType === "save" ? "Saved successfully! 💰" : "Withdrawn successfully!");
      setActionGoal(null);
      await refreshWallet();
      fetchGoals();
    } catch (e: any) {
      toast.error(e.message);
      if (/incorrect pin/i.test(e.message)) {
        setPin("");
        setPinError(true);
        setTimeout(() => setPinError(false), 600);
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    const goal = goals.find(g => g.id === goalId);
    if (goal && goal.saved_amount > 0) {
      toast.error("Withdraw funds before deleting");
      return;
    }
    await supabase.from("savings_goals" as any).delete().eq("id", goalId);
    toast.success("Goal deleted");
    fetchGoals();
  };

  const PinPad = () => (
    <div className="flex flex-col items-center space-y-4">
      <PasscodePad
        value={pin}
        onChange={setPin}
        onComplete={handleActionSubmit}
        subtitle={`${actionType === "save" ? "Save" : "Withdraw"} ₦${Number(actionAmount).toLocaleString()}`}
        loading={actionLoading}
        error={pinError}
      />
      {actionLoading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Processing…
        </div>
      )}
    </div>
  );

  const getProgress = (goal: SavingsGoal) =>
    goal.target_amount > 0 ? Math.min((goal.saved_amount / goal.target_amount) * 100, 100) : 0;

  return (
    <div className="px-5 pt-10 pb-24 space-y-5 max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/")} className="h-9 w-9 rounded-full bg-muted flex items-center justify-center">
            <ArrowLeft className="h-4 w-4 text-foreground" />
          </button>
          <h1 className="text-lg font-bold">Savings Goals</h1>
        </div>
        <Button size="sm" className="gap-1" onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4" /> New Goal
        </Button>
      </div>

      {/* Summary */}
      <Card className="bg-primary text-primary-foreground overflow-hidden relative">
        <CardContent className="p-5 space-y-2">
          <div className="flex items-center gap-2">
            <PiggyBank className="h-5 w-5 opacity-80" />
            <p className="text-sm opacity-80">Total Saved</p>
          </div>
          <p className="text-3xl font-bold font-mono tracking-tight">
            ₦{goals.reduce((s, g) => s + g.saved_amount, 0).toLocaleString("en-NG", { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs opacity-60">{goals.filter(g => g.status === "active").length} active goal{goals.filter(g => g.status === "active").length !== 1 ? "s" : ""}</p>
        </CardContent>
        <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-accent/20" />
      </Card>

      {/* Create Goal Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Target className="h-5 w-5" /> Create Savings Goal</DialogTitle>
            <DialogDescription>Set a target and start saving toward it</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Goal Title</label>
              <Input placeholder="e.g. New Laptop, School Fees" value={newTitle} onChange={e => setNewTitle(e.target.value)} maxLength={50} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Target Amount (₦)</label>
              <Input type="number" inputMode="numeric" placeholder="50000" value={newTarget} onChange={e => setNewTarget(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Deadline (Optional)</label>
              <Input type="date" value={newDeadline} onChange={e => setNewDeadline(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleCreateGoal} disabled={creating}>
              {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
              Create Goal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Save/Withdraw Action Dialog */}
      <Dialog open={!!actionGoal} onOpenChange={(open) => !open && setActionGoal(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{actionType === "save" ? "Save to Goal" : "Withdraw from Goal"}</DialogTitle>
            <DialogDescription>{actionGoal?.title}</DialogDescription>
          </DialogHeader>
          {!pinStep ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Amount (₦)</label>
                <Input type="number" inputMode="numeric" placeholder="1000" value={actionAmount} onChange={e => setActionAmount(e.target.value)} />
              </div>
              {actionType === "save" && (
                <p className="text-xs text-muted-foreground">
                  Wallet balance: ₦{(wallet?.balance ?? 0).toLocaleString("en-NG", { minimumFractionDigits: 2 })}
                </p>
              )}
              {actionType === "withdraw" && (
                <p className="text-xs text-muted-foreground">
                  Available: ₦{(actionGoal?.saved_amount ?? 0).toLocaleString("en-NG", { minimumFractionDigits: 2 })}
                </p>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setActionGoal(null)}>Cancel</Button>
                <Button onClick={handleActionContinue}>Continue</Button>
              </DialogFooter>
            </div>
          ) : (
            <PinPad />
          )}
        </DialogContent>
      </Dialog>

      {/* Goals List */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : goals.length === 0 ? (
        <div className="text-center py-12 space-y-3">
          <PiggyBank className="h-12 w-12 mx-auto text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">No savings goals yet</p>
          <Button size="sm" onClick={() => setShowCreate(true)}>Create Your First Goal</Button>
        </div>
      ) : (
        <div className="space-y-3">
          {goals.map((goal) => {
            const progress = getProgress(goal);
            const isComplete = progress >= 100;
            return (
              <Card key={goal.id} className={isComplete ? "border-accent/30 bg-accent/5" : ""}>
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-sm">{goal.title}</h3>
                        {isComplete && (
                          <Badge className="bg-accent/15 text-accent text-[10px] border-0 gap-0.5">
                            <CheckCircle className="h-2.5 w-2.5" /> Complete
                          </Badge>
                        )}
                      </div>
                      {goal.deadline && (
                        <p className="text-[10px] text-muted-foreground">
                          Deadline: {format(new Date(goal.deadline), "MMM d, yyyy")}
                        </p>
                      )}
                    </div>
                    {goal.saved_amount === 0 && (
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDeleteGoal(goal.id)}>
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">
                        ₦{goal.saved_amount.toLocaleString()} / ₦{goal.target_amount.toLocaleString()}
                      </span>
                      <span className="font-semibold">{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} className="h-2.5" />
                  </div>

                  {goal.status === "active" && (
                    <div className="flex gap-2">
                      <Button size="sm" className="flex-1 gap-1" onClick={() => openAction(goal, "save")}>
                        <ArrowDownLeft className="h-3 w-3" /> Save
                      </Button>
                      {goal.saved_amount > 0 && (
                        <Button size="sm" variant="outline" className="flex-1 gap-1" onClick={() => openAction(goal, "withdraw")}>
                          <ArrowUpRight className="h-3 w-3" /> Withdraw
                        </Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SavingsPage;
