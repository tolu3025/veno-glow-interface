
import React from "react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import { motion } from "framer-motion";

interface Testimonial {
  quote: string;
  author: {
    name: string;
    image: string;
    role: string;
  };
}

interface TestimonialSliderProps {
  testimonials: Testimonial[];
}

const TestimonialSlider: React.FC<TestimonialSliderProps> = ({ testimonials }) => {
  return (
    <Carousel autoplay={true} autoplayInterval={7000} showControls={false} className="w-full">
      <CarouselContent>
        {testimonials.map((testimonial, index) => (
          <CarouselItem key={index}>
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center max-w-3xl mx-auto px-4"
            >
              <p className="text-lg font-handwriting text-veno-secondary mb-6">What Our Users Say</p>
              <blockquote className="text-xl md:text-2xl italic mb-6">
                "{testimonial.quote}"
              </blockquote>
              <div className="flex items-center justify-center">
                <Avatar className="w-12 h-12 rounded-full border-2 border-veno-primary mr-4">
                  <AvatarImage src={testimonial.author.image} alt={testimonial.author.name} />
                  <AvatarFallback>{testimonial.author.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                </Avatar>
                <div className="text-left">
                  <p className="font-semibold">{testimonial.author.name}</p>
                  <p className="text-sm text-muted-foreground">{testimonial.author.role}</p>
                </div>
              </div>
            </motion.div>
          </CarouselItem>
        ))}
      </CarouselContent>
    </Carousel>
  );
};

export default TestimonialSlider;
