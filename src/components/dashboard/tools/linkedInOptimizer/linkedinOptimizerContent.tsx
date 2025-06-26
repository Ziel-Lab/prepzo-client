import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
// Import the centralized Supabase client creator
import { createClient } from "@/utils/supabase/client";
import { AlertTriangle, CheckCircle, Info, Edit3, HelpCircle, FileText, MessageSquare, Loader2, Star } from 'lucide-react';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { LimitReached } from "@/components/dashboard/settings/subscription/limitReached";

const loadingMessages = [
    "Analyzing your LinkedIn profile...",
    "Identifying areas for improvement based on your goals...",
    "Crafting impactful suggestions for your headline and summary...",
    "Reviewing your experience for keyword optimization...",
    "Polishing the final recommendations..."
];

// Interface for API response data (already present)
interface OptimizationRecord {
  id: number;
  created_at: string;
  uid: string;
  "display name": string;
  linkedin_url: string;
  comments: string;
  api_response: {
    changes?: string; // For new format
    changes_required?: string; // For old format
    explanation: string;
  };
}

// For the direct response from Xano/Flask, which then populates the state
interface DirectApiResponse {
    changes: string;
    explanation: string;
}

const LinkedInOptimizerContent: React.FC = () => {
  const { subscription, isPro, isLoading: isSubscriptionLoading, error: subscriptionError } = useSubscription();

  // Initialize Supabase client using the project's utility function
  const supabase = createClient();

  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [comments, setComments] = useState('');
  const [changesRequired, setChangesRequired] = useState<string | null>(null);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [history, setHistory] = useState<OptimizationRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'optimizer' | 'history'>('optimizer');
  const [hasSubmittedOnce, setHasSubmittedOnce] = useState(false); // To track if form was submitted
  const [limitReached, setLimitReached] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState(loadingMessages[0]);

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL_USER_PORTAL;
  const resultsRef = useRef<HTMLDivElement>(null);
  const loadingCardRef = useRef<HTMLDivElement>(null);

  // Clear results when inputs change after a successful submission
  useEffect(() => {
    if (changesRequired !== null || explanation !== null) {
      setChangesRequired(null);
      setExplanation(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [linkedinUrl, comments]);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    if (isLoading) {
        setLoadingMessage(loadingMessages[0]);
        intervalId = setInterval(() => {
            setLoadingMessage(prev => {
                const currentIndex = loadingMessages.indexOf(prev);
                return loadingMessages[(currentIndex + 1) % loadingMessages.length];
            });
        }, 3500);
    }
    return () => clearInterval(intervalId);
  }, [isLoading]);

  const handleInputChange = () => {
    // Clear results immediately when user types in input fields after a submission
    if (hasSubmittedOnce) {
        setChangesRequired(null);
        setExplanation(null);
        // Optionally reset hasSubmittedOnce if you want the "No feedback" message to disappear until next submit
        // setHasSubmittedOnce(false); 
    }
  };

  // Get the backend URL from environment variables
  const getAuthToken = useCallback(async () => {
    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !sessionData || !sessionData.session) {
        console.error('[LinkedInOptimizerContent] Error getting session or session not found:', sessionError);
        setError('Authentication session not found. Please ensure you are logged in.');
        return null;
      }
      
      return sessionData.session.access_token;

    } catch (e) {
      console.error("[LinkedInOptimizerContent] Exception during supabase.auth.getSession():", e);
      setError('Authentication token not found due to an exception. Please log in.');
      return null;
    }
  }, [supabase]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    setLimitReached(false);
    setChangesRequired(null);
    setExplanation(null);
    setHasSubmittedOnce(true); // Mark that a submission attempt has been made

    try {
      if (!backendUrl) {
        setError("Backend URL is not configured. Please set NEXT_PUBLIC_BACKEND_URL_USER_PORTAL.");
        return;
      }

      const token = await getAuthToken();
      if (!token) {
        return;
      }
      
      const targetUrl = `${backendUrl.replace(/\/$/, '')}/linkedin-optimizer`;
      const response = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ linkedin_url: linkedinUrl, comments }),
      });

      if (!response.ok) {
        let errorData = { error: `HTTP error! status: ${response.status}` };
        try {
            errorData = await response.json();
        } catch (e) {
            console.error("[DEBUG] handleSubmit: Failed to parse error JSON", e);
        }
        console.error("[DEBUG] handleSubmit: Response not OK. Error data:", errorData);
        
        const specificError = errorData.error || "";
        if (typeof specificError === 'string' && specificError.toLowerCase().includes("limit")) {
          setLimitReached(true);
        } else {
          setError("Uh oh! Something went a bit sideways. Our tech wizards are on it!");
        }
        return;
      }

      const data: DirectApiResponse = await response.json();

      const newChangesRequired = data.changes?.trim() ? data.changes : null;
      const newExplanation = data.explanation?.trim() ? data.explanation : null;
     
      setChangesRequired(newChangesRequired);
      setExplanation(newExplanation);
      
      fetchHistory();
    } catch (err) {
      console.error("[DEBUG] handleSubmit: Catch block error:", err);
      setError("Uh oh! Something went a bit sideways. Our tech wizards are on it!");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchHistory = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    if (!backendUrl) {
      setError("Backend URL is not configured. Please set NEXT_PUBLIC_BACKEND_URL_USER_PORTAL.");
      setIsLoading(false);
      return;
    }

    const token = await getAuthToken();
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      const targetUrl = `${backendUrl.replace(/\/$/, '')}/linkedin-optimizer/history`;
      const response = await fetch(targetUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: `HTTP error fetching history: status: ${response.status}` }));
        console.error("[DEBUG] fetchHistory: Response not OK. Error data:", errorData);
        setError("Uh oh! Something went a bit sideways. Our tech wizards are on it!");
        setIsLoading(false);
        return;
      }

      const data: OptimizationRecord[] = await response.json();
      setHistory(data);
    } catch (err) {
      console.error("[DEBUG] fetchHistory: Catch block error:", err);
      setError("Uh oh! Something went a bit sideways. Our tech wizards are on it!");
    } finally {
      setIsLoading(false);
    }
  }, [backendUrl, getAuthToken, setIsLoading, setError, setHistory]);

  useEffect(() => {
    if (!supabase || !backendUrl) {
      if (!backendUrl) {
        setError("Backend URL is not configured. Please set NEXT_PUBLIC_BACKEND_URL_USER_PORTAL.");
      }
      return;
    }

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'INITIAL_SESSION' || event === 'SIGNED_IN') {
        if (session) {
          fetchHistory();
        } else {
          setHistory([]); // Clear history if no session
          // If getAuthToken is called (e.g. by a manual fetch action later), it will set the appropriate error.
          // For initial load, if no session, we simply don't fetch.
        }
      } else if (event === 'SIGNED_OUT') {
        setHistory([]);
        setError(null); 
      }
    });

    // Cleanup subscription on component unmount
    return () => {
      authListener.subscription?.unsubscribe();
    };
  }, [supabase, backendUrl, fetchHistory]);

  useEffect(() => {
    // Scroll to loading indicator when it appears
    if (isLoading && activeTab === 'optimizer' && loadingCardRef.current) {
      const timerId = setTimeout(() => {
        loadingCardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
      return () => clearTimeout(timerId);
    }
    
    // Scroll to results when they are populated, the tab is active, and not loading
    if (!isLoading && activeTab === 'optimizer' && (changesRequired || explanation) && resultsRef.current) {
      const timerId = setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
      return () => clearTimeout(timerId);
    }
  }, [isLoading, activeTab, changesRequired, explanation]);

  // Determine if there are any results to show
  const hasResultsToDisplay = (changesRequired && changesRequired.trim() !== '') || (explanation && explanation.trim() !== '');

  // Add console log inside render for results section
  if (activeTab === 'optimizer') {
  }

  // Derived booleans for rendering logic in Optimizer tab
  const hasContentForOptimizer = (changesRequired && changesRequired.trim() !== '') || (explanation && explanation.trim() !== '');
  const showOptimizerResultsContainer = !isLoading && hasSubmittedOnce;

  if (isSubscriptionLoading) {
    return (
      <div className="flex flex-col items-center justify-center text-center p-10">
        <Loader2 className="h-12 w-12 animate-spin text-indigo-600 mb-4" />
        <p className="text-lg text-gray-600">Verifying your subscription status...</p>
      </div>
    );
  }

  if (subscriptionError) {
    return (
      <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md shadow-md mb-6" role="alert">
        <div className="flex">
          <div className="py-1"><AlertTriangle className="h-6 w-6 text-red-500 mr-3" /></div>
          <div>
            <p className="font-bold">Subscription Error</p>
            <p className="text-sm">{subscriptionError}</p>
          </div>
        </div>
      </div>
    );
  }

  if (limitReached) {
    return (
      <LimitReached 
        featureName="LinkedIn Optimization"
        featureNamePlural="LinkedIn Optimizations"
      />
    );
  }

  if (!isPro) {
    return (
      <div className="bg-white shadow-xl rounded-lg p-6 md:p-8">
        <div className="flex flex-col items-center justify-center text-center py-10">
          <Star className="h-16 w-16 text-yellow-400 mb-4" />
          <h2 className="text-2xl font-bold text-gray-800">Unlock the LinkedIn Optimizer with Pro</h2>
          <p className="mt-2 mb-6 text-gray-600 max-w-md">
            This is a premium feature. Upgrade to our Pro plan to optimize your LinkedIn profile and access all our advanced tools.
          </p>
          <Link href="/dashboard/settings/subscription" passHref>
            <Button>
              <Star className="mr-2 h-4 w-4" /> Upgrade to Pro
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-4 md:p-6">       
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Column: Form */}
        <div className="col-span-1">
          <div className="p-4 md:p-8 bg-gray-50 min-h-screen">
            <header className="mb-8 text-center">
              <h1 className="text-4xl font-bold text-gray-800">LinkedIn Optimizer</h1>
              <p className="text-lg text-gray-600">Optimize your LinkedIn profile based on your goals.</p>
            </header>

            {error && (
              <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md shadow-md mb-6" role="alert">
                <div className="flex">
                  <div className="py-1"><AlertTriangle className="h-6 w-6 text-red-500 mr-3" /></div>
                  <div>
                    <p className="font-bold">Error</p>
                    <p className="text-sm">{error}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="mb-6 border-b border-gray-300">
              <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                <button
                  onClick={() => setActiveTab('optimizer')}
                  className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'optimizer'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  Optimizer
                </button>
                <button
                  onClick={() => { setActiveTab('history'); if (history.length === 0 || error) fetchHistory(); }} // Fetch history if empty or error exists
                  className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === 'history'
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  History
                </button>
              </nav>
            </div>

            {activeTab === 'optimizer' && (
              <div className="bg-white shadow-xl rounded-lg p-6 md:p-8">
                <form onSubmit={handleSubmit} className="space-y-6 mb-8">
                  <div className="mb-6">
                    <label htmlFor="linkedinUrl" className="block text-sm font-medium text-gray-700 mb-1">
                      LinkedIn Profile URL
                    </label>
                    <input
                      type="url"
                      id="linkedinUrl"
                      value={linkedinUrl}
                      onChange={(e) => { setLinkedinUrl(e.target.value); handleInputChange(); }}
                      placeholder="https://www.linkedin.com/in/yourprofile/"
                      required
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                    <p className="mt-1 text-xs text-gray-500">Ensure your profile is set to public.</p>
                  </div>

                  <div className="mb-6">
                    <label htmlFor="comments" className="block text-sm font-medium text-gray-700 mb-1">
                      Goals & Comments
                    </label>
                    <textarea
                      id="comments"
                      value={comments}
                      onChange={(e) => { setComments(e.target.value); handleInputChange(); }}
                      rows={6}
                      placeholder="What do you want to transform about your LinkedIn? How would you like to portray your image?"
                      required
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-3"></div>
                        Optimizing...
                      </>
                    ) : 'Optimize Profile'}
                  </button>
                </form>

                {isLoading && (
                  <div className="mt-10" ref={loadingCardRef}>
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
                          <p className="font-semibold text-lg text-blue-800 animate-pulse">{loadingMessage}</p>
                          <p className="text-sm text-blue-600 mt-2">Hang tight, this can take up to a minute.</p>
                      </div>
                  </div>
                )}

                <div ref={resultsRef} className="mt-10 pt-8 border-t-2 border-indigo-100">
                  {showOptimizerResultsContainer && (
                    <>
                      {hasContentForOptimizer ? (
                        <div className="bg-slate-50 p-6 rounded-lg shadow-inner space-y-8">
                          <h2 className="text-2xl font-semibold text-gray-800 mb-2 flex items-center">
                            <CheckCircle className="h-7 w-7 text-green-500 mr-3" /> Optimization Insights
                          </h2>
                          
                          {changesRequired && changesRequired.trim() !== '' && (
                            <div className="p-6 bg-white rounded-lg shadow-md">
                              <h3 className="text-xl font-medium text-gray-700 mb-3 flex items-center">
                                <Edit3 className="h-6 w-6 text-indigo-500 mr-2" /> Suggested Changes
                              </h3>
                              <div className="prose prose-indigo max-w-none overflow-y-auto max-h-96">
                                <ReactMarkdown>{changesRequired}</ReactMarkdown>
                              </div>
                            </div>
                          )}

                          {explanation && explanation.trim() !== '' && (
                            <div className="p-6 bg-white rounded-lg shadow-md">
                              <h3 className="text-xl font-medium text-gray-700 mb-3 flex items-center">
                                <HelpCircle className="h-6 w-6 text-sky-500 mr-2" /> Explanation
                              </h3>
                              <div className="prose prose-indigo max-w-none overflow-y-auto max-h-96">
                                <ReactMarkdown>{explanation}</ReactMarkdown>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center p-6 bg-white rounded-lg shadow-md mt-6">
                          <Info className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                          <h3 className="text-lg font-medium text-gray-700 mb-2">No Specific Feedback</h3>
                          <p className="text-sm text-gray-500">The optimizer processed your input but did not provide specific changes or explanations at this time.</p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'history' && (
              <div className="bg-white shadow-xl rounded-lg p-6 md:p-8">
                <h2 className="text-2xl font-semibold text-gray-800 mb-6">Optimization History</h2>
                {isLoading && (
                  <div className="flex items-center justify-center p-10">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500 mr-3"></div>
                    Loading history...
                  </div>
                )}
                {!isLoading && history.length === 0 && !error && (
                  <div className="text-center p-10 text-gray-500">
                      <Info className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      No optimization history found.
                  </div>
                )}
                {!isLoading && history.length > 0 && (
                  <div className="space-y-6">
                    {history.map((item, index) => {
                      const changesFromHistory = item.api_response?.changes || item.api_response?.changes_required;
                      const explanationFromHistory = item.api_response?.explanation;

                      const hasApiChanges = typeof changesFromHistory === 'string' && changesFromHistory.trim() !== '';
                      const hasApiExplanation = typeof explanationFromHistory === 'string' && explanationFromHistory.trim() !== '';
                                     
                      return (
                        <details key={item.id} className="bg-slate-50 p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                          <summary className="font-medium text-indigo-700 cursor-pointer hover:text-indigo-800 flex justify-between items-center">
                            <span>
                              <FileText size={16} className="inline mr-2 mb-0.5" /> 
                              Optimization from: {new Date(item.created_at).toLocaleString()}
                            </span>
                            <span className="text-xs text-gray-500">Profile: {item.linkedin_url.substring(0,40)}...</span>
                          </summary>
                          <div className="mt-6 space-y-6 pt-4 border-t border-slate-200">
                            <div className="mb-4 p-3 bg-indigo-50 rounded-md border border-indigo-200 text-xs">
                              <p className="font-semibold text-indigo-700">Original Input:</p>
                              <p><strong className="text-gray-600">URL:</strong> <a href={item.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{item.linkedin_url}</a></p>
                              <p><strong className="text-gray-600">Your Comments:</strong> {item.comments.substring(0,150)}{item.comments.length > 150 ? '...' : ''}</p>
                            </div>

                            {hasApiChanges && (
                               <div className="p-4 bg-white rounded-md shadow-sm border border-gray-200">
                                <h4 className="text-lg font-semibold text-gray-700 mb-2 flex items-center">
                                  <Edit3 className="h-5 w-5 text-indigo-500 mr-2" />Changes Suggested:
                                </h4>
                                <div className="prose prose-sm max-w-none overflow-y-auto max-h-72">
                                    <ReactMarkdown>{changesFromHistory}</ReactMarkdown>
                                </div>
                              </div>
                            )}
                            {hasApiExplanation && (
                               <div className="p-4 bg-white rounded-md shadow-sm border border-gray-200">
                                <h4 className="text-lg font-semibold text-gray-700 mb-2 flex items-center">
                                  <HelpCircle className="h-5 w-5 text-sky-500 mr-2" />Explanation:
                                </h4>
                                <div className="prose prose-sm max-w-none overflow-y-auto max-h-72">
                                    <ReactMarkdown>{explanationFromHistory}</ReactMarkdown>
                                </div>
                              </div>
                            )}
                            {!hasApiChanges && !hasApiExplanation && (
                              <div className="text-center p-4 text-gray-500 bg-white rounded-md shadow-sm border border-gray-200">
                                  (No specific changes or explanation were recorded for this history item.)
                              </div>
                            )}
                          </div>
                        </details>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LinkedInOptimizerContent;