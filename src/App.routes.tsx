import { Home } from "@/pages/Home";
import { Services } from "@/pages/Services";
import { Contact } from "@/pages/Contact";
import { About } from "@/pages/About";
import { Pricing } from "@/pages/Pricing";
import { Blog } from "@/pages/Blog";
import { BlogArticle } from "@/pages/BlogArticle";
import { Testimonials } from "@/pages/Testimonials";
import { Portfolio } from "@/pages/Portfolio";
import { PortfolioItem } from "@/pages/PortfolioItem";
import { Team } from "@/pages/Team";
import { TeamMember } from "@/pages/TeamMember";
import { Faq } from "@/pages/Faq";
import { Terms } from "@/pages/Terms";
import { Privacy } from "@/pages/Privacy";
import { NotFound } from "@/pages/NotFound";
import { ComingSoon } from "@/pages/ComingSoon";
import { Maintenance } from "@/pages/Maintenance";
import { CbtPage } from "@/pages/CbtPage";
import { CreateTest } from "@/pages/cbt/CreateTest";
import { PublicLeaderboards } from "@/pages/cbt/PublicLeaderboards";
import { QuestionBank } from "@/pages/cbt/QuestionBank";
import AiCreateTest from "@/pages/cbt/AiCreateTest";

export const routes = [
  {
    path: "/",
    element: <Home />,
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
    path: "/blog",
    element: <Blog />,
  },
  {
    path: "/blog/:id",
    element: <BlogArticle />,
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
    path: "/cbt/question-bank",
    element: <QuestionBank />,
  },
  {
    path: "*",
    element: <NotFound />,
  },
];
