import React, { useState, useEffect, useMemo, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
// Import the centralized Supabase client creator
import { createClient } from "@/utils/supabase/client";
import { AlertTriangle, CheckCircle, Info, Edit3, HelpCircle, FileText, MessageSquare } from 'lucide-react';

// Interface for API response data (already present)
interface OptimizationRecord {
  id: number;
  created_at: string;
  uid: string;
  "display name": string;
  linkedin_url: string;
  comments: string;
  api_response: {
    changes_required: string;
    explanation: string;
  };
}

// For the direct response from Xano/Flask, which then populates the state
interface DirectApiResponse {
    changes_required: string;
    explanation: string;
}

const LinkedInOptimizerContent: React.FC = () => {
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

  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL_USER_PORTAL;
  const resultsRef = useRef<HTMLDivElement>(null);

  // Clear results when inputs change after a successful submission
  useEffect(() => {
    if (changesRequired !== null || explanation !== null) {
      setChangesRequired(null);
      setExplanation(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [linkedinUrl, comments]);

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
  const getAuthToken = async () => {
    console.log("[LinkedInOptimizerContent] Attempting to get session with client from @/utils/supabase/client...");
    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      console.log("[LinkedInOptimizerContent] supabase.auth.getSession() response:", { data: sessionData, error: sessionError });

      if (sessionError || !sessionData || !sessionData.session) {
        console.error('[LinkedInOptimizerContent] Error getting session or session not found:', sessionError);
        setError('Authentication session not found. Please ensure you are logged in.');
        return null;
      }
      
      console.log("[LinkedInOptimizerContent] Session found successfully:", sessionData.session);
      return sessionData.session.access_token;

    } catch (e) {
      console.error("[LinkedInOptimizerContent] Exception during supabase.auth.getSession():", e);
      setError('Authentication token not found due to an exception. Please log in.');
      return null;
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);
    setChangesRequired(null);
    setExplanation(null);
    setHasSubmittedOnce(true); // Mark that a submission attempt has been made

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
      const targetUrl = `${backendUrl.replace(/\/$/, '')}/linkedin-optimizer`;
      console.log(`[DEBUG] handleSubmit: Submitting to POST ${targetUrl}`);
      const response = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ linkedin_url: linkedinUrl, comments }),
      });

      console.log(`[DEBUG] handleSubmit: Response status: ${response.status}`);

      if (!response.ok) {
        let errorData = { error: `HTTP error! status: ${response.status}` };
        try {
            errorData = await response.json();
        } catch (e) {
            console.error("[DEBUG] handleSubmit: Failed to parse error JSON", e);
        }
        console.error("[DEBUG] handleSubmit: Response not OK. Error data:", errorData);
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data: DirectApiResponse = await response.json();
      console.log("[DEBUG] handleSubmit: Data received from API:", data);

      const newChangesRequired = data.changes_required?.trim() ? data.changes_required : null;
      const newExplanation = data.explanation?.trim() ? data.explanation : null;

      console.log("[DEBUG] handleSubmit: Processed newChangesRequired:", newChangesRequired);
      console.log("[DEBUG] handleSubmit: Processed newExplanation:", newExplanation);
      
      setChangesRequired(newChangesRequired);
      setExplanation(newExplanation);
      
      fetchHistory();
      setTimeout(() => {
        console.log("[DEBUG] handleSubmit: Scrolling to resultsRef");
        resultsRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (err) {
      console.error("[DEBUG] handleSubmit: Catch block error:", err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred during submission.');
      }
    } finally {
      console.log("[DEBUG] handleSubmit: Setting isLoading to false");
      setIsLoading(false);
    }
  };

  const fetchHistory = async () => {
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
      console.log(`[DEBUG] fetchHistory: Fetching from GET ${targetUrl}`);
      const response = await fetch(targetUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      console.log(`[DEBUG] fetchHistory: Response status: ${response.status}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: `HTTP error fetching history: status: ${response.status}` }));
        console.error("[DEBUG] fetchHistory: Response not OK. Error data:", errorData);
        throw new Error(errorData.error || `HTTP error fetching history: status: ${response.status}`);
      }

      const data: OptimizationRecord[] = await response.json();
      console.log("[DEBUG] fetchHistory: Data received:", data);
      setHistory(data);
      if (activeTab === 'history') setError(null);
    } catch (err) {
      console.error("[DEBUG] fetchHistory: Catch block error:", err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred while fetching history.');
      }
    } finally {
      console.log("[DEBUG] fetchHistory: Setting isLoading to false");
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (supabase && backendUrl) {
      fetchHistory();
    } else if (!backendUrl) {
      setError("Backend URL is not configured. Please set NEXT_PUBLIC_BACKEND_URL_USER_PORTAL.");
    }
  }, [supabase, backendUrl]);

  // Determine if there are any results to show
  const hasResultsToDisplay = (changesRequired && changesRequired.trim() !== '') || (explanation && explanation.trim() !== '');

  // Add console log inside render for results section
  if (activeTab === 'optimizer') {
    console.log("[DEBUG] Optimizer Render: isLoading:", isLoading, "hasSubmittedOnce:", hasSubmittedOnce, "changesRequired:", changesRequired, "explanation:", explanation);
  }

  // Derived booleans for rendering logic in Optimizer tab
  const hasContentForOptimizer = (changesRequired && changesRequired.trim() !== '') || (explanation && explanation.trim() !== '');
  const showOptimizerResultsContainer = !isLoading && hasSubmittedOnce;

  return (
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
                        <div className="prose prose-indigo max-w-none">
                          <ReactMarkdown>{changesRequired}</ReactMarkdown>
                        </div>
                      </div>
                    )}

                    {explanation && explanation.trim() !== '' && (
                      <div className="p-6 bg-white rounded-lg shadow-md">
                        <h3 className="text-xl font-medium text-gray-700 mb-3 flex items-center">
                          <HelpCircle className="h-6 w-6 text-sky-500 mr-2" /> Explanation
                        </h3>
                        <div className="prose prose-indigo max-w-none">
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
                console.log(`[DEBUG History Item ${index}] ID: ${item.id}, Raw API Response:`, JSON.stringify(item.api_response)); // Log raw string for inspection

                const changesFromHistory = item.api_response?.changes_required;
                const explanationFromHistory = item.api_response?.explanation;

                const hasApiChanges = typeof changesFromHistory === 'string' && changesFromHistory.trim() !== '';
                const hasApiExplanation = typeof explanationFromHistory === 'string' && explanationFromHistory.trim() !== '';
                
                // Log the evaluated boolean conditions
                console.log(`[DEBUG History Item ${index}] ID: ${item.id}, hasApiChanges: ${hasApiChanges}, hasApiExplanation: ${hasApiExplanation}`);
                
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
                          <div className="prose prose-sm max-w-none">
                              <ReactMarkdown>{changesFromHistory}</ReactMarkdown>
                          </div>
                        </div>
                      )}
                      {hasApiExplanation && (
                         <div className="p-4 bg-white rounded-md shadow-sm border border-gray-200">
                          <h4 className="text-lg font-semibold text-gray-700 mb-2 flex items-center">
                            <HelpCircle className="h-5 w-5 text-sky-500 mr-2" />Explanation:
                          </h4>
                          <div className="prose prose-sm max-w-none">
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
  );
};

export default LinkedInOptimizerContent;
