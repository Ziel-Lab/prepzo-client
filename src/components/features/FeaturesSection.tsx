"use client"; 
import { useState, useEffect, useRef } from "react";
import { MessageSquare, Book, Calendar, User } from "lucide-react";

type FeatureCardProps = {
  icon: React.ElementType;
  title: string;
  description: string;
  index: number;
};

const FeatureCard = ({ icon: Icon, title, description, index }: FeatureCardProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

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

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div 
      ref={ref} 
      className={`fade-in-section ${isVisible ? 'is-visible' : ''} p-6 rounded-xl border border-border bg-card hover:shadow-md transition-all duration-300`}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      <div className="w-12 h-12 bg-prepzo/10 text-prepzo rounded-lg flex items-center justify-center mb-4">
        <Icon size={24} />
      </div>
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-foreground/70">{description}</p>
    </div>
  );
};

const FeaturesSection = () => {
  const features = [
    {
      icon: MessageSquare,
      title: "Voice Conversations",
      description: "Talk naturally with Prepzo about your career challenges and receive personalized guidance through voice interaction."
    },
    {
      icon: Book,
      title: "Resume & Cover Letter",
      description: "Get expert help crafting the perfect resume and cover letters tailored to specific job applications."
    },
    {
      icon: Calendar,
      title: "Career Dashboard",
      description: "Track your progress, applications, and growth areas with a personalized career development dashboard."
    },
    {
      icon: User,
      title: "Personalized Insights",
      description: "Receive tailored strategies based on your unique strengths, weaknesses, and professional goals."
    }
  ];

  return (
    <section id="features" className="py-20 bg-secondary/50">
      <div className="container">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Your Career Assistant with <span className="text-gradient">Voice Intelligence</span>
          </h2>
          <p className="text-lg text-foreground/70 max-w-2xl mx-auto">
            Prepzo combines AI voice technology with career expertise to provide guidance when you need it most.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <FeatureCard 
              key={index}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
              index={index}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
