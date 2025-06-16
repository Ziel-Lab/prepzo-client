import { Brain, Target, TrendingUp, Crown } from 'lucide-react';

const BeyondToolsSection = () => {
  const benefits = [
    {
      icon: Target,
      title: "Holistic Career Support",
      description: "Comprehensive guidance across all career stages"
    },
    {
      icon: TrendingUp,
      title: "Data-Driven Insights",
      description: "Market intelligence and progress analytics"
    },
    {
      icon: Brain,
      title: "Personalized Growth Strategies",
      description: "Tailored recommendations based on your unique profile"
    },
    {
      icon: Crown,
      title: "Exclusive AI Career Coach",
      description: "One-on-one strategic guidance for paid subscribers"
    }
  ];

  return (
    <section className="py-12 md:py-16 bg-secondary/50">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="text-center mb-8 md:mb-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 mb-4 md:mb-6">
            Beyond the Tools: Intelligent Career Growth
          </h2>
          <p className="text-base text-foreground/70 md:text-lg max-w-5xl mx-auto leading-relaxed">
            While our powerful tools streamline your job search, Prepzo.ai goes further.
            Our advanced AI continually learns from your progress and the market, providing
            intelligent insights and personalized recommendations across all features. For those
            seeking deeper, one-on-one strategic guidance, our AI Career Coach is available
            exclusively to paid subscribers, offering bespoke advice and interactive voice
            conversations to navigate complex career challenges.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {benefits.map((benefit, index) => (
            <div key={index} className="bg-white rounded-lg p-4 md:p-6 text-center hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 md:w-16 md:h-16 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3 md:mb-4">
                <benefit.icon className="w-6 h-6 md:w-8 md:h-8 text-green-600" />
              </div>
              <h3 className="text-base md:text-lg font-semibold text-gray-800 mb-2">
                {benefit.title}
              </h3>
              <p className="text-foreground/70 text-sm">
                {benefit.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BeyondToolsSection;