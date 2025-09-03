"use client";

import React from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mic, Bot } from 'lucide-react';

const TalkToAgentContent = () => {
  return (
    <div className="flex items-center justify-center w-full h-[80vh] bg-gray-50 dark:bg-gray-900/10 rounded-xl">
      <Card className="w-full max-w-2xl text-center shadow-lg border-2 border-dashed border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900/50">
        <CardHeader>
          <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit">
            <Bot className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="mt-4 text-3xl font-bold text-gray-800 dark:text-gray-100">
            AI Agent Coming Soon
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-8 text-lg text-gray-600 dark:text-gray-300">
            We're putting the finishing touches on your personal AI agent. 
            Soon you'll be able to talk to it directly to manage your job search, 
            get interview coaching, and more.
          </p>
          <div className="flex justify-center gap-4">
            <Button size="lg" disabled>
              <Mic className="mr-2 h-5 w-5" />
              Start Voice Chat (Coming Soon)
            </Button>
          </div>
           <p className="mt-8 text-sm text-gray-500 dark:text-gray-400">
             This feature is under active development. Stay tuned!
           </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default TalkToAgentContent;
