import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { MoreHorizontal, ExternalLink, Eye, Edit, Trash2, Building, MapPin, Calendar, DollarSign, EyeOff, Link2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useIsMobile } from "@/hooks/use-mobile";
import JobDetailsDialog from "./JobDetailsDialog";
import { toast } from "@/hooks/use-toast";
import { createClient } from "@/utils/supabase/client";
import { useSubscription } from "@/contexts/SubscriptionContext";
import type { FeatureUsage, SubscriptionPlan } from "@/contexts/SubscriptionContext";



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
  industry?: string;
  description?: string;
  company_object?: {
    name?: string;
    domain?: string;
    employee_count?: number;
    logo?: string;
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
};

export type Filters = {
  search?: string;
  status?: string;
  seniority?: string;
  remote?: boolean;
};

// Extend FeatureUsage to include job_search_results_count until context is updated
type ExtendedFeatureUsage = FeatureUsage & { job_search_results_count?: number };

type ExtendedSubscriptionPlan = SubscriptionPlan & { job_search_results_limit_per_month?: number };

const ApplicationsTable = ({ filters = {} as Filters }: { filters?: Filters }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [applications, setApplications] = useState<Job[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [revealedJobs, setRevealedJobs] = useState<Set<number>>(new Set([540181867]));
  const [chargedJobs, setChargedJobs] = useState<Set<number>>(new Set());
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const isMobile = useIsMobile();
  const itemsPerPage = 10;

  // Initialize Supabase client once for this component
  const supabase = createClient();

  // ---------------------------------------------------------------------------
  // Credit tracking via feature_usage.job_search_results_count
  // ---------------------------------------------------------------------------
  const { subscription } = useSubscription();

  const JOB_SEARCH_LIMIT = (subscription?.subscription_plans as ExtendedSubscriptionPlan | undefined)?.job_search_results_limit_per_month ?? 100;
  const initialUsed = (subscription?.usage as ExtendedFeatureUsage | undefined)?.job_search_results_count ?? 0;

  const [creditsLeft, setCreditsLeft] = useState<number>(JOB_SEARCH_LIMIT - initialUsed);

  // Re-initialise credits when subscription data changes (e.g. realtime update)
  useEffect(() => {
    if (subscription) {
      const used = (subscription?.usage as ExtendedFeatureUsage | undefined)?.job_search_results_count ?? 0;
      setCreditsLeft(JOB_SEARCH_LIMIT - used);
    }
  }, [subscription, JOB_SEARCH_LIMIT]);

  // ---------------------------------------------------------------------------
  // Data fetching
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setLoading(true);

        const requestBody = {
          page: currentPage - 1, // API is 0-indexed
          limit: itemsPerPage,
          posted_at_max_age_days: 15,
          blur_company_data: true,
          order_by: [{ desc: true, field: "date_posted" }],
          job_country_code_or: ["IN"],
          include_total_results: false,
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

        if (!res.ok) {
          throw new Error(`Failed to fetch jobs – status ${res.status}`);
        }

        const json = await res.json();
        if (json?.data && Array.isArray(json.data)) {
          setApplications(json.data as Job[]);
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

    fetchJobs();
  }, [currentPage]);

  // Apply filters to applications
  const filteredApplications = applications.filter((app) => {
    if (filters.search && !app.job_title.toLowerCase().includes(filters.search.toLowerCase()) && 
        !app.company.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }
    if (filters.status && (app.status || '').toLowerCase() !== filters.status.toLowerCase()) {
      return false;
    }
    if (filters.seniority && app.seniority !== filters.seniority) {
      return false;
    }
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
        body: JSON.stringify({ job_id_or: [jobId], limit: 1, blur_company_data: false }),
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
    if (creditsLeft === 0) {
      toast({
        title: "No credits left",
        description: "You've used all of your monthly credits. Upgrade or wait until next month to reveal more jobs.",
      });
      return;
    }

    // Deduct one credit locally; backend should update usage separately
    setCreditsLeft(cl => Math.max(cl - 1, 0));
    setChargedJobs(prev => new Set(prev).add(jobId));
    setRevealedJobs(prev => new Set(prev).add(jobId));

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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
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
                  {isBlurred && (
                    <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200">
                      Hidden
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

            {!isBlurred && application.industry && (
              <div className="text-sm text-gray-600">
                <span className="font-medium">Industry:</span> {application.industry}
              </div>
            )}

            {/* Date and Salary */}
            {!isBlurred && (
            <div className="flex items-center justify-between text-sm text-gray-600">
              <div className="flex items-center gap-1">
                {/* <DollarSign className="h-4 w-4" /> */}
                <span>{application.salary_string || "Not disclosed"}</span>
              </div>
              <div className="flex items-center gap-1">
                
                <span>{formatDate(application.date_posted)}</span>
              </div>
            </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-2 border-t">
              {application.has_blurred_data && (
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
                  <DropdownMenuItem>
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
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">Applications ({filteredApplications.length})</CardTitle>
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
                    <TableHead className="w-[350px]">Job Details</TableHead>
                    <TableHead className="w-[140px]">Company</TableHead>
                    <TableHead className="w-[100px]">Country</TableHead>
                    <TableHead className="w-[120px]">Location</TableHead>
                    <TableHead className="w-[100px]">Posted</TableHead>
                    <TableHead className="w-[120px]">Salary</TableHead>
                    <TableHead className="w-[100px]">Hiring Team</TableHead>
                    <TableHead className="w-[100px]">Match</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                    <TableHead className="w-[100px]">Industry</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredApplications.map((application) => {
                    const isRevealed = revealedJobs.has(application.id);
                    const isBlurred = application.has_blurred_data && !isRevealed;
                    
                    return (
                      <TableRow key={application.id} className="hover:bg-gray-50">
                        <TableCell>
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => openJobDetails(application)}
                                className="font-semibold text-lg text-blue-600 hover:underline text-left"
                              >
                                {application.job_title}
                                <Link2 className="h-4 w-4 inline ml-1" />
                              </button>
                              {isBlurred && (
                                <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200">
                                  Hidden
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
                        {/* <TableCell>
                          {isBlurred ? "—" : (
                            <Badge variant="secondary" className={getStatusColor(application.status || "Applied")}> 
                              {application.status || "Applied"}
                            </Badge>
                          )}
                        </TableCell> */}
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
                                  <Badge variant="default" className="text-xs">
                                    Remote
                                  </Badge>
                                )}
                                {application.hybrid && (
                                  <Badge variant="outline" className="text-xs">
                                    Hybrid
                                  </Badge>
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
                          
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                              
                              {formatDate(application.date_posted)}
                            </div>
                          
                        </TableCell>
                        <TableCell>
                          {isBlurred ? "—" : (
                            <div className="flex items-center gap-1 text-sm">
                              <DollarSign className="h-3 w-3 text-gray-400" />
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
                          <div className="flex items-center gap-1">
                            {application.has_blurred_data && (
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
                                <DropdownMenuItem>
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
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                        <TableCell>
                          {application.industry}
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

      {/* Job Details Dialog */}
      <JobDetailsDialog
        isOpen={isDetailsDialogOpen}
        onClose={() => setIsDetailsDialogOpen(false)}
        application={selectedJob}
        isRevealed={selectedJob ? (!selectedJob.has_blurred_data || revealedJobs.has(selectedJob.id)) : false}
      />
    </>
  );
};

export default ApplicationsTable;
