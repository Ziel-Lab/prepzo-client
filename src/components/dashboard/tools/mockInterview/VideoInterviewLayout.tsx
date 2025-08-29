"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft, 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  MessageSquare, 
  X,
  Settings,
  Monitor
} from "lucide-react";
import AnimatedOrb from "./sessions/AnimatedOrb";
import LiveTranscript from "./sessions/LiveTranscript";
import { useLocalParticipant } from "@livekit/components-react";
import type { InterviewTranscriptionMessage } from "./MockInterviewVoiceAssistant";

interface VideoInterviewLayoutProps {
  sessionConfig: {
    sessionId?: string;
    interviewType: string;
    position: string;
    difficulty: string;
    duration: number;
  };
  isSpeaking: boolean;
  messages: InterviewTranscriptionMessage[];
  timer: string;
  timeRemaining: number;
  endingCountdown?: number | null;
  onEndInterview: () => void;
  onNavigateBack: () => void;
  children?: React.ReactNode;
}

const VideoInterviewLayout: React.FC<VideoInterviewLayoutProps> = ({
  sessionConfig,
  isSpeaking,
  messages,
  timer,
  timeRemaining,
  endingCountdown,
  onEndInterview,
  onNavigateBack,
  children
}) => {
  const localParticipant = useLocalParticipant();
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // UI State
  const [isCameraOn, setIsCameraOn] = useState(true); // Default ON for interviews
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isTranscriptVisible, setIsTranscriptVisible] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Auto-hide controls after inactivity
  const controlsTimeoutRef = useRef<NodeJS.Timeout>();
  const resetControlsTimeout = useCallback(() => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    setShowControls(true);
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3000);
  }, []);

  // Mouse movement handler
  useEffect(() => {
    const handleMouseMove = () => {
      resetControlsTimeout();
    };

    document.addEventListener('mousemove', handleMouseMove);
    resetControlsTimeout(); // Initial call

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [resetControlsTimeout]);

  // Video toggle with smooth transition
  const toggleVideo = useCallback(async () => {
    try {
      if (localParticipant?.localParticipant) {
        // First update the UI state immediately for responsive feel
        setIsCameraOn(!isCameraOn);
        // Then handle the actual video toggle
        await localParticipant.localParticipant.setCameraEnabled(!isCameraOn);
      }
    } catch (error) {
      console.warn('Video toggle failed:', error);
      // Revert UI state if technical toggle fails
      setIsCameraOn(isCameraOn);
    }
  }, [isCameraOn, localParticipant]);

  // Microphone toggle
  const toggleMicrophone = useCallback(async () => {
    try {
      if (localParticipant?.localParticipant) {
        await localParticipant.localParticipant.setMicrophoneEnabled(isMicMuted);
        setIsMicMuted(!isMicMuted);
      }
    } catch (error) {
      console.warn('Microphone toggle failed:', error);
      setIsMicMuted(!isMicMuted);
    }
  }, [isMicMuted, localParticipant]);

  // Format interview type for display
  const formatInterviewType = (type: string) => {
    return type.split(/[_-]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Get video track for display
  const videoTrack = localParticipant?.cameraTrack?.track;

  // Update video element when track changes
  useEffect(() => {
    if (videoRef.current && videoTrack) {
      videoTrack.attach(videoRef.current);
      return () => {
        if (videoRef.current && videoTrack) {
          videoTrack.detach(videoRef.current);
        }
      };
    }
  }, [videoTrack]);

  return (
    <div className="h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-slate-800/50 to-emerald-900/20 pointer-events-none" />
      
      {/* Main Layout */}
      <div className="relative z-10 h-full flex flex-col">
        
        {/* Top Header - Auto-hide */}
        <AnimatePresence>
          {showControls && (
            <motion.header
              initial={{ y: -100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -100, opacity: 0 }}
              className="absolute top-0 left-0 right-0 z-20 flex justify-between items-center p-4 bg-black/20 backdrop-blur-md"
            >
              <button 
                onClick={onNavigateBack}
                className="flex items-center gap-2 text-white/80 hover:text-white transition-colors"
              >
                <ArrowLeft size={20} />
                <span className="text-sm font-medium">Exit Interview</span>
              </button>
              
              <div className="text-center">
                <div className="text-white/90 text-sm font-semibold">
                  {formatInterviewType(sessionConfig.interviewType)} Interview
                </div>
                <div className="text-white/70 text-xs">
                  {sessionConfig.position}
                </div>
              </div>
              
              {/* Timer */}
              <div className={`text-lg font-mono font-bold transition-colors duration-300 ${
                endingCountdown !== null ? 'text-red-400 animate-pulse' : 
                timeRemaining <= 60 ? 'text-red-400 animate-pulse' : 
                timeRemaining <= 300 ? 'text-orange-400' : 
                'text-white/90'
              }`}>
                {endingCountdown !== null ? (
                  <span className="text-red-400 animate-pulse">
                    Ending in: {endingCountdown}s
                  </span>
                ) : (
                  timer
                )}
              </div>
            </motion.header>
          )}
        </AnimatePresence>

        {/* Main Content Area */}
        <div className="flex-1 flex">
          
          {/* Left Side - Video or Orb Area */}
          <div className={`transition-all duration-500 ${
            isTranscriptVisible && !isCameraOn ? 'w-2/3' : 'w-full'
          } relative overflow-hidden`}>
            
            {/* Combined Layout with Smooth Transitions */}
            <div className="relative h-full w-full">
              
              {/* Video Area - Always present but hidden when camera off */}
              <motion.div 
                animate={{ 
                  opacity: isCameraOn ? 1 : 0,
                  scale: isCameraOn ? 1 : 0.9 
                }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="absolute inset-0"
              >
                {videoTrack ? (
                  <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <div className="w-full h-full bg-slate-800 rounded-lg flex items-center justify-center">
                    <div className="text-white/60 text-center">
                      <Video size={48} className="mx-auto mb-2 opacity-50" />
                      <p>Video initializing...</p>
                    </div>
                  </div>
                )}
              </motion.div>

              {/* Fixed Position Orb Layout - Independent of scroll */}
              <motion.div 
                animate={{ 
                  opacity: isCameraOn ? 0 : 1,
                  scale: isCameraOn ? 0.9 : 1 
                }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="fixed inset-0 pointer-events-none"
                style={{ 
                  zIndex: 30,
                  height: '100vh',
                  width: isTranscriptVisible ? '66.666667%' : '100%'
                }}
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center transform-gpu">
                    {/* Centered Orb when camera is off */}
                    <div className="mb-8">
                      <AnimatedOrb isSpeaking={isSpeaking} size="large" />
                    </div>
                    
                    {/* Status Indicators */}
                    <div className="space-y-3">
                      {isSpeaking && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="px-4 py-2 bg-green-500/20 text-green-400 rounded-full text-sm font-medium backdrop-blur-sm"
                        >
                          AI Interviewer Speaking
                        </motion.div>
                      )}
                      
                      <AnimatePresence>
                        {!isCameraOn && (
                          <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ delay: 0.2 }}
                            className="text-white/60 text-sm"
                          >
                            Video is turned off
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Orb Overlay - Fixed position when camera is on */}
              <AnimatePresence>
                {isCameraOn && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className={`absolute z-20 ${
                      isTranscriptVisible 
                        ? 'bottom-6 right-6' // When transcript is visible, stay in corner
                        : 'bottom-6 right-6'  // Default position
                    }`}
                    style={{ 
                      transform: 'translateZ(0)', // Force hardware acceleration
                      willChange: 'transform' // Optimize for animations
                    }}
                  >
                    <div className="relative pointer-events-none">
                      <AnimatedOrb isSpeaking={isSpeaking} size="small" />
                      {/* Speaking indicator */}
                      {isSpeaking && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="absolute -top-10 left-1/2 transform -translate-x-1/2 z-10"
                        >
                          <div className="bg-green-500 text-white text-xs px-2 py-1 rounded-full whitespace-nowrap shadow-lg">
                            AI Speaking
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Fixed Position Transcript Overlay */}
              <AnimatePresence>
                {isTranscriptVisible && isCameraOn && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 20 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="fixed bottom-28 right-6 w-96 h-[480px] z-50"
                    style={{ 
                      transform: 'translateZ(0)', // Force hardware acceleration
                      willChange: 'transform' // Optimize for animations
                    }}
                  >
                    <div className="h-full bg-black/90 backdrop-blur-lg rounded-lg border border-white/20 overflow-hidden shadow-2xl">
                      <div className="p-3 border-b border-white/20 flex justify-between items-center bg-black/50">
                        <span className="text-white text-sm font-medium">Live Transcript</span>
                        <button 
                          onClick={() => setIsTranscriptVisible(false)}
                          className="text-white/60 hover:text-white transition-colors"
                        >
                          <X size={16} />
                        </button>
                      </div>
                      <div className="h-[calc(100%-52px)]">
                        <LiveTranscript messages={messages} compact={true} />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Fixed Position Transcript Panel for Video Off */}
          <AnimatePresence>
            {!isCameraOn && isTranscriptVisible && (
              <motion.div
                initial={{ x: 400, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 400, opacity: 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="fixed top-[72px] right-0 bottom-[88px] w-1/3 bg-black/90 backdrop-blur-lg border-l border-white/20 z-40"
                style={{ 
                  transform: 'translateZ(0)', // Force hardware acceleration
                  willChange: 'transform' // Optimize for animations
                }}
              >
                <div className="absolute inset-0 flex flex-col">
                  <div className="flex-shrink-0 p-3 border-b border-white/20 flex justify-between items-center bg-black/50">
                    <span className="text-white text-sm font-medium">Live Transcript</span>
                    <button 
                      onClick={() => setIsTranscriptVisible(false)}
                      className="text-white/60 hover:text-white transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                  <div className="flex-1 min-h-0">
                    <LiveTranscript messages={messages} compact={true} />
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom Controls - Auto-hide */}
        <AnimatePresence>
          {showControls && (
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="absolute bottom-0 left-0 right-0 z-20 p-6"
            >
              <div className="flex justify-center">
                <div className="flex items-center gap-4 bg-black/40 backdrop-blur-md rounded-full px-6 py-4 border border-white/20">
                  
                  {/* Microphone Toggle */}
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={toggleMicrophone}
                    className={`rounded-full w-12 h-12 border-2 transition-all ${
                      isMicMuted 
                        ? 'bg-red-500 border-red-500 text-white hover:bg-red-600' 
                        : 'bg-white/10 border-white/30 text-white hover:bg-white/20'
                    }`}
                  >
                    {isMicMuted ? <MicOff size={20} /> : <Mic size={20} />}
                  </Button>

                  {/* Video Toggle */}
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={toggleVideo}
                    className={`rounded-full w-12 h-12 border-2 transition-all duration-300 transform hover:scale-105 active:scale-95 ${
                      !isCameraOn 
                        ? 'bg-red-500 border-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/30' 
                        : 'bg-white/10 border-white/30 text-white hover:bg-white/20'
                    }`}
                  >
                    <motion.div
                      key={isCameraOn ? 'video-on' : 'video-off'}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.2 }}
                    >
                      {isCameraOn ? <Video size={20} /> : <VideoOff size={20} />}
                    </motion.div>
                  </Button>

                  {/* Transcript Toggle */}
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => setIsTranscriptVisible(!isTranscriptVisible)}
                    className={`rounded-full w-12 h-12 border-2 transition-all ${
                      isTranscriptVisible 
                        ? 'bg-blue-500 border-blue-500 text-white' 
                        : 'bg-white/10 border-white/30 text-white hover:bg-white/20'
                    }`}
                  >
                    <MessageSquare size={20} />
                  </Button>

                  {/* End Interview */}
                  <Button
                    onClick={onEndInterview}
                    className="rounded-full px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-medium border-2 border-red-500 transition-all"
                  >
                    End Interview
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Additional UI Elements */}
        {children}
      </div>

      {/* Click to show controls hint */}
      {!showControls && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10">
          <div className="text-white/40 text-xs animate-pulse">
            Move mouse to show controls
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoInterviewLayout;
