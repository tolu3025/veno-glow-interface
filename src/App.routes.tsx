
import Index from "@/pages/Index";
import Services from "@/pages/Services";
import Contact from "@/pages/Contact";
import About from "@/pages/About";
import Pricing from "@/pages/Pricing";
import Testimonials from "@/pages/Testimonials";
import Portfolio from "@/pages/Portfolio";
import PortfolioItem from "@/pages/PortfolioItem";
import Team from "@/pages/Team";
import TeamMember from "@/pages/TeamMember";
import Faq from "@/pages/Faq";
import Terms from "@/pages/Terms";
import Privacy from "@/pages/Privacy";
import NotFound from "@/pages/NotFound";
import ComingSoon from "@/pages/ComingSoon";
import Maintenance from "@/pages/Maintenance";
import CbtPage from "@/pages/CbtPage";
import CreateTest from "@/pages/cbt/CreateTest";
import PublicLeaderboards from "@/pages/cbt/PublicLeaderboards";

import AiCreateTest from "@/pages/cbt/AiCreateTest";
import PastQuestions from "@/pages/cbt/PastQuestions";
import AiChat from "@/pages/ai-tutorial/AiChat";
import AiResources from "@/pages/ai-tutorial/AiResources";
import LearningTips from "@/pages/ai-tutorial/LearningTips";
import TutorialInfo from "@/pages/TutorialInfo";
import VideoPlayerPage from "@/pages/VideoPlayerPage";

export const routes = [
  {
    path: "/",
    element: <Index />,
  },
  {
    path: "/services",
    element: <Services />,
  },
  {
    path: "/contact",
    element: <Contact />,
  },
  {
    path: "/about",
    element: <About />,
  },
  {
    path: "/pricing",
    element: <Pricing />,
  },
  {
    path: "/testimonials",
    element: <Testimonials />,
  },
  {
    path: "/portfolio",
    element: <Portfolio />,
  },
  {
    path: "/portfolio/:id",
    element: <PortfolioItem />,
  },
  {
    path: "/team",
    element: <Team />,
  },
  {
    path: "/team/:id",
    element: <TeamMember />,
  },
  {
    path: "/faq",
    element: <Faq />,
  },
  {
    path: "/terms",
    element: <Terms />,
  },
  {
    path: "/privacy",
    element: <Privacy />,
  },
  {
    path: "/404",
    element: <NotFound />,
  },
  {
    path: "/coming-soon",
    element: <ComingSoon />,
  },
  {
    path: "/maintenance",
    element: <Maintenance />,
  },

  // CBT Routes
  {
    path: "/cbt",
    element: <CbtPage />,
  },
  {
    path: "/cbt/create",
    element: <CreateTest />,
  },
  {
    path: "/cbt/ai-create",
    element: <AiCreateTest />,
  },
  {
    path: "/cbt/public-leaderboards",
    element: <PublicLeaderboards />,
  },
  {
    path: "/cbt/past-questions",
    element: <PastQuestions />,
  },
  {
    path: "/ai-tutorial/chat",
    element: <AiChat />,
  },
  {
    path: "/ai-tutorial/resources",
    element: <AiResources />,
  },
  {
    path: "/ai-tutorial/learning-tips",
    element: <LearningTips />,
  },
  {
    path: "/ai-tutorial/study-materials",
    element: <TutorialInfo />,
  },
  {
    path: "/ai-tutorial/video-tutorials",
    element: <VideoPlayerPage />,
  },
  {
    path: "*",
    element: <NotFound />,
  },
];
