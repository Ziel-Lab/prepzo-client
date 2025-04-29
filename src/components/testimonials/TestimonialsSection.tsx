"use client";
import { useState, useEffect, useRef } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Card, CardContent } from "@/components/ui/card";
import { Star } from "lucide-react";

type TestimonialProps = {
  quote: string;
  name: string;
  role: string;
  rating: number;
};

const Testimonial = ({ quote, name, role, rating }: TestimonialProps) => {
  return (
    <Card className="border border-border h-full">
      <CardContent className="p-6 flex flex-col h-full">
        <div className="flex mb-4">
          {[...Array(5)].map((_, i) => (
            <Star
              key={i}
              size={18}
              className={i < rating ? "fill-prepzo text-prepzo" : "text-muted"}
            />
          ))}
        </div>
        <blockquote className="text-foreground/80 italic mb-6 flex-grow">
          "{quote}"
        </blockquote>
        <div>
          <p className="font-semibold">{name}</p>
          <p className="text-sm text-foreground/60">{role}</p>
        </div>
      </CardContent>
    </Card>
  );
};

const TestimonialsSection = () => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const testimonials = [
    {
      quote: "Prepzo helped me completely transform my resume. I applied to 5 jobs and got 4 interviews. The voice conversations feel so natural and helpful.",
      name: "Sarah L.",
      role: "Product Manager",
      rating: 5,
    },
    {
      quote: "As a startup founder, I use Prepzo weekly to help me prepare for investor meetings and refine my pitch. It's like having a mentor on-demand.",
      name: "Michael R.",
      role: "Tech Entrepreneur",
      rating: 5,
    },
    {
      quote: "The career dashboard helps me stay on track with my goals. Prepzo's advice for handling difficult team dynamics literally saved my job.",
      name: "Jessica T.",
      role: "Marketing Director",
      rating: 4,
    },
    {
      quote: "I was stuck in my career for years. Prepzo helped me identify my transferable skills and create a plan to switch industries. Now I'm thriving!",
      name: "David W.",
      role: "Financial Analyst",
      rating: 5,
    },
    {
      quote: "The voice interface makes all the difference. I can talk through my career challenges while commuting and get actionable advice.",
      name: "Priya K.",
      role: "Software Engineer",
      rating: 5,
    },
  ];

  return (
    <section id="testimonials" ref={sectionRef} className="py-20 bg-secondary/50">
      <div className="container">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            What Our Users <span className="text-gradient">Say About Us</span>
          </h2>
          <p className="text-lg text-foreground/70 max-w-2xl mx-auto">
            Discover how Prepzo has helped professionals overcome career challenges and achieve their goals.
          </p>
        </div>

        <div className={`fade-in-section ${isVisible ? 'is-visible' : ''}`}>
          <Carousel className="w-full">
            <CarouselContent>
              {testimonials.map((testimonial, index) => (
                <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3 p-2">
                  <Testimonial
                    quote={testimonial.quote}
                    name={testimonial.name}
                    role={testimonial.role}
                    rating={testimonial.rating}
                  />
                </CarouselItem>
              ))}
            </CarouselContent>
            <div className="flex justify-center mt-6 gap-2">
              <CarouselPrevious className="static transform-none mr-2 bg-prepzo/10 text-prepzo hover:bg-prepzo hover:text-white" />
              <CarouselNext className="static transform-none bg-prepzo/10 text-prepzo hover:bg-prepzo hover:text-white" />
            </div>
          </Carousel>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
