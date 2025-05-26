"use client";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FilePlus, ArrowRight, ArrowLeft, Upload, Sparkles } from "lucide-react";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";

type JobData = {
  jobPostUrl: string;
  jobTitle: string;
  companyName: string;
  companyUrl: string;
  jobDescription: string;
  salary: string;
  resume: File | null;
  coverLetter: File | null;
};

interface NewApplicationDialogProps {
  trigger?: React.ReactNode;
}

const NewApplicationDialog = ({ trigger }: NewApplicationDialogProps) => {
  const [step, setStep] = useState(1);
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const totalSteps = 3;
  
  const form = useForm<JobData>({
    defaultValues: {
      jobPostUrl: "",
      jobTitle: "",
      companyName: "",
      companyUrl: "",
      jobDescription: "",
      salary: "",
      resume: null,
      coverLetter: null,
    },
  });

  const goToNextStep = () => {
    if (step === 1) {
      // In a real implementation, we would fetch job data from the URL here
      setIsLoading(true);
      // Simulate loading
      setTimeout(() => {
        setIsLoading(false);
        setStep(step + 1);
      }, 1500);
    } else {
      setStep(step + 1);
    }
  };

  const goToPreviousStep = () => {
    setStep(step - 1);
  };

  const handleSubmit = (data: JobData) => {
    setOpen(false);
    setStep(1);
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: "resume" | "coverLetter") => {
    if (e.target.files && e.target.files[0]) {
      form.setValue(field, e.target.files[0]);
    }
  };

  const optimizeDocument = (type: "resume" | "coverLetter") => {
    console.log(`Optimizing ${type}...`);
    // This would connect to AI optimization service
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="bg-[#9b87f5] hover:bg-[#7E69AB] text-white">
            <FilePlus className="mr-2 h-4 w-4" />
            New Application
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {step === 1 && "Add Job URL"}
            {step === 2 && "Job Details"}
            {step === 3 && "Resume & Cover Letter"}
          </DialogTitle>
          <Progress value={(step / totalSteps) * 100} className="mt-2" />
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Step 1: Job URL */}
            {step === 1 && (
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="jobPostUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Job Post URL</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="https://example.com/job-posting" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <p className="text-sm text-gray-500">
                  Paste the URL of the job posting. We'll attempt to fetch the details automatically.
                </p>
              </div>
            )}

            {/* Step 2: Job Details */}
            {step === 2 && (
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="jobTitle"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Job Title</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Senior Developer" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="companyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Acme Corp" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="companyUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company Website</FormLabel>
                      <FormControl>
                        <Input placeholder="https://company.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="salary"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Salary Range (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., $80,000 - $100,000" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="jobDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Job Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Paste the job description here..." 
                          className="min-h-[150px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Step 3: Resume & Cover Letter Upload */}
            {step === 3 && (
              <div className="space-y-6">
                <div className="space-y-4">
                  <Label>Resume</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border rounded-md p-4 flex flex-col items-center justify-center min-h-[120px] text-center">
                      <Upload className="h-8 w-8 text-gray-400 mb-2" />
                      <p className="text-sm text-gray-500 mb-2">Upload your resume</p>
                      <Input 
                        type="file" 
                        accept=".pdf,.doc,.docx"
                        className="max-w-[200px]"
                        onChange={(e) => onFileChange(e, "resume")}
                      />
                      <p className="text-xs text-gray-400 mt-1">
                        {form.watch("resume")?.name || "No file chosen"}
                      </p>
                    </div>
                    
                    <div className="border border-dashed rounded-md p-4 flex flex-col items-center justify-center min-h-[120px] text-center">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => optimizeDocument("resume")}
                        className="gap-2"
                      >
                        <Sparkles className="h-4 w-4" />
                        Optimize Resume with Prepzo
                      </Button>
                      <p className="text-xs text-gray-500 mt-2">
                        AI-powered resume optimization for better ATS match
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <Label>Cover Letter</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="border rounded-md p-4 flex flex-col items-center justify-center min-h-[120px] text-center">
                      <Upload className="h-8 w-8 text-gray-400 mb-2" />
                      <p className="text-sm text-gray-500 mb-2">Upload your cover letter</p>
                      <Input 
                        type="file" 
                        accept=".pdf,.doc,.docx"
                        className="max-w-[200px]"
                        onChange={(e) => onFileChange(e, "coverLetter")}
                      />
                      <p className="text-xs text-gray-400 mt-1">
                        {form.watch("coverLetter")?.name || "No file chosen"}
                      </p>
                    </div>
                    
                    <div className="border border-dashed rounded-md p-4 flex flex-col items-center justify-center min-h-[120px] text-center">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => optimizeDocument("coverLetter")}
                        className="gap-2"
                      >
                        <Sparkles className="h-4 w-4" />
                        Optimize Cover Letter
                      </Button>
                      <p className="text-xs text-gray-500 mt-2">
                        AI-powered cover letter tailored to the job description
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter className="gap-2 sm:gap-0">
              {step > 1 && (
                <Button type="button" variant="outline" onClick={goToPreviousStep}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
              )}
              
              {step < totalSteps ? (
                <Button 
                  type="button" 
                  onClick={goToNextStep}
                  disabled={isLoading || (step === 1 && !form.watch('jobPostUrl'))}
                >
                  {isLoading ? (
                    <span className="flex items-center">
                      Loading... <span className="animate-spin ml-2">⏳</span>
                    </span>
                  ) : (
                    <>
                      Next <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              ) : (
                <Button type="submit">Submit Application</Button>
              )}
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default NewApplicationDialog;
