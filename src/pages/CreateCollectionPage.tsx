import {
  ArrowLeft, Loader2, Gift,
} from "lucide-react";
import { COLLECTION_BONUS_TIERS, fmtNgn } from "@/lib/collectionBonus";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { friendlyInvoke } from "@/lib/friendlyInvoke";
import { toast } from "sonner";

const CATEGORIES = [
  { value: "dues", label: "Dues" },
  { value: "materials", label: "Materials" },
  { value: "event", label: "Event" },
  { value: "other", label: "Other" },
];

const CreateCollectionPage = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [amountPerPerson, setAmountPerPerson] = useState("");
  const [deadline, setDeadline] = useState<Date>();
  const [category, setCategory] = useState("other");
  const [requireMatric, setRequireMatric] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!title.trim()) {
      toast.error("Title is required");
      return;
    }
    if (!targetAmount || Number(targetAmount) <= 0) {
      toast.error("Enter a valid target amount");
      return;
    }

    setLoading(true);
    try {
      const created = await friendlyInvoke<{ collection: { id: string } }>("manage-collection", {
        body: {
          action: "create",
          title: title.trim(),
          description: description.trim() || null,
          target_amount: Number(targetAmount),
          amount_per_person: amountPerPerson ? Number(amountPerPerson) : null,
          deadline: deadline ? deadline.toISOString() : null,
          category,
          require_matric: requireMatric,
        },
      }, "Failed to create collection");
      toast.success("Collection created!");
      navigate(`/collect?new=${created?.collection?.id ?? ""}`, { replace: true });
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-5 pt-10 pb-8 space-y-5 max-w-md mx-auto">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="h-9 w-9 rounded-full bg-muted flex items-center justify-center"
        >
          <ArrowLeft className="h-4 w-4 text-foreground" />
        </button>
        <h1 className="text-lg font-bold">Create Collection</h1>
      </div>

      <Card>
        <CardContent className="p-5 space-y-4">
          <div className="space-y-2">
            <Label>Title *</Label>
            <Input
              placeholder="e.g. Class Materials Fee"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
            />
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea
              placeholder="What's this collection for?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value}>
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Target Amount (₦) *</Label>
            <Input
              type="number"
              inputMode="numeric"
              placeholder="50000"
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Amount Per Person (₦)</Label>
            <Input
              type="number"
              inputMode="numeric"
              placeholder="Optional — leave blank for any amount"
              value={amountPerPerson}
              onChange={(e) => setAmountPerPerson(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Set a fixed amount each person should pay, or leave blank to accept any amount.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Deadline</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !deadline && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {deadline ? format(deadline, "PPP") : "Optional deadline"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={deadline}
                  onSelect={setDeadline}
                  disabled={(date) => date < new Date()}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Require Matric Number</Label>
              <p className="text-xs text-muted-foreground">Contributors must enter matric number before paying</p>
            </div>
            <Switch checked={requireMatric} onCheckedChange={setRequireMatric} />
          </div>
        </CardContent>
      </Card>

      <Card className="border-accent/30 bg-accent/5">
        <CardContent className="p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Gift className="h-4 w-4 text-accent" />
            <p className="text-sm font-semibold">Earn a collection bonus</p>
          </div>
          <p className="text-xs text-muted-foreground">
            Reach these milestones to earn a cash bonus. Keep your streak going: the bonus lands in your wallet once you complete your next collection of ₦100,000 or more.
          </p>
          <div className="space-y-1.5">
            {COLLECTION_BONUS_TIERS.map((t) => (
              <div key={t.threshold} className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{fmtNgn(t.threshold)} collected</span>
                <span className="font-semibold font-mono-num text-accent">+{fmtNgn(t.bonus)}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>



      <Button onClick={handleCreate} disabled={loading} className="w-full gap-2" size="lg">
        {loading ? (
          <><Loader2 className="h-4 w-4 animate-spin" /> Creating...</>
        ) : (
          "Create Collection"
        )}
      </Button>
    </div>
  );
};

export default CreateCollectionPage;
