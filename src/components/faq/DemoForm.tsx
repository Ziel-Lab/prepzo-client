"use client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useState } from "react";

// Define props for DemoForm
interface DemoFormProps {
  onOpenAgentModal: () => void; // Add the new prop type
}

const DemoForm: React.FC<DemoFormProps> = ({ onOpenAgentModal }) => { // Destructure the prop
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const faqs = [{
    question: "How long is the demo session?",
    answer: "Each demo session is 20 minutes long, designed to give you a quick but comprehensive overview of Prepzo's AI voice guidance capabilities."
  }, {
    question: "What will I learn in the demo?",
    answer: "You'll experience firsthand how Prepzo's AI provides personalized career guidance, interview preparation tips, and professional development strategies."
  }, {
    question: "Is the demo really free?",
    answer: "Yes, the demo is completely free with no obligations. It's our way of showing you the value Prepzo can bring to your career journey."
  }, {
    question: "How soon can I start after the demo?",
    answer: "You can start using Prepzo immediately after the demo if you choose to sign up. We'll help you get set up right away."
  }];
  return <div className="container py-12 sm:py-20">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div>
          <div className="mb-6">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to <span className="text-gradient">Transform</span> Your Career?
            </h2>
            <p className="text-lg text-foreground/70 mb-6">Get your free 20-minute demo call with Prepzo and experience how AI voice guidance can help you overcome your professional challenges.</p>
            
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-prepzo text-white flex items-center justify-center font-bold">1</div>
                <p>Register for a free 20-minute demo call</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-prepzo text-white flex items-center justify-center font-bold">2</div>
                <p>Experience Prepzo's AI voice guidance firsthand</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-prepzo text-white flex items-center justify-center font-bold">3</div>
                <p>Get a taste of personalized career advice</p>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 mt-[80px]">
                <Button size="lg" variant="outline" className="border-prepzo text-prepzo hover:bg-prepzo hover:text-white">
                  Join Waitlist
                </Button>
                <Button 
                  size="lg" 
                  className="bg-prepzo hover:bg-prepzo-light text-white"
                  onClick={onOpenAgentModal} // Use the prop here
                >
                  Try Demo
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        <Card className="border-prepzo/20 shadow-lg">
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
    </div>;
};
export default DemoForm;