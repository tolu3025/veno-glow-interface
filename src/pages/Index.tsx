
import { useNavigate } from "react-router-dom";
import BannerCarousel from "@/components/home/BannerCarousel";
import CallToAction from "@/components/home/CallToAction";
import BackgroundBubbles from "@/components/home/BackgroundBubbles";
import { WelcomeModal } from "@/components/home/WelcomeModal";
import { PopularTests } from "@/components/home/PopularTests";
import { bannerSlides } from "@/data/homePageData";
import { BookOpen, Sparkles, Gamepad2, FileUp } from "lucide-react";

const actionCards = [
  {
    title: "Take a Test",
    description: "Practice with thousands of CBT questions across multiple subjects.",
    icon: BookOpen,
    href: "/cbt",
    gradient: "from-primary to-primary/80",
  },
  {
    title: "AI Study Assistant",
    description: "Get instant help, generate questions, and solve problems with AI.",
    icon: Sparkles,
    href: "/ai-assistant",
    gradient: "from-pink-500 to-rose-500",
  },
  {
    title: "Challenge Friends",
    description: "Compete in real-time PvP battles and climb the leaderboard.",
    icon: Gamepad2,
    href: "/cbt/streak-challenge",
    gradient: "from-green-500 to-emerald-500",
  },
];

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="pb-6 relative overflow-hidden">
      <BackgroundBubbles />
      <WelcomeModal />

      {/* Hero Section */}
      <section className="relative pt-8 pb-12">
        <div className="container">
          <BannerCarousel bannerSlides={bannerSlides} />
        </div>
      </section>

      {/* 3 Action Cards */}
      <section className="py-10">
        <div className="container">
          <h2 className="text-2xl font-bold text-center mb-8">Get Started</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-4xl mx-auto">
            {actionCards.map((card) => (
              <button
                key={card.title}
                onClick={() => navigate(card.href)}
                className="group relative rounded-2xl p-6 text-left transition-all hover:scale-[1.03] active:scale-[0.98] bg-card border border-border shadow-sm hover:shadow-lg"
              >
                <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center mb-4`}>
                  <card.icon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold mb-1">{card.title}</h3>
                <p className="text-sm text-muted-foreground">{card.description}</p>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Tests */}
      <PopularTests />

      {/* Course Materials Section */}
      <section className="py-10">
        <div className="container">
          <div className="max-w-2xl mx-auto">
            <button
              onClick={() => navigate("/cbt/course-material-test")}
              className="w-full group relative rounded-2xl p-8 text-left transition-all hover:scale-[1.02] active:scale-[0.98] bg-card border border-border shadow-sm hover:shadow-lg"
            >
              <div className="flex items-center gap-5">
                <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center shrink-0">
                  <FileUp className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold mb-1">Course Materials</h3>
                  <p className="text-sm text-muted-foreground">
                    Upload your course material and generate practice tests instantly with AI.
                  </p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-12">
        <div className="container">
          <CallToAction />
        </div>
      </section>
    </div>
  );
};

export default Index;
