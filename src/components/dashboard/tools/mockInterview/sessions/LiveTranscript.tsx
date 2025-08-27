"use client";

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChevronDown } from 'lucide-react';

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
  const [isUserScrolled, setIsUserScrolled] = useState(false);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [messagesLength, setMessagesLength] = useState(messages.length);
  const lastScrollTop = useRef(0);

  // Check if user has scrolled up manually
  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    const scrollElement = event.currentTarget;
    const { scrollTop, scrollHeight, clientHeight } = scrollElement;
    
    // Consider user at bottom if within 50px of bottom
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
    
    // If user scrolled up from the bottom, they're manually controlling scroll
    if (scrollTop < lastScrollTop.current && !isAtBottom) {
      setIsUserScrolled(true);
      setShowScrollToBottom(true);
    } else if (isAtBottom) {
      setIsUserScrolled(false);
      setShowScrollToBottom(false);
    }
    
    lastScrollTop.current = scrollTop;
  }, []);

  // Auto-scroll to bottom only if user hasn't manually scrolled up
  useEffect(() => {
    // Only auto-scroll if new messages were added and user hasn't manually scrolled
    if (messages.length > messagesLength && !isUserScrolled) {
      const scrollElement = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollElement) {
        // Use smooth scrolling for a better UX
        scrollElement.scrollTo({
          top: scrollElement.scrollHeight,
          behavior: 'smooth'
        });
      }
    }
    setMessagesLength(messages.length);
  }, [messages, isUserScrolled, messagesLength]);

  // Scroll to bottom function
  const scrollToBottom = useCallback(() => {
    const scrollElement = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
    if (scrollElement) {
      scrollElement.scrollTo({
        top: scrollElement.scrollHeight,
        behavior: 'smooth'
      });
      setIsUserScrolled(false);
      setShowScrollToBottom(false);
    }
  }, []);

  const formatTime = (timestamp: Date) => {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={`${compact ? 'bg-transparent' : 'bg-white rounded-lg shadow-sm border border-gray-200'} h-full flex flex-col relative`}>
      {/* Header - Only show in non-compact mode */}
      {!compact && (
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 rounded-t-lg">
          <h3 className="text-sm font-semibold text-gray-800">Live Transcript</h3>
          <p className="text-xs text-gray-500">Real-time conversation</p>
        </div>
      )}

      {/* Messages */}
      <ScrollArea 
        ref={scrollAreaRef} 
        className={`flex-1 ${compact ? 'p-2' : 'p-4'}`}
        onScrollCapture={handleScroll}
      >
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

      {/* Scroll to Bottom Button */}
      {showScrollToBottom && (
        <button
          onClick={scrollToBottom}
          className={`absolute bottom-4 right-4 z-10 w-10 h-10 rounded-full shadow-lg transition-all duration-200 hover:scale-110 ${
            compact 
              ? 'bg-white/20 backdrop-blur-sm text-white hover:bg-white/30 border border-white/30' 
              : 'bg-blue-500 text-white hover:bg-blue-600 shadow-blue-500/25'
          }`}
          title="Scroll to bottom"
        >
          <ChevronDown size={16} className="mx-auto" />
        </button>
      )}
    </div>
  );
};

export default LiveTranscript;
