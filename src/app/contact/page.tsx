"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building, HandshakeIcon, School } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { useEffect, useState } from "react";

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  organization: z.string().min(2, "Organization must be at least 2 characters"),
  inquiryType: z.enum(["corporate", "education", "investor", "other"]),
  message: z.string().min(10, "Message must be at least 10 characters")
});

const ContactPage = () => {
  const { toast } = useToast();
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      organization: "",
      inquiryType: "corporate",
      message: ""
    }
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(values),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to send message. Please try again.");
      }

      toast({
        title: "Message sent!",
        description: "We'll get back to you as soon as possible.",
      });
      form.reset();
    } catch (error: any) {
      console.error("Submission error:", error);
      toast({
        title: "Error Sending Message",
        description: error.message || "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-background">
      <div className="container py-12">
        <div className="max-w-3xl mx-auto">
          <div className="mb-8">
            <Link href="/">
              <Button variant="ghost" className="mb-4">
                ← Back to Home
              </Button>
            </Link>
            <h1 className="text-4xl font-bold mb-4">Contact Us</h1>
            <p className="text-muted-foreground text-left mb-8">
              Get in touch with us to discuss partnerships and opportunities
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
             <div className="flex flex-col items-center p-6 rounded-lg border bg-card">
               <Building className="w-8 h-8 mb-4 text-prepzo" />
               <h3 className="font-semibold mb-2">Corporate Partnerships</h3>
               <p className="text-sm text-center text-muted-foreground">
                 Make Prepzo your organization's internal mentor.
               </p>
             </div>
             <div className="flex flex-col items-center p-6 rounded-lg border bg-card">
               <School className="w-8 h-8 mb-4 text-prepzo" />
               <h3 className="font-semibold mb-2">Educational Institutions</h3>
               <p className="text-sm text-center text-muted-foreground">
                 We partner with universities to offer Prepzo to students.
               </p>
             </div>
             <div className="flex flex-col items-center p-6 rounded-lg border bg-card">
               <HandshakeIcon className="w-8 h-8 mb-4 text-prepzo" />
               <h3 className="font-semibold mb-2">Investors</h3>
               <p className="text-sm text-center text-muted-foreground">
                 Discover investment opportunities at Prepzo.
               </p>
             </div>
           </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <FormField control={form.control} name="name" render={({
                 field
               }) => <FormItem>
                       <FormLabel>Name</FormLabel>
                       <FormControl>
                         <Input placeholder="Your name" {...field} />
                       </FormControl>
                       <FormMessage />
                     </FormItem>} />
                 <FormField control={form.control} name="email" render={({
                 field
               }) => <FormItem>
                       <FormLabel>Email</FormLabel>
                       <FormControl>
                         <Input placeholder="Your email" {...field} />
                       </FormControl>
                       <FormMessage />
                     </FormItem>} />
               </div>
 
               <FormField control={form.control} name="organization" render={({
               field
             }) => <FormItem>
                     <FormLabel>Organization</FormLabel>
                     <FormControl>
                       <Input placeholder="Your organization" {...field} />
                     </FormControl>
                     <FormMessage />
                   </FormItem>} />
 
               <FormField control={form.control} name="inquiryType" render={({
               field
             }) => <FormItem>
                     <FormLabel>Inquiry Type</FormLabel>
                     <Select onValueChange={field.onChange} defaultValue={field.value}>
                       <FormControl>
                         <SelectTrigger>
                           <SelectValue placeholder="Select inquiry type" />
                         </SelectTrigger>
                       </FormControl>
                       <SelectContent>
                         <SelectItem value="corporate">Corporate Partnership</SelectItem>
                         <SelectItem value="education">Educational Institution</SelectItem>
                         <SelectItem value="investor">Investor</SelectItem>
                         <SelectItem value="other">Other</SelectItem>
                       </SelectContent>
                     </Select>
                     <FormMessage />
                   </FormItem>} />
 
               <FormField control={form.control} name="message" render={({
               field
             }) => <FormItem>
                     <FormLabel>Message</FormLabel>
                     <FormControl>
                       <Textarea placeholder="Tell us about your interest..." className="min-h-[120px]" {...field} disabled={isSubmitting} />
                     </FormControl>
                     <FormMessage />
                   </FormItem>} />
 
               <Button type="submit" className="w-full bg-prepzo hover:bg-prepzo-light" disabled={isSubmitting}>
                 {isSubmitting ? "Sending..." : "Send Message"}
               </Button>
             </form>
           </Form>
        </div>
      </div>
    </div>
  );
};

export default ContactPage; 