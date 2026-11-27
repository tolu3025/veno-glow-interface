import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Users, Shuffle, UserCog, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { friendlyInvoke } from "@/lib/friendlyInvoke";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const STORAGE_KEY = "ajo_draft";

const MONITOR_EMAIL = "toluwanimioyetade@gmail.com";

const CreateAjoPage = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"form" | "preview">("form");

  // Restore from sessionStorage
  const saved = (() => {
    if (typeof window === "undefined") return {};
    try { return JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "{}"); } catch { return {}; }
  })();

  const [title, setTitle] = useState(saved.title || "");
  const [description, setDescription] = useState(saved.description || "");
  const [amount, setAmount] = useState(saved.amount || "");
  const [frequency, setFrequency] = useState(saved.frequency || "monthly");
  const [totalSlots, setTotalSlots] = useState(saved.totalSlots || "");
  const [orderType, setOrderType] = useState(saved.orderType || "first_come");
  const [minKycLevel, setMinKycLevel] = useState(saved.minKycLevel || "1");
  const [isPublic, setIsPublic] = useState(saved.isPublic !== undefined ? saved.isPublic : true);

  // Persist to sessionStorage on changes
  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify({
      title, description, amount, frequency, totalSlots, orderType, minKycLevel, isPublic,
    }));
  }, [title, description, amount, frequency, totalSlots, orderType, minKycLevel, isPublic]);

  const freqLabel: Record<string, string> = { daily: "Daily", weekly: "Weekly", monthly: "Monthly" };
  const orderLabel: Record<string, string> = { random_ballot: "Random Ballot", admin_assigned: "Admin Assigned", first_come: "First Come First Served" };

  const isMonitor = (user?.email || "").toLowerCase() === MONITOR_EMAIL;
  const canCreate = isMonitor && profile && profile.kyc_level >= 3;

  const handleSubmit = async () => {
    if (!title.trim() || !amount || !totalSlots) {
      toast.error("Please fill all required fields");
      return;
    }
    const numAmount = parseFloat(amount);
    const numSlots = parseInt(totalSlots);
    if (isNaN(numAmount) || numAmount < 100) {
      toast.error("Minimum contribution is ₦100");
      return;
    }
    if (isNaN(numSlots) || numSlots < 2 || numSlots > 50) {
      toast.error("Slots must be between 2 and 50");
      return;
    }

    setLoading(true);
    try {
      const data = await friendlyInvoke<any>("manage-ajo", {
        body: {
          action: "create",
          title: title.trim(),
          description: description.trim() || null,
          contribution_amount: numAmount,
          frequency,
          total_slots: numSlots,
          order_type: orderType,
          min_kyc_level: parseInt(minKycLevel),
          is_public: isPublic,
        },
      }, "Failed to create group");

      sessionStorage.removeItem(STORAGE_KEY);
      toast.success("Ajo group created!");
      navigate(`/ajo/${data.group.id}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to create group");
    } finally {
      setLoading(false);
    }
  };

  if (!canCreate) {
    return (
      <div className="px-5 pt-10 pb-4 space-y-5">
        <button onClick={() => navigate("/ajo")} className="flex items-center gap-1 text-sm text-muted-foreground">
          <ArrowLeft className="h-4 w-4" /> Back
        </button>
        <Card>
          <CardContent className="p-6 text-center space-y-3">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <h2 className="font-bold">Ajo groups are curated</h2>
            <p className="text-sm text-muted-foreground">
              Ajo groups are currently curated by KukaPay. Browse and join active groups instead.
            </p>
            <Button onClick={() => navigate("/ajo")}>Browse Ajo Groups</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === "preview") {
    return (
      <div className="px-5 pt-10 pb-4 space-y-5">
        <button onClick={() => setStep("form")} className="flex items-center gap-1 text-sm text-muted-foreground">
          <ArrowLeft className="h-4 w-4" /> Edit
        </button>
        <h1 className="text-xl font-bold">Preview Your Ajo</h1>
        <Card>
          <CardContent className="p-4 space-y-3">
            <h3 className="font-semibold">{title}</h3>
            {description && <p className="text-sm text-muted-foreground">{description}</p>}
            <p className="font-mono-num text-2xl font-bold text-primary">
              ₦{parseFloat(amount).toLocaleString("en-NG")}<span className="text-xs font-normal text-muted-foreground">/{frequency}</span>
            </p>
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>1/{totalSlots} slots filled</span>
                <span>{Math.round((1 / parseInt(totalSlots || "2")) * 100)}%</span>
              </div>
              <Progress value={(1 / parseInt(totalSlots || "2")) * 100} className="h-2" />
            </div>
            <div className="flex gap-2 flex-wrap">
              <Badge variant="secondary" className="text-[10px]">{freqLabel[frequency]}</Badge>
              <Badge variant="secondary" className="text-[10px]">{orderLabel[orderType]}</Badge>
              <Badge variant="secondary" className="text-[10px]">KYC Lvl {minKycLevel}+</Badge>
              <Badge variant="secondary" className="text-[10px]">{isPublic ? "Public" : "Private"}</Badge>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 space-y-1">
              <p className="text-xs font-semibold">Total Pot Per Cycle</p>
              <p className="font-mono-num text-lg font-bold">
                ₦{(parseFloat(amount) * parseInt(totalSlots || "2")).toLocaleString("en-NG")}
              </p>
            </div>
          </CardContent>
        </Card>
        <Button onClick={handleSubmit} disabled={loading} className="w-full">
          {loading ? "Creating..." : "Create Ajo Group"}
        </Button>
      </div>
    );
  }

  return (
    <div className="px-5 pt-10 pb-4 space-y-5">
      <button onClick={() => navigate("/ajo")} className="flex items-center gap-1 text-sm text-muted-foreground">
        <ArrowLeft className="h-4 w-4" /> Back
      </button>
      <h1 className="text-xl font-bold">Create Ajo Group</h1>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Group Name *</Label>
          <Input placeholder="e.g. Hall 3 Monthly Savings" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={100} />
        </div>

        <div className="space-y-2">
          <Label>Description</Label>
          <Textarea placeholder="What's this Ajo about?" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={500} rows={3} />
        </div>

        <div className="space-y-2">
          <Label>Contribution Amount (₦) *</Label>
          <Input type="number" placeholder="e.g. 5000" value={amount} onChange={(e) => setAmount(e.target.value)} min={100} />
        </div>

        <div className="space-y-2">
          <Label>Frequency *</Label>
          <Select value={frequency} onValueChange={setFrequency}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Total Slots (2-50) *</Label>
          <Input type="number" placeholder="e.g. 10" value={totalSlots} onChange={(e) => setTotalSlots(e.target.value)} min={2} max={50} />
        </div>

        <div className="space-y-2">
          <Label>Collection Order</Label>
          <RadioGroup value={orderType} onValueChange={setOrderType} className="space-y-2">
            <div className="flex items-center gap-3 p-3 rounded-lg border">
              <RadioGroupItem value="first_come" id="first_come" />
              <label htmlFor="first_come" className="flex-1 cursor-pointer">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">First Come First Served</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">Order based on when members joined</p>
              </label>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg border">
              <RadioGroupItem value="random_ballot" id="random_ballot" />
              <label htmlFor="random_ballot" className="flex-1 cursor-pointer">
                <div className="flex items-center gap-2">
                  <Shuffle className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Random Ballot</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">Positions randomized when group starts</p>
              </label>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg border">
              <RadioGroupItem value="admin_assigned" id="admin_assigned" />
              <label htmlFor="admin_assigned" className="flex-1 cursor-pointer">
                <div className="flex items-center gap-2">
                  <UserCog className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">Admin Assigned</span>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">You decide the collection order</p>
              </label>
            </div>
          </RadioGroup>
        </div>

        <div className="space-y-2">
          <Label>Minimum KYC Level</Label>
          <Select value={minKycLevel} onValueChange={setMinKycLevel}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="1">Level 1 (Basic)</SelectItem>
              <SelectItem value="2">Level 2</SelectItem>
              <SelectItem value="3">Level 3 (Full)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between p-3 rounded-lg border">
          <div>
            <p className="text-sm font-medium">Public Group</p>
            <p className="text-xs text-muted-foreground">Visible on the Discover page</p>
          </div>
          <button
            onClick={() => setIsPublic(!isPublic)}
            className={`h-6 w-11 rounded-full transition-colors ${isPublic ? "bg-primary" : "bg-muted"}`}
          >
            <div className={`h-5 w-5 rounded-full bg-primary-foreground shadow-sm transition-transform ${isPublic ? "translate-x-5" : "translate-x-0.5"}`} />
          </button>
        </div>

        <Button onClick={() => setStep("preview")} className="w-full" disabled={!title.trim() || !amount || !totalSlots}>
          Preview
        </Button>
      </div>
    </div>
  );
};

export default CreateAjoPage;
