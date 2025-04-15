
import { useNavigate } from "react-router-dom";
import BannerCarousel from "@/components/home/BannerCarousel";
import FeaturesSection from "@/components/home/FeaturesSection";
import TutorialsSection from "@/components/home/TutorialsSection";
import TestimonialCard from "@/components/home/TestimonialCard";
import CallToAction from "@/components/home/CallToAction";
import BackgroundBubbles from "@/components/home/BackgroundBubbles";
import { bannerSlides, features, tutorials, testimonial } from "@/data/homePageData";

const Index = () => {
  return (
    <div className="pb-6 relative overflow-hidden">
      <BackgroundBubbles />
      <BannerCarousel bannerSlides={bannerSlides} />
      <FeaturesSection features={features} />
      <TutorialsSection tutorials={tutorials} />
      <TestimonialCard quote={testimonial.quote} author={testimonial.author} />
      <CallToAction />
    </div>
  );
};

export default Index;
