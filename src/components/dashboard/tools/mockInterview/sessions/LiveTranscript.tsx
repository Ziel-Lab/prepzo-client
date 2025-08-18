"use client";

import React, { useEffect, useRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';

// Update interface to match the new message format
interface InterviewTranscriptionMessage {
  id: string;
  type: "agent" | "user";
  content: string;
  timestamp: Date;
}

interface LiveTranscriptProps {
  messages: InterviewTranscriptionMessage[];
  compact?: boolean;
}

const LiveTranscript: React.FC<LiveTranscriptProps> = ({ messages, compact = false }) => {
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  }, [messages]);

  const formatTime = (timestamp: Date) => {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={`${compact ? 'bg-transparent' : 'bg-white rounded-lg shadow-sm border border-gray-200'} h-full flex flex-col`}>
      {/* Header - Only show in non-compact mode */}
      {!compact && (
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 rounded-t-lg">
          <h3 className="text-sm font-semibold text-gray-800">Live Transcript</h3>
          <p className="text-xs text-gray-500">Real-time conversation</p>
        </div>
      )}

      {/* Messages */}
      <ScrollArea ref={scrollAreaRef} className={`flex-1 ${compact ? 'p-2' : 'p-4'}`}>
        <div className={compact ? "space-y-2" : "space-y-4"}>
          {messages.length === 0 ? (
            <div className={`text-center ${compact ? 'text-white/60' : 'text-gray-500'} text-sm`}>
              Conversation will appear here...
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                className={`flex flex-col ${
                  message.type === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                <div
                  className={`max-w-[80%] ${compact ? 'px-2 py-1' : 'px-3 py-2'} rounded-lg ${compact ? 'text-xs' : 'text-sm'} ${
                    message.type === 'user'
                      ? compact 
                        ? 'bg-blue-500/80 text-white rounded-br-sm backdrop-blur-sm' 
                        : 'bg-blue-500 text-white rounded-br-sm'
                      : compact 
                        ? 'bg-white/20 text-white rounded-bl-sm backdrop-blur-sm' 
                        : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                  }`}
                >
                  <p className="leading-relaxed whitespace-pre-wrap">{message.content}</p>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-xs ${compact ? 'text-white/60' : 'text-gray-400'}`}>
                    {message.type === 'user' ? 'You' : 'AI Interviewer'}
                  </span>
                  <span className={`text-xs ${compact ? 'text-white/60' : 'text-gray-400'}`}>
                    {formatTime(message.timestamp)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default LiveTranscript;
