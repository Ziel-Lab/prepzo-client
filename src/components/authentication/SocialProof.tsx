import { Star } from "lucide-react";
import { useEffect, useState } from "react";

interface Testimonial {
  quote: string;
  author: string;
  role: string;
  company?: string;
  rating: number;
}

const testimonials: Testimonial[] = [
  {
    quote: "Prepzo helped me land my Google PM offer after just 3 weeks!",
    author: "Sarah K.",
    role: "Product Manager",
    company: "Google",
    rating: 5,
  },
  {
    quote: "The AI feedback was incredibly accurate. I improved my interview scores by 60% in just two weeks.",
    author: "Michael T.",
    role: "Software Engineer",
    company: "Meta",
    rating: 4,
  },
  {
    quote: "Best investment I made for my career. The mock interviews felt so real!",
    author: "Priya S.",
    role: "Data Scientist",
    company: "Amazon",
    rating: 3,
  },
  {
    quote: "I went from nervous wreck to confident professional. Landed my dream role at McKinsey.",
    author: "James L.",
    role: "Consultant",
    company: "McKinsey",
    rating: 4,
  },
  {
    quote: "The industry-specific questions were exactly what I needed. Highly recommend!",
    author: "Emma R.",
    role: "UX Designer",
    company: "Apple",
    rating: 4,
  },
];
const SocialProof = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % testimonials.length);
        setIsAnimating(false);
      }, 300);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const testimonial = testimonials[currentIndex];

  return (
    <div className="bg-white/5 backdrop-blur-sm rounded-lg p-6 border border-white/10">
      <div className="flex items-center justify-between mb-4">
        <p className="text-white/80 text-sm font-medium">What Users Say:</p>
        <div className="flex gap-1.5">
          {testimonials.map((_, index) => (
            <button
              key={index}
              onClick={() => {
                setIsAnimating(true);
                setTimeout(() => {
                  setCurrentIndex(index);
                  setIsAnimating(false);
                }, 300);
              }}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index === currentIndex 
                  ? "bg-yellow-400 w-6" 
                  : "bg-white/40 hover:bg-white/60"
              }`}
              aria-label={`Go to review ${index + 1}`}
            />
          ))}
        </div>
      </div>
      
      <div 
        className={`transition-all duration-300 ease-out ${
          isAnimating 
            ? "opacity-0 translate-x-4" 
            : "opacity-100 translate-x-0"
        }`}
      >
        <div className="flex gap-1 mb-4 h-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star
              key={i}
              className={`w-6 h-6 drop-shadow-sm ${
                i < testimonial.rating 
                  ? "text-yellow-400" 
                  : "text-white/20"
              }`}
              fill={i < testimonial.rating ? "#FFD700" : "none"}
            />
          ))}
        </div>
        
        <blockquote className="text-white text-lg italic mb-3 leading-relaxed h-24 flex items-start">
          "{testimonial.quote}"
        </blockquote>
        
        <div className="text-white/90">
          <span className="font-medium">{testimonial.author}</span>
          <span className="text-white/60">
            , {testimonial.role}
            {testimonial.company && ` at ${testimonial.company}`}
          </span>
        </div>
      </div>
    </div>
  );
};

export default SocialProof;