"use client";
import { useState, useCallback, useRef, useEffect } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import ApplicationsTable from "@/components/dashboard/applications/ApplicationsTable";
import { Filters } from "@/components/dashboard/applications/types";
import { Job, JobStatus, JOB_STATUSES } from "@/components/dashboard/applications/types";
import ApplicationsFilters from "@/components/dashboard/applications/ApplicationsFilters";
import ApplicationsStats from "@/components/dashboard/applications/ApplicationsStats";
import NewApplicationDialog from "@/components/dashboard/applications/NewApplicationDialog";
import BlurOverlay from "@/components/dashboard/blurrEffect";
import { createClient } from "@/utils/supabase/client";
import { saveJobSearchFilter, getSavedFilters, SavedFilter } from "@/utils/saveJobSearchFilters";
import { useToast } from "@/hooks/use-toast";
import JobSearchLoader from "@/components/ui/JobSearchLoader";
import FullPageLoader from "@/components/ui/FullPageLoader";

// Re-use the primitive/loose filter map used by AdvancedFilters
type Primitive = string | number | boolean;
type FlexibleFilters = Partial<Record<string, Primitive>>;



const Applications = () => {
  const [filters, setFilters] = useState<Filters>({} as Filters);
  const [hasSearchResults, setHasSearchResults] = useState(false);
  const [aiFilters, setAiFilters] = useState<{
    search?: string;
    location?: string;
    seniority?: string;
    company?: string;
    country?: string;
    min_salary_usd?: string;
    max_salary_usd?: string;
    posted_at_max_age_days?: string;
  } | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [savedFilters, setSavedFilters] = useState<SavedFilter[]>([]);
  const [activeFilter, setActiveFilter] = useState<Filters | null>(null);
  const [isAIFetching, setIsAIFetching] = useState(false);
  const [revealedJobsHistory, setRevealedJobsHistory] = useState<Array<{ job_id: number; job_details?: Job; revealed_at: string }>>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [jobStatuses, setJobStatuses] = useState<Map<number, JobStatus>>(new Map());
  const [updatingStatus, setUpdatingStatus] = useState<Set<number>>(new Set());
  const [generatedDocuments, setGeneratedDocuments] = useState<Map<string, { current_resume?: string; company_website?: string; created_at?: string }>>(new Map());
  const supabase = createClient();
  const { toast } = useToast();

  // Function to update job status
  const updateJobStatus = async (jobId: number, newStatus: JobStatus) => {
    try {
      setUpdatingStatus(prev => new Set(prev).add(jobId));

      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (!sessionError && session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL_USER_PORTAL}/update-job-status`,
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            job_id: jobId,
            status: newStatus
          })
        }
      );

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to update status (${res.status})`);
      }

      // Update local state
      setJobStatuses(prev => {
        const newMap = new Map(prev);
        newMap.set(jobId, newStatus);
        return newMap;
      });

      toast({
        title: "Status updated",
        description: `Job status changed to ${JOB_STATUSES[newStatus]}`,
      });
    } catch (err) {
      console.error("Error updating job status:", err);
      toast({
        title: "Update failed",
        description: err instanceof Error ? err.message : "Could not update job status",
        variant: "destructive"
      });
    } finally {
      setUpdatingStatus(prev => {
        const newSet = new Set(prev);
        newSet.delete(jobId);
        return newSet;
      });
    }
  };

  // Ref for AdvancedFilters section
  const advancedFiltersRef = useRef<HTMLDivElement>(null);

  // Get user and load saved filters and history
  useEffect(() => {
    const fetchUserAndData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.id) {
        setUserId(user.id);
        
        // Fetch saved filters
        const { data: filters } = await getSavedFilters(user.id);
        if (filters) {
          setSavedFilters(filters);
        }

        // Fetch revealed jobs history
        try {
          setHistoryLoading(true);
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          const headers: Record<string, string> = {
            "Content-Type": "application/json",
          };
          if (!sessionError && session?.access_token) {
            headers["Authorization"] = `Bearer ${session.access_token}`;
          }

          const res = await fetch(
            `${process.env.NEXT_PUBLIC_BACKEND_URL_USER_PORTAL}/revealed-jobs-history?limit=500`,
            { method: "GET", headers }
          );

          if (!res.ok) throw new Error(`Failed to fetch revealed jobs history (status ${res.status})`);

          const history = await res.json();
          console.log('Raw history response:', history); // Debug log

          // Parse job_details if they come as JSON strings
          type HistoryItem = {
            job_id: number;
            job_details?: unknown;
            revealed_at: string;
            status?: string;
          };

          const parsedHistory = history.map((item: HistoryItem) => {
            let parsedJobDetails = item.job_details;
            
            // If job_details is a string, try to parse it
            if (typeof item.job_details === 'string') {
              try {
                parsedJobDetails = JSON.parse(item.job_details);
                // Check if we have a nested data structure
                if (parsedJobDetails && typeof parsedJobDetails === 'object' && 'data' in parsedJobDetails) {
                  const apiResponse = parsedJobDetails as { data: Job[] };
                  if (Array.isArray(apiResponse.data) && apiResponse.data.length > 0) {
                    parsedJobDetails = apiResponse.data[0];
                  }
                }
              } catch (e) {
                console.warn('Failed to parse job_details for job_id:', item.job_id, e);
                parsedJobDetails = undefined;
              }
            }

            // Handle case where job_details is already an object with data property
            if (parsedJobDetails && typeof parsedJobDetails === 'object' && 'data' in parsedJobDetails) {
              const apiResponse = parsedJobDetails as { data: Job[] };
              if (Array.isArray(apiResponse.data) && apiResponse.data.length > 0) {
                parsedJobDetails = apiResponse.data[0];
              }
            }

            // Ensure we have the required fields
            const jobDetails = parsedJobDetails as Job | undefined;
            if (jobDetails) {
              // Make sure we have at least the job title
              if (!jobDetails.job_title) {
                jobDetails.job_title = `Unknown Position (ID: ${item.job_id})`;
              }
            }

            return {
              job_id: item.job_id,
              job_details: jobDetails,
              revealed_at: item.revealed_at
            };
          });

          console.log('Parsed history:', parsedHistory); // Debug log
          setRevealedJobsHistory(parsedHistory);

          // Extract and store existing job statuses from the history
          const statusMap = new Map<number, JobStatus>();
          history.forEach((item: HistoryItem) => {
            if (item.status && typeof item.status === 'string' && item.status in JOB_STATUSES) {
              statusMap.set(item.job_id, item.status as JobStatus);
            }
          });
          
          setJobStatuses(statusMap);

        } catch (err) {
          console.error("Error fetching revealed jobs history", err);
          toast({
            title: "Error",
            description: "Failed to load saved jobs history",
            variant: "destructive"
          });
        } finally {
          setHistoryLoading(false);
        }
      }
    };
    fetchUserAndData();
  }, [supabase.auth, toast]);

  // Auto-scroll to AdvancedFilters when aiFilters is set
  useEffect(() => {
    if (aiFilters && advancedFiltersRef.current) {
      advancedFiltersRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [aiFilters]);

  const handleFiltersChange = useCallback((newFilters: Filters) => {
    setFilters(newFilters);
  }, []);

  const handleSaveFilters = async () => {
    if (!userId) {
      toast({
        title: "Authentication required",
        description: "Please log in to save filters.",
        variant: "destructive",
      });
      return;
    }

    // Check if there are any active filters to save
    const hasActiveFilters = Object.values(filters).some(value => 
      value !== "" && value !== null && value !== undefined
    );

    if (!hasActiveFilters) {
      toast({
        title: "No filters to save",
        description: "Please set some filters before saving.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await saveJobSearchFilter(userId, filters);
      if (error) {
        toast({
          title: "Error",
          description: "Failed to save filters. Please try again.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Filters saved successfully!",
        });
        // Reload saved filters
        const { data: updatedFilters } = await getSavedFilters(userId);
        if (updatedFilters) {
          setSavedFilters(updatedFilters);
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    }
  };

  const handleLoadFilter = (savedFilter: SavedFilter) => {
    setActiveFilter(savedFilter.filters);
    setFilters(savedFilter.filters);
    
    // Automatically start job search and show results
    setHasSearchResults(true);
    
    // toast({
    //   title: "Filter loaded",
    //   description: "Starting job search with saved filters...",
    // });
  };

  const handleBackToSearch = () => {
    setActiveFilter(null);
    setFilters({});
    setHasSearchResults(false);
    setAiFilters(null);
    
    toast({
      title: "Back to search",
      description: "Returned to main search interface.",
    });
  };

  const handleAISearch = async (prompt: string) => {
    try {
      setHasSearchResults(false);
      setAiFilters(null); // Clear previous AI filters
      setIsAIFetching(true);
      // Show a minimal loader while waiting for n8n to prepare filters
      // We will render the loader by leveraging hasSearchResults=false and the child filter section state
      // Get JWT token from Supabase session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session?.access_token) {
        throw new Error("Authentication required for AI search.");
      }
      await fetch("https://dashboard.prepzo.ai/ai-job-search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ prompt }),
      });
      setHasSearchResults(true);
      // Wait 3.5 seconds, then poll for filters
      setTimeout(async () => {
        try {
          const resp = await fetch("https://dashboard.prepzo.ai/n8n-push", {
            method: "GET",
            headers: {
              "Authorization": `Bearer ${session.access_token}`,
            },
          });
          if (resp.ok) {
            const data = await resp.json();
            if (data.filters) {
              // Helpers to normalize API values (string, CSV, or array)
              const toStringValue = (val: unknown): string => {
                if (val == null) return '';
                if (Array.isArray(val)) return val.map(v => String(v)).join(', ');
                return String(val);
              };
              const toArray = (val: unknown): string[] => {
                if (val == null) return [];
                if (Array.isArray(val)) return val.map(v => String(v).trim()).filter(Boolean);
                if (typeof val === 'string') return val.split(',').map(s => s.trim()).filter(Boolean);
                return [String(val)];
              };

              // Map the n8n response to filter form fields
              const mappedFilters = {
                search: toStringValue(data.filters.job_description_contains_or),
                location: toStringValue(data.filters.job_location_pattern_or),
                seniority: toStringValue(data.filters.job_seniority_or),
                company: toStringValue(data.filters.company_name_or),
                country: toArray(data.filters.job_country_code_or)[0] || '',
                min_salary_usd: toStringValue(data.filters.min_salary_usd),
                max_salary_usd: toStringValue(data.filters.max_salary_usd),
                posted_at_max_age_days: toStringValue(data.filters.posted_at_max_age_days),
              };
              setAiFilters(mappedFilters);
              // Also set the main filters for the table
              setFilters({
                search: mappedFilters.search,
                status: '',
                seniority: mappedFilters.seniority,
              });
              // Keep results view active; ApplicationsTable will auto-trigger fetch based on aiFilters
              setHasSearchResults(true);
            }
          }
        } catch (err) {
          // Optionally handle polling error
        } finally {
          setIsAIFetching(false);
        }
      }, 3500);
    } catch (error) {
      console.error('AI Search failed:', error);
      // alert(error instanceof Error ? error.message : 'AI Search failed');
      setIsAIFetching(false);
    }
  };

  // Combine basic and advanced filters
  const combinedFilters: Filters = { 
    search: filters.search || '',
    status: filters.status || '',
    remote: filters.remote,
    seniority: filters.seniority || '',
    location: filters.location || ''
  };
  


  return (
    <DashboardLayout>
      {isAIFetching && (
        <FullPageLoader label="Analyzing your prompt" sublabel="Generating smart filters and fetching jobs" />
      )}
      {/* <BlurOverlay /> */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Job Search</h1>
            <p className="text-gray-600 mt-1">Search for jobs across 16 global platforms</p>
          </div>
          <NewApplicationDialog />
        </div>
        
        {/* <ApplicationsStats /> */}
        
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <ApplicationsFilters 
              onFiltersChange={handleFiltersChange} 
              hasSearchResults={hasSearchResults}
              onAISearch={handleAISearch}
              aiFilters={aiFilters}
              onSaveFilters={handleSaveFilters}
              savedFilters={savedFilters}
              onLoadFilter={handleLoadFilter}
              activeFilter={activeFilter}
              hideAISearch={!!activeFilter}
              onBackToSearch={handleBackToSearch}
              revealedJobsHistory={revealedJobsHistory}
              historyLoading={historyLoading}
              jobStatuses={jobStatuses}
              onStatusUpdate={updateJobStatus}
              updatingStatus={updatingStatus}
              generatedDocuments={generatedDocuments}
            />
          </div>
        </div>
        
        <div ref={advancedFiltersRef}>
          <ApplicationsTable 
            filters={combinedFilters} 
            aiFilters={aiFilters} 
            onSaveFilters={handleSaveFilters}
          />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Applications;
