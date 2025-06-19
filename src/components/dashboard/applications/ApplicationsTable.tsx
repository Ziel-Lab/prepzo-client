import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { MoreHorizontal, ExternalLink, Eye, Edit, Trash2, Building, MapPin, Calendar, DollarSign, EyeOff } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useIsMobile } from "@/hooks/use-mobile";
import JobDetailsDialog from "./JobDetailsDialog";
import { toast } from "@/hooks/use-toast";

// Temporary seed data; replaced once live data is fetched
// const INITIAL_APPLICATIONS: Job[] = [
//   {
//     id: 540181866,
//     job_title: "Java Software Developer",
//     url: "https://in.linkedin.com/jobs/view/java-software-developer-at-shivsys-inc-4251801177",
//     date_posted: "2025-06-18",
//     company: "Shivsys Inc.",
//     location: "Gurugram, Haryana",
//     remote: false,
//     hybrid: false,
//     salary_string: "₹8-12 LPA",
//     seniority: "mid_level",
//     easy_apply: true,
//     description: "Hi All,\n\nGreetings from Shivys Softwares\nWe are hiring for Java Developer\n\nJob Role: Java Developer\nExperience: 7+ Years\nLocation: Gurugram\n\nJob Description\nPrimary Skills:\n\nJava Script (Mandatory)\nCore Java\nSpring Boot\nRest APIs\nMicroservices\n\nYou can also share your CV at karan.prajapati@shivsys.com",
//     company_object: {
//       name: "Shivsys Inc.",
//       domain: "shivsys.com",
//       employee_count: 22,
//       logo: "https://media.theirstack.com/company/logo/3/Shivsys2520Inc..jpeg",
//       employee_count_range: "11-50",
//     },
//     hiring_team: [
//       {
//         first_name: "Karan",
//         full_name: "Karan Prajapati",
//         linkedin_url: "https://www.linkedin.com/in/karan-prajapati-707b7620b/",
//       }
//     ],
//     applied_at: "2025-06-19",
//     status: "Applied",
//     match_score: 88,
//     revealed: false,
//   },
//   {
//     id: 540181867,
//     job_title: "Senior Frontend Developer",
//     url: "https://example.com/job",
//     date_posted: "2025-06-17",
//     company: "TechCorp Solutions",
//     location: "Bangalore, Karnataka",
//     remote: true,
//     hybrid: false,
//     salary_string: "₹15-25 LPA",
//     seniority: "senior_level",
//     easy_apply: false,
//     description: "Looking for experienced React developers...",
//     company_object: {
//       name: "TechCorp Solutions",
//       domain: "techcorp.com",
//       employee_count: 500,
//       employee_count_range: "501-1000",
//     },
//     hiring_team: [
//       {
//         first_name: "Priya",
//         full_name: "Priya Sharma",
//         linkedin_url: "https://www.linkedin.com/in/priya-sharma",
//       }
//     ],
//     applied_at: "2025-06-18",
//     status: "Interview",
//     match_score: 92,
//     revealed: true,
//   },
// ];

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
};

export type Filters = {
  search?: string;
  status?: string;
  seniority?: string;
  remote?: boolean;
};

const ApplicationsTable = ({ filters = {} as Filters }: { filters?: Filters }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [applications, setApplications] = useState<Job[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [revealedJobs, setRevealedJobs] = useState<Set<number>>(new Set([540181867]));
  const [chargedJobs, setChargedJobs] = useState<Set<number>>(new Set());
  const INITIAL_CREDITS = 100;
  const [creditsLeft, setCreditsLeft] = useState<number>(INITIAL_CREDITS);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const isMobile = useIsMobile();
  const itemsPerPage = 10;

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

        const res = await fetch( process.env.NEXT_PUBLIC_BACKEND_URL_USER_PORTAL + "/search-jobs", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
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
      const res = await fetch("http://localhost:5000/get-job-details", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
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

    // Deduct one credit and reveal
    setCreditsLeft(cl => cl - 1);
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
                  <h3 className="font-semibold text-lg text-gray-900">
                     {application.job_title}
                  </h3>
                  {isBlurred && (
                    <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200">
                      Hidden
                    </Badge>
                  )}
                </div>
                {!isBlurred && (
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className={getStatusColor(application.status || "Applied")}>
                    {application.status || "Applied"}
                  </Badge>
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

            {/* Location and Work Type */}
            {!isBlurred && (
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                <span>{application.location}</span>
              </div>
              {application.remote && (
                <Badge variant="default" className="text-xs">Remote</Badge>
              )}
              {application.hybrid && (
                <Badge variant="outline" className="text-xs">Hybrid</Badge>
              )}
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
                <Calendar className="h-4 w-4" />
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
              <span>Credits Left: {creditsLeft}/{INITIAL_CREDITS}</span>
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
                    <TableHead className="w-[100px]">Status</TableHead>
                    <TableHead className="w-[120px]">Location</TableHead>
                    <TableHead className="w-[100px]">Posted</TableHead>
                    <TableHead className="w-[120px]">Salary</TableHead>
                    <TableHead className="w-[100px]">Match</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
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
                              <span className="font-medium text-gray-900">
                                {application.job_title}
                              </span>
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
                              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-medium text-blue-600">
                                {application.company?.charAt(0) ?? "?"}
                              </div>
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
                          {isBlurred ? "—" : (
                            <Badge variant="secondary" className={getStatusColor(application.status || "Applied")}> 
                              {application.status || "Applied"}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {isBlurred ? "Hidden" : (
                            <div className="flex flex-col">
                              <div className="flex items-center gap-1 text-sm">
                                <MapPin className="h-3 w-3 text-gray-400" />
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
                          )}
                        </TableCell>
                        <TableCell>
                          {isBlurred ? "—" : (
                            <div className="flex items-center gap-1 text-sm text-gray-600">
                              <Calendar className="h-3 w-3 text-gray-400" />
                              {formatDate(application.date_posted)}
                            </div>
                          )}
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
