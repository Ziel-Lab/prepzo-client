"use client"; 
import { useState, useEffect, useRef } from "react";
import { Telescope, UserSearch, ChartNoAxesCombined } from "lucide-react";

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
      {/* <p><span>Key</span></p> */}
    </div>
  );
};

const FeaturesSection = () => {
  const features = [
    {
      icon: Telescope,
      title: "Discover Your Perfect Role, Effortlessly.",
      description: "Navigate millions of job openings with intelligent search filters, personalized recommendations, and a seamless application tracking system. Prepzo.ai helps you find opportunities that truly match your skills and aspirations, and keeps you organized every step of the way."
    },
    {
      icon: UserSearch,
      title: "Craft Applications That Get Noticed.",
      description: "Generate professional, ATS-friendly resumes and compelling cover letters tailored to specific job descriptions. Our AI analyzes job requirements to optimize your documents with relevant keywords, ensuring your application stands out to hiring managers."
    },
    {
      icon: ChartNoAxesCombined,
      title: "Elevate Your Professional Brand.",
      description: "Transform your LinkedIn profile into a powerful networking and job-seeking asset. Prepzo.ai provides actionable insights and AI-driven suggestions to optimize your headline, summary, experience, and skills, attracting recruiters and expanding your professional network."
    },
    // {
    //   icon: User,
    //   title: "Personalized Insights",
    //   description: "Receive tailored strategies based on your unique strengths, weaknesses, and professional goals."
    // }
  ];

  return (
    <section id="features" className="py-20 bg-secondary/50">
      <div className="container">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
          Your Path to <span className="text-gradient">Career Advancement </span>Starts Here
          </h2>
          <p className="text-lg text-foreground/70 max-w-2xl mx-auto">
            Prepzo combines AI voice technology with career expertise to provide guidance when you need it most.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
