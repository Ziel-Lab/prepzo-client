import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { MoreHorizontal, ExternalLink, Eye, Edit, Trash2, Building, MapPin, Calendar, DollarSign, EyeOff, Link2, Search, Filter, History, Loader2, FileText, Sparkles } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useIsMobile } from "@/hooks/use-mobile";
import JobDetailsDialog from "./JobDetailsDialog";
import { toast } from "@/hooks/use-toast";
import { createClient } from "@/utils/supabase/client";
import { useSubscription } from "@/contexts/SubscriptionContext";
import type { FeatureUsage, SubscriptionPlan } from "@/contexts/SubscriptionContext";
import TagInput from "@/components/ui/TagInput";
import countries from 'world-countries';
import CountryMultiSelect from "@/components/ui/CountryMultiSelect";
import ApplicationsFilters from "./ApplicationsFilters";
import Link from "next/link";



const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case "interview":
      return "bg-green-100 text-green-800 hover:bg-green-200";
    case "applied":
      return "bg-blue-100 text-blue-800 hover:bg-blue-200";
    case "review":
      return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200";
    case "rejected":
      return "bg-red-100 text-red-800 hover:bg-red-200";
    case "offer":
      return "bg-purple-100 text-purple-800 hover:bg-purple-200";
    default:
      return "bg-gray-100 text-gray-800 hover:bg-gray-200";
  }
};

const getMatchScoreColor = (score: number) => {
  if (score >= 85) return "text-green-600 font-semibold";
  if (score >= 70) return "text-yellow-600 font-semibold";
  return "text-red-600 font-semibold";
};

const getSeniorityLevel = (seniority: string) => {
  switch (seniority) {
    case "entry_level":
      return "Entry Level";
    case "mid_level":
      return "Mid Level";
    case "senior_level":
      return "Senior Level";
    case "executive":
      return "Executive";
    default:
      return "Not Specified";
  }
};

// ---------------------------------------------------------------------------
// Helpers for country display
// ---------------------------------------------------------------------------

const getFlagEmoji = (countryCode?: string) => {
  if (!countryCode) return "";
  const cleaned = countryCode.trim().toUpperCase();
  if (cleaned.length !== 2 || /[^A-Z]/.test(cleaned)) return "";
  const codePoints = [...cleaned].map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
};

const getCountryName = (countryCode?: string) => {
  if (!countryCode) return "";
  try {
    // Intl.DisplayNames is supported in modern browsers
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - Some TS versions may not have DisplayNames definition
    const dn = new Intl.DisplayNames(["en"], { type: "region" });
    return dn.of(countryCode) || countryCode;
  } catch {
    return countryCode;
  }
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Job = {
  id: number;
  job_title: string;
  url: string;
  date_posted: string;
  company: string;
  location: string;
  remote: boolean;
  hybrid: boolean;
  salary_string?: string;
  seniority: string;
  easy_apply?: boolean;
  description?: string;
  company_object?: {
    name?: string;
    domain?: string;
    logo?: string;
    industry?: string;
    annual_revenue_usd_readable?: string;
    founded_year?: string;
    employee_count_range?: string;
  };
  hiring_team?: Array<{
    first_name?: string;
    full_name?: string;
    linkedin_url?: string;
  }>;
  applied_at?: string;
  status?: string;
  match_score?: number;
  revealed?: boolean;
  employment_statuses?: string[];
  has_blurred_data?: boolean;
  country_code?: string;
  already_revealed?: boolean;
};

// Valid job application statuses
const JOB_STATUSES = {
  revealed: "Revealed",
  applied: "Applied", 
  scheduled: "Scheduled",
  interview: "Interview",
  rejected: "Rejected",
  offered: "Offered",
  accepted: "Accepted",
  withdrawn: "Withdrawn"
} as const;

type JobStatus = keyof typeof JOB_STATUSES;

// Type for the API response structure from revealed jobs history
type RevealedJobApiResponse = {
  data: Job[];
  metadata: {
    total_results?: number;
    total_companies?: number;
    truncated_results: number;
    truncated_companies: number;
  };
};

export type SearchFilters = {
  job_description_contains_or?: string[];
  job_country_code_or?: string[];
  job_seniority_or?: string[];
  remote?: boolean;
  posted_at_max_age_days?: number;
  min_salary_usd?: number;
  max_salary_usd?: number;
  company_name_or?: string[];
  hiring_managers_exists?: boolean;
  job_location_pattern_or?: string[];
};

export type Filters = {
  search?: string;
  status?: string;
  remote?: boolean;
  seniority?: string; 
};

// Extend FeatureUsage and SubscriptionPlan to accommodate job search credits
type ExtendedFeatureUsage = FeatureUsage & { job_search_results_period_count?: number };

type ExtendedSubscriptionPlan = SubscriptionPlan & {
  job_search_results_limit_per_month?: number;
  job_search_results_limit?: number;
};

type GeneratedDocument = {
  current_resume?: string;
  company_website?: string;
  created_at?: string;
};

const ApplicationsTable = ({ filters = {} as Filters }: { filters?: Filters }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [historyCurrentPage, setHistoryCurrentPage] = useState(1);
  const [historyItemsPerPage] = useState(5);
  const [applications, setApplications] = useState<Job[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [showFilters, setShowFilters] = useState<boolean>(true);
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    posted_at_max_age_days: 15,
    job_country_code_or: ["US"],
  });
  // Track job IDs that the user has already revealed in past sessions
  const [revealedJobs, setRevealedJobs] = useState<Set<number>>(new Set());
  // Job IDs that have already consumed a credit (either in previous sessions or this one)
  const [chargedJobs, setChargedJobs] = useState<Set<number>>(new Set());
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [revealedJobsHistory, setRevealedJobsHistory] = useState<Array<{ job_id: number; job_details?: Job; revealed_at: string }>>([]);
  const [jobStatuses, setJobStatuses] = useState<Map<number, JobStatus>>(new Map());
  const [updatingStatus, setUpdatingStatus] = useState<Set<number>>(new Set());
  const [showHistory, setShowHistory] = useState(false);
  const isMobile = useIsMobile();
  const itemsPerPage = 10;
  // const { subscription, isLoading: isSubscriptionLoading, error: subscriptionError } = useSubscription();
  // Change the Map key type from number to string
  const [generatedDocuments, setGeneratedDocuments] = useState<Map<string, GeneratedDocument>>(new Map());

  // Initialize Supabase client once for this component
  const supabase = createClient();

  // ---------------------------------------------------------------------------
  // Credit tracking via feature_usage.job_search_results_period_count
  // ---------------------------------------------------------------------------
  const { subscription } = useSubscription();

  // Prefer the new column `job_search_results_limit`; fallback to *_per_month for backward-compat
  const JOB_SEARCH_LIMIT = (subscription?.subscription_plans as ExtendedSubscriptionPlan | undefined)?.job_search_results_limit ??
                           (subscription?.subscription_plans as ExtendedSubscriptionPlan | undefined)?.job_search_results_limit_per_month ??
                           100;
  
  // Track credits used in this session for immediate UI updates
  const [creditsUsedThisSession, setCreditsUsedThisSession] = useState(0);
  
  // Derive credits left directly from subscription data and subtract session usage
  // Use job_search_results_period_count to match what's used in subscription/overview pages
  const backendCreditsUsed = (subscription?.usage as ExtendedFeatureUsage | undefined)?.job_search_results_period_count ?? 0;
  const creditsLeft = JOB_SEARCH_LIMIT - backendCreditsUsed - creditsUsedThisSession;

  // ---------------------------------------------------------------------------
  // Data fetching
  // ---------------------------------------------------------------------------
  const fetchJobs = async () => {
    try {
      setLoading(true);

      const requestBody = {
        page: currentPage - 1, // API is 0-indexed
        limit: 100,
        posted_at_max_age_days: searchFilters.posted_at_max_age_days || 15,
        blur_company_data: true,
        order_by: [{ desc: true, field: "date_posted" }],
        job_country_code_or: searchFilters.job_country_code_or || ["US"],
        include_total_results: false,
        ...(searchFilters.job_description_contains_or && searchFilters.job_description_contains_or.length > 0 && { job_description_contains_or: searchFilters.job_description_contains_or }),
        ...(searchFilters.job_seniority_or && searchFilters.job_seniority_or.length > 0 && { job_seniority_or: searchFilters.job_seniority_or }),
        ...(searchFilters.company_name_or && searchFilters.company_name_or.length > 0 && { company_name_or: searchFilters.company_name_or }),
        ...(searchFilters.min_salary_usd && { min_salary_usd: searchFilters.min_salary_usd }),
        ...(searchFilters.max_salary_usd && { max_salary_usd: searchFilters.max_salary_usd }),
        ...(searchFilters.hiring_managers_exists !== undefined && { hiring_managers_exists: searchFilters.hiring_managers_exists }),
        ...(searchFilters.job_location_pattern_or && searchFilters.job_location_pattern_or.length > 0 && { job_location_pattern_or: searchFilters.job_location_pattern_or }),
      };

      // Retrieve JWT token from Supabase session for Authorization header
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (!sessionError && session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }

      const res = await fetch(process.env.NEXT_PUBLIC_BACKEND_URL_USER_PORTAL + "/search-jobs", {
        method: "POST",
        headers,
        body: JSON.stringify(requestBody),
      });

      // -------------------------------------------------------------------
      // Handle API errors (e.g. usage limits) and HTTP errors gracefully
      // -------------------------------------------------------------------
      type ApiResponse = {
        data?: unknown;
        error?: string;
        limit?: number;
        usage?: number;
      };

      let json: ApiResponse | null = null;
      try {
        json = await res.json();
      } catch {
        // If parsing fails we will handle via status check below
      }

      // If backend returned an explicit error payload, surface it to the user
      if (json?.error) {
        toast({
          title: "Limit reached",
          description: json.error as string,
        });
        return; // Stop further processing – nothing to render
      }

      // If HTTP status is not OK, use any parsed message or a fallback
      if (!res.ok) {
        const errMsg = (json && typeof json.error === "string") ? json.error : `Failed to fetch jobs – status ${res.status}`;
        throw new Error(errMsg);
      }

      if (json?.data && Array.isArray(json.data)) {
        const jobs = json.data as Job[];
        
        // Process jobs to handle already_revealed flag
        const processedJobs = jobs.map(job => {
          if (job.already_revealed) {
            // Mark as revealed without consuming credits
            setRevealedJobs(prev => new Set(prev).add(job.id));
            setChargedJobs(prev => new Set(prev).add(job.id));
            
            // Job should not be blurred since backend already merged details
            return { ...job, has_blurred_data: false };
          }
          return job;
        });
        
        setApplications(processedJobs);
      }
    } catch (err: unknown) {
      console.error(err);
      const message = err instanceof Error ? err.message : "Unknown error";
      toast({
        title: "Unable to fetch applications",
        description: message,
      });
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // Load previously revealed jobs on component mount so we don't re-charge users
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const fetchRevealedJobsHistory = async () => {
      try {
        setHistoryLoading(true);
        // Retrieve JWT token for Authorization header (same pattern as other calls)
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };
        if (!sessionError && session?.access_token) {
          headers["Authorization"] = `Bearer ${session.access_token}`;
        }

        // We fetch a generous limit so the user sees their recent history – adjust as needed
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL_USER_PORTAL}/revealed-jobs-history?limit=500`,
          { method: "GET", headers }
        );

        if (!res.ok) throw new Error(`Failed to fetch revealed jobs history (status ${res.status})`);

        const history: Array<{ job_id: number; job_details?: Job | RevealedJobApiResponse | string; revealed_at: string; status?: string }> = await res.json();

        // Store the complete history data for the history section
        // Parse job_details if they come as JSON strings
        const parsedHistory = history.map(item => {
          let parsedJobDetails = item.job_details;
          
          // If job_details is a string, try to parse it
          if (typeof item.job_details === 'string') {
            try {
              parsedJobDetails = JSON.parse(item.job_details);
            } catch (e) {
              console.warn('Failed to parse job_details for job_id:', item.job_id, e);
              parsedJobDetails = undefined;
            }
          }
          
          // Handle the nested structure: job_details.data[0] contains the actual job data
          if (parsedJobDetails && typeof parsedJobDetails === 'object' && 'data' in parsedJobDetails) {
            const apiResponse = parsedJobDetails as RevealedJobApiResponse;
            if (Array.isArray(apiResponse.data) && apiResponse.data.length > 0) {
              parsedJobDetails = apiResponse.data[0];
            }
          }
          
          return {
            ...item,
            job_details: parsedJobDetails as Job | undefined
          };
        });
        
        console.log('Revealed jobs history:', parsedHistory); // Debug log
        // Convert the parsed history to have only Job objects in job_details
        const finalHistory: Array<{ job_id: number; job_details?: Job; revealed_at: string }> = parsedHistory.map(item => ({
          job_id: item.job_id,
          job_details: item.job_details as Job | undefined,
          revealed_at: item.revealed_at
        }));
        
        setRevealedJobsHistory(finalHistory || []);

        // Extract and store existing job statuses from the history
        const statusMap = new Map<number, JobStatus>();
        history.forEach(item => {
          // The status is at the top level of each history item
          if (item.status && typeof item.status === 'string' && item.status in JOB_STATUSES) {
            statusMap.set(item.job_id, item.status as JobStatus);
          }
        });
        
        console.log('Extracted statuses:', statusMap); // Debug log
        setJobStatuses(statusMap);

        if (!Array.isArray(history) || history.length === 0) return;

        // Extract IDs and mark them as already revealed/charged
        const ids = history.map((h) => h.job_id);
        setRevealedJobs(new Set(ids));
        setChargedJobs(new Set(ids));

        // If job_details were returned, merge them into current applications cache so
        // they display unblurred even before a new search matches them
        const jobsWithDetails = parsedHistory
          .map((h) => h.job_details)
          .filter((j): j is Job => Boolean(j));

        if (jobsWithDetails.length > 0) {
          setApplications((prev) => {
            const byId = new Map<number, Job>();
            // Index existing
            prev.forEach((j) => byId.set(j.id, j));
            // Merge/overwrite with detailed versions
            jobsWithDetails.forEach((j) => byId.set(j.id, { ...j, has_blurred_data: false }));
            return Array.from(byId.values());
          });
        }
      } catch (err) {
        console.error("Error fetching revealed jobs history", err);
        // We silently fail here – user can still reveal jobs in this session
      } finally {
        setHistoryLoading(false);
      }
    };

    fetchRevealedJobsHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = () => {
    setHasSearched(true);
    setShowFilters(false);
    setCurrentPage(1);
    fetchJobs();
  };

  const handleEditFilters = () => {
    setShowFilters(true);
  };

  // Fetch jobs when page changes (but only after initial search)
  useEffect(() => {
    if (hasSearched && !showFilters) {
      fetchJobs();
    }
  }, [currentPage, hasSearched, showFilters]);

  // Add state for table search query
  const [tableSearchQuery, setTableSearchQuery] = useState<string>("");

  // Apply filters to applications
  const filteredApplications = applications.filter((app) => {
    // Table search filter
    if (tableSearchQuery) {
      const searchLower = tableSearchQuery.toLowerCase();
      const matchesSearch = 
        (app.job_title || '').toLowerCase().includes(searchLower) ||
        (app.company || '').toLowerCase().includes(searchLower) ||
        (app.location || '').toLowerCase().includes(searchLower) ||
        (app.company_object?.industry || '').toLowerCase().includes(searchLower) ||
        getSeniorityLevel(app.seniority).toLowerCase().includes(searchLower);
      if (!matchesSearch) return false;
    }
    if (filters.search && !app.job_title.toLowerCase().includes(filters.search.toLowerCase()) && 
        !app.company.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }
    if (filters.status && (app.status || '').toLowerCase() !== filters.status.toLowerCase()) {
      return false;
    }
    // if (filters.seniority && app.seniority !== filters.seniority) {
    //   return false;
    // }
    if (filters.remote !== undefined && app.remote !== filters.remote) {
      return false;
    }
    // Add more filter logic as needed
    return true;
  });

  const totalPages = Math.ceil(filteredApplications.length / itemsPerPage);

  const fetchJobDetails = async (jobId: number) => {
    try {
      // Retrieve JWT token for Authorization header
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (!sessionError && session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }

      const res = await fetch(process.env.NEXT_PUBLIC_BACKEND_URL_USER_PORTAL + "/get-job-details", {
        method: "POST",
        headers,
        body: JSON.stringify({ job_id: jobId, job_id_or: [jobId], limit: 1, blur_company_data: false }),
      });
      if (!res.ok) throw new Error(`Failed to fetch job ${jobId}`);
      const json = await res.json();
      const jobData: Job | undefined = json?.data?.[0];
      if (jobData) {
        setApplications(prev => prev.map(j => (j.id === jobId ? { ...jobData, has_blurred_data: false } : j)));
      }
    } catch (error) {
      console.error(error);
      toast({ title: "Unable to reveal job", description: (error as Error).message });
    }
  };

  const toggleReveal = async (jobId: number) => {
    const job = applications.find(j => j.id === jobId);
    if (job && !job.has_blurred_data) {
      // No need to reveal unblurred job
      return;
    }

    // If job was already revealed (from backend flag), show a helpful message
    if (job?.already_revealed) {
      toast({
        title: "Already revealed",
        description: "This job was previously revealed and your full details are already shown.",
      });
      return;
    }

    const isCurrentlyRevealed = revealedJobs.has(jobId);

    // If the job is currently revealed, hide it without affecting credits
    if (isCurrentlyRevealed) {
      setRevealedJobs(prev => {
        const ns = new Set(prev);
        ns.delete(jobId);
        return ns;
      });
      return;
    }

    // If the job was revealed before, allow reveal without additional credit deduction
    if (chargedJobs.has(jobId)) {
      setRevealedJobs(prev => new Set(prev).add(jobId));
      return;
    }

    // New reveal attempt – check credits
    if (creditsLeft <= 0) {
      toast({
        title: "No credits left",
        description: "You've used all of your monthly credits. Upgrade or wait until next month to reveal more jobs.",
      });
      return;
    }

    // Mark this job as charged and revealed
    setChargedJobs(prev => new Set(prev).add(jobId));
    setRevealedJobs(prev => new Set(prev).add(jobId));
    
    // Immediately update credits used for UI feedback
    setCreditsUsedThisSession(prev => prev + 1);

    // Fetch full job details
    await fetchJobDetails(jobId);
  };

  const openJobDetails = (application: Job) => {
    if (application.has_blurred_data && !chargedJobs.has(application.id)) {
      toast({
        title: "Reveal first",
        description: "Please reveal this job to view its full details.",
      });
      return;
    }
    setSelectedJob(application);
    setIsDetailsDialogOpen(true);
  };

  // ---------------------------------------------------------------------------
  // Job Status Management
  // ---------------------------------------------------------------------------
  const updateJobStatus = async (jobId: number, newStatus: JobStatus) => {
    try {
      setUpdatingStatus(prev => new Set(prev).add(jobId));

      // Retrieve JWT token for Authorization header
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  // Get status color for badges
  const getStatusBadgeColor = (status: JobStatus) => {
    switch (status) {
      case 'revealed':
        return 'bg-gray-100 text-gray-800';
      case 'applied':
        return 'bg-blue-100 text-blue-800';
      case 'scheduled':
        return 'bg-yellow-100 text-yellow-800';
      case 'interview':
        return 'bg-purple-100 text-purple-800';
      case 'offered':
        return 'bg-green-100 text-green-800';
      case 'accepted':
        return 'bg-green-600 text-white';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'withdrawn':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Mobile Card Component with updated hiding logic
  const MobileApplicationCard = ({ application }: { application: Job }) => {
    const isRevealed = revealedJobs.has(application.id);
    const isBlurred = application.has_blurred_data && !isRevealed;
    
    return (
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="space-y-4">
            {/* Job Title and Status */}
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openJobDetails(application)}
                    className="font-semibold text-lg text-blue-600 hover:underline text-left"
                  >
                    {application.job_title}
                    <Link2 className="h-4 w-4 inline ml-1" />
                  </button>
                  {isBlurred ? (
                    <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200">
                      Hidden
                    </Badge>
                  ) : application.already_revealed && (
                    <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                      Previously Revealed
                    </Badge>
                  )}
                </div>
                {!isBlurred && (
                <div className="flex items-center gap-2 mt-1">
                  {/* <Badge variant="secondary" className={getStatusColor(application.status || "Applied")}>
                    {application.status || "Applied"}
                  </Badge> */}
                  <span className={getMatchScoreColor(application.match_score || 85)}>
                    {application.match_score || 85}% match
                  </span>
                </div>
                )}
              </div>
            </div>

            {/* Company Info */}
            {!isBlurred && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-sm font-medium text-blue-600">
                {isRevealed ? (application.company?.charAt(0) ?? "?") : "?"}
              </div>
              <div className="flex-1">
                <div className="font-medium">
                  {isRevealed ? application.company : "Hidden Company"}
                </div>
                <div className="text-sm text-gray-500">
                  {getSeniorityLevel(application.seniority)} • {application.company_object?.employee_count_range || "Unknown size"}
                </div>
              </div>
            </div>
            )}

            {/* Country, Location, Work Type */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                {getFlagEmoji(application.country_code)} {getCountryName(application.country_code)}
              </div>
              <span>•</span>
              <div className="flex items-center gap-1">
                {application.location}
              </div>
              {application.remote && (
                <Badge variant="default" className="text-xs">Remote</Badge>
              )}
              {application.hybrid && (
                <Badge variant="outline" className="text-xs">Hybrid</Badge>
              )}
            </div>
            
            {/* Hiring team & Industry */}
            {!isBlurred && application.hiring_team?.length && (
              <div className="text-sm text-gray-600 flex items-center gap-2">
                <span className="font-medium">Hiring:</span>
                {application.hiring_team.map((m) => (
                  <span key={m.first_name}>{m.first_name}</span>
                ))}
              </div>
            )}

            {!isBlurred && application.company_object?.industry && (
              <div className="text-sm text-gray-600">
                <span className="font-medium">Industry:</span> {application.company_object?.industry}
              </div>
            )}

            {/* Date and Salary */}
            {!isBlurred && (
            <div className="flex items-center justify-between text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <span>{application.salary_string || "Not disclosed"}</span>
              </div>
              <div className="flex items-center gap-1">
                
                <span>{formatDate(application.date_posted)}</span>
              </div>
            </div>
            )}

             {/* Employment Statuses */}
             {!isBlurred && application.employment_statuses && application.employment_statuses.length > 0 && (
              <div className="text-xs text-gray-500">
                <span className="font-medium">Employment:</span> {application.employment_statuses.join(", ")}
              </div>
            )}

            {/* Easy Apply */}
            {!isBlurred && application.easy_apply && (
              <Badge variant="secondary" className="text-xs bg-green-50 text-green-700 mt-1">
                Easy Apply
              </Badge>
            )}

            {/* Employee Count Range */}
            {!isBlurred && application.company_object?.employee_count_range && (
              <div className="text-xs text-gray-500">
                <span className="font-medium">Employees:</span> {application.company_object.employee_count_range}
              </div>
            )}

            {/* Revenue */}
            {!isBlurred && application.company_object?.annual_revenue_usd_readable && (
              <div className="text-xs text-gray-500">
                <span className="font-medium">Revenue:</span> {application.company_object.annual_revenue_usd_readable}
              </div>
            )}

            {/* Founded Year */}
            {!isBlurred && application.company_object?.founded_year && (
              <div className="text-xs text-gray-500">
                <span className="font-medium">Founded:</span> {application.company_object.founded_year}
              </div>
            )}


            {/* Actions */}
            <div className="flex items-center justify-between pt-2 border-t">
              {application.has_blurred_data && !application.already_revealed && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => toggleReveal(application.id)}
                className="flex items-center gap-2"
              >
                {isRevealed ? (
                  <>
                    <EyeOff className="h-4 w-4" />
                    Hide Details
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4" />
                    Reveal Details
                  </>
                )}
              </Button>
              )}
              {application.already_revealed && (
                <Badge variant="outline" className="h-8 px-3 text-xs bg-green-50 text-green-700 border-green-200">
                  <Eye className="h-3 w-3 mr-1" />
                  Revealed
                </Badge>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuItem onClick={() => openJobDetails(application)}>
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </DropdownMenuItem>
                  {/* <DropdownMenuItem>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Status
                  </DropdownMenuItem> */}
                  {/* {isRevealed && (
                    <DropdownMenuItem>
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Open Job
                    </DropdownMenuItem>
                  )} */}
                  {/* <DropdownMenuItem className="text-red-600">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem> */}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Show filter form if filters haven't been applied yet or user wants to edit
  let filterSection;

  // History Section Component - shows in both filter and results view
  const HistorySection = () => {
    const totalHistoryPages = Math.ceil(revealedJobsHistory.length / historyItemsPerPage);
    const startIndex = (historyCurrentPage - 1) * historyItemsPerPage;
    const endIndex = startIndex + historyItemsPerPage;
    const currentHistoryItems = revealedJobsHistory.slice(startIndex, endIndex);

    return (
      <Card className="mb-4">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold flex items-center">
              <History className="mr-2 h-5 w-5" />
              Saved Jobs ({revealedJobsHistory.length})
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowHistory(!showHistory)}
            >
              {showHistory ? "Hide" : "Show"} History
            </Button>
          </div>
        </CardHeader>
        {showHistory && (
          <CardContent>
            {historyLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Loading revealed jobs history...
              </div>
            ) : revealedJobsHistory.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">
                No previously revealed jobs found.
              </p>
            ) : (
              <>
                <div className="space-y-4">
                  {currentHistoryItems.map((item) => (
                    <div key={item.job_id} className="border rounded-lg p-4 bg-gradient-to-r from-gray-50 to-white hover:shadow-md transition-shadow">
                      {/* Mobile-first layout */}
                      <div className="space-y-3">
                        {/* Job title and status - full width on mobile */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start gap-2 mb-2">
                              <h4 className="font-semibold text-base sm:text-sm text-gray-900 line-clamp-2">
                                {item.job_details?.job_title || `Unknown Position (ID: ${item.job_id})`}
                              </h4>
                              <Badge 
                                variant="secondary" 
                                className={`text-xs font-medium ${getStatusBadgeColor(jobStatuses.get(item.job_id) || 'revealed')} border-0`}
                              >
                                {JOB_STATUSES[jobStatuses.get(item.job_id) || 'revealed']}
                              </Badge>
                            </div>
                          </div>

                          {/* Status dropdown - takes full width on mobile */}
                          <div className="w-full sm:w-auto">
                            <Select
                              value={jobStatuses.get(item.job_id) || 'revealed'}
                              onValueChange={(value: JobStatus) => updateJobStatus(item.job_id, value)}
                              disabled={updatingStatus.has(item.job_id)}
                            >
                              <SelectTrigger 
                                className={`
                                  w-full sm:w-36 h-9 text-sm 
                                  border-2 border-green-500 
                                  bg-green-50 
                                  hover:bg-green-100 
                                  transition-all 
                                  duration-200 
                                  focus:ring-2 
                                  focus:ring-green-200 
                                  focus:border-green-500
                                  ${updatingStatus.has(item.job_id) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                                `}
                              >
                                <SelectValue placeholder="Update Status" className="text-green-700 font-medium" />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.entries(JOB_STATUSES).map(([key, label]) => (
                                  <SelectItem 
                                    key={key} 
                                    value={key} 
                                    className="text-sm hover:bg-green-50 cursor-pointer"
                                  >
                                    {label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        {/* Company and job details */}
                        {item.job_details ? (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm text-gray-700">
                              <Building className="h-4 w-4 text-gray-400 flex-shrink-0" />
                              <span className="font-medium">{item.job_details.company}</span>
                            </div>
                            
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600">
                              {item.job_details.location && (
                                <div className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3 text-gray-400" />
                                  <span>{item.job_details.location}</span>
                                </div>
                              )}
                              
                              {item.job_details.seniority && (
                                <div className="flex items-center gap-1">
                                  <span className="text-gray-400">•</span>
                                  <span>{getSeniorityLevel(item.job_details.seniority)}</span>
                                </div>
                              )}
                              
                              {item.job_details.remote && (
                                <Badge variant="outline" className="text-xs border-green-200 text-green-700 bg-green-50">
                                  Remote
                                </Badge>
                              )}
                              
                              {item.job_details.hybrid && (
                                <Badge variant="outline" className="text-xs border-blue-200 text-blue-700 bg-blue-50">
                                  Hybrid
                                </Badge>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="text-sm text-gray-500 italic">
                            Job details not available
                          </div>
                        )}

                        {/* Footer with date and actions */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-3 pt-2 border-t border-gray-100">
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Calendar className="h-3 w-3" />
                            <span>Revealed on {formatDate(item.revealed_at)}</span>
                          </div>
                          
                          {/* Action buttons - responsive layout */}
                          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full">
                            {item.job_details && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openJobDetails(item.job_details!)}
                                className="flex-1 sm:flex-none h-8 text-xs"
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                View
                              </Button>
                            )}
                            {item.job_details?.url && (
                              <Button
                                variant="outline"
                                size="sm"
                                asChild
                                className="flex-1 sm:flex-none h-8 text-xs"
                              >
                                <Link href={item.job_details.url} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="h-3 w-3 mr-1" />
                                  Apply
                                </Link>
                              </Button>
                            )}
                            {item.job_details && (
                              <>
                                {item.job_details.company_object?.domain && generatedDocuments.has(item.job_details.company_object.domain) ? (
                                  // Show View Resume button if document exists
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    asChild
                                    className="flex-1 sm:flex-none h-8 text-xs bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                                  >
                                    <Link 
                                      href={generatedDocuments.get(item.job_details.company_object.domain)?.current_resume || '#'}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                    >
                                      <FileText className="h-3 w-3 mr-1" />
                                      View Resume
                                    </Link>
                                  </Button>
                                ) : (
                                  // Show Generate Resume button if no document exists
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    asChild
                                    className="flex-1 sm:flex-none h-8 text-xs"
                                  >
                                    <Link 
                                      href={`/dashboard/tools/resume-generator?jobDescription=${encodeURIComponent(
                                        item.job_details.description || ""
                                      )}&companyWebsite=${encodeURIComponent(
                                        item.job_details.company_object?.domain || ""
                                      )}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                    >
                                      <FileText className="h-3 w-3 mr-1" />
                                      Generate Resume
                                    </Link>
                                  </Button>
                                )}
                                
                                {/* Similar pattern for Cover Letter */}
                                {item.job_details.company_object?.domain && generatedDocuments.has(item.job_details.company_object.domain) ? (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    asChild
                                    className="flex-1 sm:flex-none h-8 text-xs bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                                  >
                                    <Link 
                                      href={generatedDocuments.get(item.job_details.company_object.domain)?.current_resume || '#'}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                    >
                                      <Sparkles className="h-3 w-3 mr-1" />
                                      View Cover Letter
                                    </Link>
                                  </Button>
                                ) : (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    asChild
                                    className="flex-1 sm:flex-none h-8 text-xs"
                                  >
                                    <Link
                                      href={`/dashboard/tools/cover-letter?jobDescription=${encodeURIComponent(
                                        item.job_details.description || ""
                                      )}&companyWebsite=${encodeURIComponent(
                                        item.job_details.company_object?.domain || ""
                                      )}`}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                    >
                                      <Sparkles className="h-3 w-3 mr-1" />
                                      Generate Cover Letter
                                    </Link>
                                  </Button>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {totalHistoryPages > 1 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4 pt-4 border-t">
                    <div className="text-sm text-gray-500 w-full sm:w-auto order-2 sm:order-1 text-center sm:text-left">
                      Showing {startIndex + 1}-{Math.min(endIndex, revealedJobsHistory.length)} of {revealedJobsHistory.length}
                    </div>
                    <div className="flex items-center justify-center w-full sm:w-auto gap-1 order-1 sm:order-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (historyCurrentPage > 1) setHistoryCurrentPage(prev => prev - 1);
                        }}
                        disabled={historyCurrentPage === 1}
                        className="h-8 px-3"
                      >
                        Previous
                      </Button>
                      
                      <div className="flex items-center">
                        {Array.from({ length: totalHistoryPages }, (_, i) => (
                          <Button
                            key={i + 1}
                            variant={historyCurrentPage === i + 1 ? "default" : "outline"}
                            size="sm"
                            onClick={() => setHistoryCurrentPage(i + 1)}
                            className={`h-8 w-8 p-0 ${
                              historyCurrentPage === i + 1 
                                ? "bg-primary text-primary-foreground" 
                                : "text-gray-600"
                            }`}
                          >
                            {i + 1}
                          </Button>
                        ))}
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (historyCurrentPage < totalHistoryPages) setHistoryCurrentPage(prev => prev + 1);
                        }}
                        disabled={historyCurrentPage === totalHistoryPages}
                        className="h-8 px-3"
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        )}
      </Card>
    );
  };

  if (showFilters || !hasSearched) {
    filterSection = (
      <>
        <HistorySection />
        {/* Job Search Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl font-bold flex items-center">
              <Filter className="mr-2 h-5 w-5" />
              Job Search Filters
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="job_description">Job Keywords</Label>
                <TagInput
                  value={searchFilters.job_description_contains_or || []}
                  onChange={tags => setSearchFilters(prev => ({ ...prev, job_description_contains_or: tags.length ? tags : undefined }))}
                  placeholder="e.g. React, Python — press Enter after each"
                  label={undefined}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company_name">Company Name</Label>
                <TagInput
                  value={searchFilters.company_name_or || []}
                  onChange={tags => setSearchFilters(prev => ({ ...prev, company_name_or: tags.length ? tags : undefined }))}
                  placeholder="e.g. Google, Microsoft — press Enter after each"
                  label={undefined}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <TagInput
                  value={searchFilters.job_location_pattern_or || []}
                  onChange={tags => setSearchFilters(prev => ({ ...prev, job_location_pattern_or: tags.length ? tags : undefined }))}
                  placeholder="e.g. Bangalore, Karnataka — press Enter after each"
                  label={undefined}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">Countries</Label>
                <CountryMultiSelect
                  selectedCountries={searchFilters.job_country_code_or || []}
                  onSelectionChange={(selected: string[]) => setSearchFilters(prev => ({ ...prev, job_country_code_or: selected }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="seniority">Seniority Level</Label>
                <Select
                  value={searchFilters.job_seniority_or?.[0] || "any"}
                  onValueChange={(value) => setSearchFilters(prev => ({ ...prev, job_seniority_or: value === "any" ? undefined : [value] }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Any level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any level</SelectItem>
                    <SelectItem value="junior">Junior</SelectItem>
                    <SelectItem value="mid_level">Mid Level</SelectItem>
                    <SelectItem value="senior">Senior</SelectItem>
                    <SelectItem value="staff">Staff</SelectItem>
                    <SelectItem value="c_level">C-Level</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="posted_days">Posted within</Label>
                <Select
                  value={searchFilters.posted_at_max_age_days?.toString() || "15"}
                  onValueChange={(value) => setSearchFilters(prev => ({ ...prev, posted_at_max_age_days: parseInt(value) }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select timeframe" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Last 24 hours</SelectItem>
                    <SelectItem value="3">Last 3 days</SelectItem>
                    <SelectItem value="7">Last week</SelectItem>
                    <SelectItem value="15">Last 2 weeks</SelectItem>
                    <SelectItem value="30">Last month</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="min_salary">Min Salary (USD) Annual</Label>
                <Input
                  id="min_salary"
                  type="number"
                  placeholder="e.g. 100000"
                  value={searchFilters.min_salary_usd || ""}
                  onChange={(e) => setSearchFilters(prev => ({ ...prev, min_salary_usd: e.target.value ? parseInt(e.target.value) : undefined }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="max_salary">Max Salary (USD) Annual</Label>
                <Input
                  id="max_salary"
                  type="number"
                  placeholder="e.g. 200000"
                  value={searchFilters.max_salary_usd || ""}
                  onChange={(e) => setSearchFilters(prev => ({ ...prev, max_salary_usd: e.target.value ? parseInt(e.target.value) : undefined }))}
                />
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h3 className="text-sm font-medium">Filters</h3>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="remote"
                    checked={searchFilters.remote || false}
                    onCheckedChange={(checked) => setSearchFilters(prev => ({ ...prev, remote: checked === true }))}
                  />
                  <Label htmlFor="remote">Remote</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="hiring_managers"
                    checked={searchFilters.hiring_managers_exists || false}
                    onCheckedChange={(checked) => setSearchFilters(prev => ({ ...prev, hiring_managers_exists: checked === true }))}
                  />
                  <Label htmlFor="hiring_managers">Has Hiring Manager</Label>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button onClick={handleSearch} className="flex-1" disabled={loading}>
                <Search className="mr-2 h-4 w-4" />
                {loading ? "Searching..." : "Search Jobs"}
              </Button>
              {hasSearched && (
                <Button variant="outline" onClick={() => setShowFilters(false)}>
                  Cancel
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </>
    );
  } else {
    filterSection = (
      <>
        <HistorySection />
        <ApplicationsFilters
          onFiltersChange={(filters) => setTableSearchQuery(filters.search || "")}
          hasSearchResults={filteredApplications.length > 0}
        />
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold">Applications ({filteredApplications.length})</CardTitle>
              <Button variant="outline" size="sm" onClick={handleEditFilters}>
                <Filter className="mr-2 h-4 w-4" />
                Edit Filters
              </Button>
            </div>
            <div className="text-sm text-gray-500 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
              <span>Credits Left: {creditsLeft}/{JOB_SEARCH_LIMIT}</span>
              <span>•</span>
              <span>
                Showing 1-{Math.min(itemsPerPage, filteredApplications.length)} of {filteredApplications.length} results
              </span>
              {loading && (
                <span className="text-blue-600 animate-pulse">Fetching latest jobs…</span>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {isMobile ? (
              // Mobile Layout
              <div className="p-4">
                {filteredApplications.map((application) => (
                  <MobileApplicationCard key={application.id} application={application} />
                ))}
              </div>
            ) : (
              // Desktop Table Layout with updated hiding logic
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="w-[400px] sticky left-0 bg-gray-50 z-10 border-r">Job Details</TableHead>
                      <TableHead className="w-[180px]">Company</TableHead>
                      <TableHead className="w-[120px]">Country</TableHead>
                      <TableHead className="w-[150px]">Location</TableHead>
                      <TableHead className="w-[140px]">Hiring Team</TableHead>
                      <TableHead className="w-[130px]">Posted</TableHead>
                      <TableHead className="w-[140px]">Salary</TableHead>
                      <TableHead className="w-[120px]">Match</TableHead>
                      <TableHead className="w-[140px]">Actions</TableHead>
                      <TableHead className="w-[140px]">Employment</TableHead>
                      <TableHead className="w-[120px]">Easy Apply</TableHead>
                      <TableHead className="w-[140px]">Revenue</TableHead>
                      <TableHead className="w-[120px]">Founded</TableHead>
                      <TableHead className="w-[140px]">Employees</TableHead>
                      <TableHead className="w-[140px]">Industry</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredApplications.map((application) => {
                      const isRevealed = revealedJobs.has(application.id);
                      const isBlurred = application.has_blurred_data && !isRevealed;
                      
                      return (
                        <TableRow key={application.id} className="hover:bg-gray-50">
                          <TableCell className="sticky left-0 bg-white hover:bg-gray-50 z-10 border-r">
                            <div className="flex flex-col">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => openJobDetails(application)}
                                  className="font-semibold text-lg text-blue-600 hover:underline text-left"
                                >
                                  {application.job_title}
                                  <Link2 className="h-4 w-4 inline ml-1" />
                                </button>
                                {isBlurred ? (
                                  <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200">
                                    Hidden
                                  </Badge>
                                ) : application.already_revealed && (
                                  <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                                    Previously Revealed
                                  </Badge>
                                )}
                              </div>
                              {!isBlurred && (
                                <div className="flex items-center gap-3 mt-1">
                                  <div className="flex items-center gap-1 text-sm text-gray-500">
                                    <Building className="h-3 w-3" />
                                    {getSeniorityLevel(application.seniority)}
                                  </div>
                                  <div className="flex items-center gap-1 text-sm text-gray-500">
                                    <span>•</span>
                                    {application.company_object?.employee_count_range || "Unknown size"}
                                  </div>
                                  {application.easy_apply && (
                                    <Badge variant="secondary" className="text-xs bg-green-50 text-green-700">
                                      Easy Apply
                                    </Badge>
                                  )}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {isBlurred ? (
                              <span className="text-sm text-gray-500">Hidden</span>
                            ) : (
                              <div className="flex items-center gap-2">
                                {application.company_object?.logo ? (
                                  <img
                                    src={application.company_object.logo}
                                    alt={application.company}
                                    className="w-8 h-8 rounded-full object-cover"
                                  />
                                ) : (
                                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-medium text-blue-600">
                                    {application.company?.charAt(0) ?? "?"}
                                  </div>
                                )}
                                <div className="flex flex-col">
                                  <span className="font-medium text-sm">
                                    {application.company}
                                  </span>
                                  {(() => {
                                    const hasTeam = application.hiring_team && application.hiring_team.length > 0;
                                    if (hasTeam) {
                                      return (
                                        <span className="text-xs text-gray-500">
                                          {application.hiring_team![0].first_name}
                                        </span>
                                      );
                                    }
                                    return null;
                                  })()}
                                </div>
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            
                              <span className="text-sm flex items-center gap-1">
                                {getFlagEmoji(application.country_code)}
                                {getCountryName(application.country_code)}
                              </span>
                            
                          </TableCell>
                          <TableCell>
                            
                              <div className="flex flex-col">
                                <div className="flex items-center gap-1 text-sm">
                                  
                                  {application.location}
                                </div>
                                <div className="flex items-center gap-1 mt-1">
                                  {application.remote && (
                                    <Badge variant="default" className="text-xs">Remote</Badge>
                                  )}
                                  {application.hybrid && (
                                    <Badge variant="outline" className="text-xs">Hybrid</Badge>
                                  )}
                                </div>
                              </div>
                            
                          </TableCell>
                          <TableCell>
                            {application.hiring_team?.map((teamMember) => (
                              <div key={teamMember.first_name} className="flex items-center gap-1 text-sm">
                                <span>{teamMember.first_name}</span>
                              </div>
                            ))}
                          </TableCell>
                          <TableCell>
                            {isBlurred ? "—" : (
                              <div className="flex items-center gap-1 text-sm">
                                {formatDate(application.date_posted)}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            {isBlurred ? "—" : (
                              <div className="flex items-center gap-1 text-sm">
                                {application.salary_string || "Not disclosed"}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            {isBlurred ? "—" : (
                              <span className={getMatchScoreColor(application.match_score || 85)}>
                                {application.match_score || 85}%
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full">
                              {application.has_blurred_data && !application.already_revealed && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => toggleReveal(application.id)}
                                  className="h-8 px-2"
                                >
                                  {isRevealed ? (
                                    <>
                                      <EyeOff className="h-3 w-3 mr-1" />
                                      Hide
                                    </>
                                  ) : (
                                    <>
                                      <Eye className="h-3 w-3 mr-1" />
                                      Reveal
                                    </>
                                  )}
                                </Button>
                              )}
                              {application.already_revealed && (
                                <Badge variant="outline" className="h-8 px-3 text-xs bg-green-50 text-green-700 border-green-200">
                                  <Eye className="h-3 w-3 mr-1" />
                                  Revealed
                                </Badge>
                              )}
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-40">
                                  <DropdownMenuItem onClick={() => openJobDetails(application)}>
                                    <Eye className="h-4 w-4 mr-2" />
                                    View Details
                                  </DropdownMenuItem>
                                  {/* <DropdownMenuItem>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Edit Status
                                  </DropdownMenuItem>
                                  {isRevealed && (
                                    <DropdownMenuItem>
                                      <ExternalLink className="h-4 w-4 mr-2" />
                                      Open Job
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuItem className="text-red-600">
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Delete
                                  </DropdownMenuItem> */}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </TableCell>
                          <TableCell>
                            {application.employment_statuses?.join(", ")}
                          </TableCell>
                          <TableCell>
                            {application.easy_apply ? "Yes" : "No"}
                          </TableCell>
                          <TableCell>
                            {application.company_object?.annual_revenue_usd_readable || "Not disclosed"}
                          </TableCell>
                          <TableCell>
                            {application.company_object?.founded_year || "-"}
                          </TableCell>
                          <TableCell>
                            {application.company_object?.employee_count_range || "Not disclosed"}
                          </TableCell>
                          <TableCell>
                            {application.company_object?.industry || "Not disclosed"}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
            
            <div className="flex flex-col sm:flex-row items-center justify-between px-4 sm:px-6 py-4 border-t gap-4">
              <div className="text-sm text-gray-500 order-2 sm:order-1">
                Rows per page: 25
              </div>
              <Pagination className="order-1 sm:order-2">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious 
                      href="#" 
                      className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                  {[...Array(totalPages)].map((_, i) => (
                    <PaginationItem key={i + 1}>
                      <PaginationLink 
                        href="#" 
                        isActive={currentPage === i + 1}
                        onClick={() => setCurrentPage(i + 1)}
                      >
                        {i + 1}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  <PaginationItem>
                    <PaginationNext 
                      href="#" 
                      className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          </CardContent>
        </Card>
      </>
    );
  }

  return (
    <>
      {filterSection}
      {/* Job Details Dialog */}
      <JobDetailsDialog
        isOpen={isDetailsDialogOpen}
        onClose={() => setIsDetailsDialogOpen(false)}
        application={selectedJob}
        isRevealed={selectedJob ? (!selectedJob.has_blurred_data || revealedJobs.has(selectedJob.id)) : false}
        onStatusUpdate={updateJobStatus}
      />
    </>
  );
};

export default ApplicationsTable;
