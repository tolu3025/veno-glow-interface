import { useState } from "react";
import { Star, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface TransactionFeedbackProps {
  transactionId: string;
  onSubmitted: () => void;
}

const TransactionFeedback = ({ transactionId, onSubmitted }: TransactionFeedbackProps) => {
  const { user } = useAuth();
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!user || rating === 0) return;
    setLoading(true);

    const { error } = await supabase.from("transaction_feedback" as any).insert({
      transaction_id: transactionId,
      user_id: user.id,
      rating,
      comment: comment.trim() || null,
    } as any);

    setLoading(false);
    if (error) {
      if (error.code === "23505") {
        toast.info("You've already rated this transaction");
      } else {
        toast.error("Failed to submit feedback");
      }
      return;
    }
    toast.success("Thanks for your feedback!");
    onSubmitted();
  };

  return (
    <div className="space-y-3 py-2">
      <p className="text-sm font-medium text-center text-muted-foreground">
        How was this transaction?
      </p>
      <div className="flex justify-center gap-1.5">
        {[1, 2, 3, 4, 5].map((i) => (
          <button
            key={i}
            onClick={() => setRating(i)}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(0)}
            className="p-0.5 transition-transform hover:scale-110 active:scale-95"
          >
            <Star
              className={`h-7 w-7 transition-colors ${
                i <= (hovered || rating)
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-muted-foreground/25"
              }`}
            />
          </button>
        ))}
      </div>
      {rating > 0 && (
        <>
          <Textarea
            placeholder="Any comments? (optional)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={2}
            maxLength={500}
            className="text-sm"
          />
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full"
            size="sm"
          >
            {loading && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />}
            {loading ? "Submitting..." : "Submit Feedback"}
          </Button>
        </>
      )}
    </div>
  );
};

export default TransactionFeedback;
