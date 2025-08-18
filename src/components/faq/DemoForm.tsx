"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useState,useEffect } from "react";
import Link from "next/link";
import { createClient } from '@/utils/supabase/client';

// Define props for DemoForm
interface DemoFormProps {
  onOpenAgentModal: () => void; // Add the new prop type
}

const DemoForm: React.FC<DemoFormProps> = ({ onOpenAgentModal }) => { // Destructure the prop
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authStatusLoading, setAuthStatusLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    const checkUserSession = async () => {
      setAuthStatusLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
      setAuthStatusLoading(false);
    };

    checkUserSession();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setIsAuthenticated(!!session);
      setAuthStatusLoading(false);
    });

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [supabase]);

  const faqs = [{
    question: "Do I need a credit card to sign up for Prepzo?",
    answer: "No, you don't need a credit card to Sign up for Prepzo. The free account gives you limited access to our career tools, so you can experience Prepzo first hand before making a paid commitment."
  }, {
    question: "What features are available in the free account?",
    answer: "You can access our Resume Optimization tool, Cover Letter Generation Tool, and Prepzo Voice Career Guide in the free plan."
  }, {
    question: "What do I get in the paid plans?",
    answer: "With a paid plan, you can also search for jobs on the biggest job database from around the world. Check your Job Match Score for the shortlisted jobs and get many credits to use Prepzo Career Tools."
  }, {
    question: "Do you have a money-back guarantee?",
    answer: "Yes, we do. If you do not get a job or the goal that you established in the beginning with Prepzo, we offer a 3 month money-back guarantee. Please read our terms & conditions."
  }];
  return (
    <section className="bg-white w-full py-12 sm:py-20" id="faq">
      <div className="container mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center px-4">
        <div>
          <div className="mb-6">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to <span className="text-gradient">Transform</span> Your Career?
            </h2>
            <p className="text-lg text-foreground/70 mb-6">Sign up for a free account on Prepzo and experience how our career tools can accelerate your job search, career growth and development. </p>
            
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-prepzo text-white flex items-center justify-center font-bold">1</div>
                <p>Register for a free account</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-prepzo text-white flex items-center justify-center font-bold">2</div>
                <p>Answer simple questions</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-prepzo text-white flex items-center justify-center font-bold">3</div>
                <p>Utilize one and many Prepzo career tools crafted for you.</p>
              </div>
              
              <div className="mt-8 flex flex-col sm:flex-row gap-3 sm:gap-4 w-full sm:w-auto">
                <Link href={isAuthenticated ? "/dashboard" : "/auth/sign-up"}>
                  <Button size="lg" className="bg-prepzo hover:bg-prepzo-light text-white w-full sm:w-auto">
                    Get Started
                  </Button>
                </Link>
                {/* <Button 
                  size="lg" 
                  className="bg-prepzo hover:bg-prepzo-light text-white w-full sm:w-auto"
                  onClick={onOpenAgentModal}
                >
                  Try Demo
                </Button> */}
              </div>
            </div>
          </div>
        </div>
        
        <Card className="border-prepzo/20 shadow-lg" >
          <CardHeader>
            <CardTitle>Frequently Asked Questions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {faqs.map((faq, index) => <Collapsible key={index} open={openFaq === index} onOpenChange={() => setOpenFaq(openFaq === index ? null : index)}>
                <CollapsibleTrigger className="flex justify-between w-full py-2 text-left font-medium hover:text-prepzo">
                  {faq.question}
                </CollapsibleTrigger>
                <CollapsibleContent className="py-2 px-2 text-muted-foreground">
                  {faq.answer}
                </CollapsibleContent>
              </Collapsible>)}
          </CardContent>
        </Card>
      </div>
    </section>
  );
};
export default DemoForm;