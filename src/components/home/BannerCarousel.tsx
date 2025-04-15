
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";

interface BannerSlide {
  title: string;
  subtitle: string;
  background: string;
  primaryButton: { text: string; link: string };
  secondaryButton: { text: string; link: string };
}

interface BannerCarouselProps {
  bannerSlides: BannerSlide[];
}

const BannerCarousel = ({ bannerSlides }: BannerCarouselProps) => {
  const navigate = useNavigate();
  
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="relative rounded-2xl overflow-hidden mb-10"
    >
      <Carousel autoplay={true} autoplayInterval={5000} showControls={false} className="h-[400px] md:h-[500px]">
        <CarouselContent>
          {bannerSlides.map((slide, index) => (
            <CarouselItem key={index}>
              <div className={`${slide.background} h-[400px] md:h-[500px] flex items-center`}>
                <div className="container relative z-20">
                  <div className="max-w-xl text-white">
                    <motion.div 
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.2 }}
                    >
                      <h1 className="text-4xl md:text-6xl font-bold mb-4 font-heading">
                        {slide.title.split(' ').map((word, i) => (
                          <span key={i} className={i % 2 === 1 ? "text-veno-accent" : ""}>
                            {word}{' '}
                          </span>
                        ))}
                      </h1>
                      <p className="text-lg md:text-xl opacity-90 mb-8 leading-relaxed">
                        {slide.subtitle}
                      </p>
                      <div className="flex flex-wrap gap-4">
                        <Button 
                          size="lg" 
                          onClick={() => navigate(slide.primaryButton.link)}
                          className="bg-white text-veno-primary hover:bg-white/90"
                        >
                          {slide.primaryButton.text}
                        </Button>
                        <Button 
                          size="lg"
                          variant="outline"
                          onClick={() => navigate(slide.secondaryButton.link)}
                          className="bg-transparent border-white text-white hover:bg-white/20"
                        >
                          {slide.secondaryButton.text}
                        </Button>
                      </div>
                    </motion.div>
                  </div>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </motion.div>
  );
};

export default BannerCarousel;
