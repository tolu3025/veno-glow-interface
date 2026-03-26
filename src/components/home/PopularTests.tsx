import { useNavigate } from "react-router-dom";
import { useSubjects } from "@/hooks/useSubjects";
import { BookOpen, ArrowRight, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export const PopularTests = () => {
  const navigate = useNavigate();
  const { data: subjects, isLoading } = useSubjects();

  // Take the top 6 subjects by question count
  const popularSubjects = (subjects || [])
    .sort((a, b) => b.question_count - a.question_count)
    .slice(0, 6);

  if (isLoading) {
    return (
      <section className="py-10">
        <div className="container">
          <h2 className="text-2xl font-bold text-center mb-8">Popular Tests</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-w-3xl mx-auto">
            {[...Array(6)].map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (popularSubjects.length === 0) return null;

  return (
    <section className="py-10">
      <div className="container">
        <div className="flex items-center justify-center gap-2 mb-8">
          <TrendingUp className="h-5 w-5 text-primary" />
          <h2 className="text-2xl font-bold text-center">Popular Tests</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-w-3xl mx-auto">
          {popularSubjects.map((subject) => (
            <button
              key={subject.name}
              onClick={() => navigate(`/cbt?subject=${encodeURIComponent(subject.name)}`)}
              className="group rounded-xl p-4 text-left transition-all hover:scale-[1.03] active:scale-[0.98] bg-card border border-border hover:border-primary/30 hover:shadow-md"
            >
              <div className="flex items-start justify-between mb-2">
                <BookOpen className="h-5 w-5 text-primary/70" />
                <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <h3 className="text-sm font-semibold truncate">{subject.name}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {subject.question_count} questions
              </p>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};
