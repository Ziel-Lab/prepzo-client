import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Calendar, MapPin, DollarSign, Building, ExternalLink, Globe, Hash, User } from "lucide-react";
import { MarkdownRenderer } from "@/components/blog/MarkdownRenderer";
import Link from "next/link";

// Re-declare a lightweight Job type (should ideally be imported from a shared file)
type HiringTeamMember = {
  first_name?: string;
  full_name?: string;
  linkedin_url?: string;
  role?: string;
};

type Job = {
  id?: number;
  job_title: string;
  url?: string;
  date_posted: string;
  discovered_at?: string;
  company?: string;
  location?: string;
  country?: string;
  remote?: boolean;
  hybrid?: boolean;
  salary_string?: string;
  seniority?: string;
  easy_apply?: boolean;
  description?: string;
  company_object?: {
    employee_count_range?: string;
    country?: string;
    domain?: string;
    logo?: string;
  };
  hiring_team?: HiringTeamMember[];
  employment_statuses?: string[];
};

interface JobDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  application: Job | null;
  isRevealed: boolean;
}

const JobDetailsDialog = ({ isOpen, onClose, application, isRevealed }: JobDetailsDialogProps) => {
  if (!application) return null;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {isRevealed ? application.job_title : "Hidden Position"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Job Information Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <div>
                  <span className="text-sm font-medium">Posted on</span>
                  <p className="text-sm text-gray-600">{formatDate(application.date_posted)}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <div>
                  <span className="text-sm font-medium">Discovered on</span>
                  <p className="text-sm text-gray-600">{application.discovered_at ? formatDate(application.discovered_at) : "N/A"}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Building className="h-4 w-4 text-gray-500" />
                <div>
                  <span className="text-sm font-medium">Remote</span>
                  <p className="text-sm text-gray-600">{application.remote ? "Yes" : "No"}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Building className="h-4 w-4 text-gray-500" />
                <div>
                  <span className="text-sm font-medium">Easy Apply</span>
                  <p className="text-sm text-gray-600">{application.easy_apply ? "Yes" : "No"}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-gray-500" />
                <div>
                  <span className="text-sm font-medium">Country</span>
                  <p className="text-sm text-gray-600">{application.country}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gray-500" />
                <div>
                  <span className="text-sm font-medium">Location</span>
                  <p className="text-sm text-gray-600">{application.location}</p>
                </div>
              </div>

              {/* <div className="flex items-center gap-2">
                <Hash className="h-4 w-4 text-gray-500" />
                <div>
                  <span className="text-sm font-medium">TheirStack Job ID</span>
                  <p className="text-sm text-gray-600">{application.id}</p>
                </div>
              </div> */}

              <div className="flex items-center gap-2">
               
                <div>
                 
                  {isRevealed ? (
                    <Link 
                      href={application.url ?? "#"} 
                      target="_blank" 
                      rel="noopener noreferrer"
                    > <ExternalLink className="h-4 w-4 text-gray-500 mr-2" />
                       <span className="text-sm font-medium">Open Application </span>
                    </Link>
                  ) : (
                    <p className="text-sm text-gray-600">Hidden</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Company Section */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Company</h3>
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-lg bg-blue-100 flex items-center justify-center text-lg font-bold text-blue-600">
                {isRevealed ? (
                  application.company_object?.logo ? (
                    <img
                      src={application.company_object.logo}
                      alt={application.company || "Company Logo"}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                  ) : (
                    application.company?.charAt(0) ?? "?"
                  )
                ) : "?"}
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-lg">
                  {isRevealed ? application.company : "Hidden Company"}
                </h4>
                <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                  <span>{application.company_object?.employee_count_range || "Unknown size"}</span>
                  <span>•</span>
                  <span>{application.company_object?.country || "Unknown location"}</span>
                </div>
                {isRevealed && application.company_object?.domain && (
                  <div className="flex items-center gap-2 mt-1">
                    <Globe className="h-3 w-3" />
                    <span className="text-sm text-blue-600"><Link href={`https://${application.company_object.domain}`} target="_blank" rel="noopener noreferrer">{application.company_object.domain}</Link></span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Hiring Team */}
          {application.hiring_team && application.hiring_team.length > 0 && (
            <>
              <Separator />
              <div>
                <h3 className="text-lg font-semibold mb-4">Hiring Team</h3>
                <div className="space-y-3">
                  {application.hiring_team!.map((member: HiringTeamMember, index: number) => (
                    <div key={index} className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                        <User className="h-5 w-5 text-gray-500" />
                      </div>
                      <div>
                        <p className="font-medium">{member.full_name}</p>
                        {member.role && <p className="text-sm text-gray-600">{member.role}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Job Description */}
          <Separator />
          <div>
            <h3 className="text-lg font-semibold mb-4">Description</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              {application.description ? (
                <MarkdownRenderer content={application.description} />
              ) : (
                <span className="text-gray-500">No description provided.</span>
              )}
            </div>
          </div>

          {/* Additional Details */}
          <Separator />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-600">Seniority</p>
              <p className="text-lg font-semibold">{getSeniorityLevel(application.seniority ?? "")}</p>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-600">Remote Work</p>
              <Badge variant={application.remote ? "default" : "secondary"}>
                {application.remote ? "Remote" : "On-site"}
              </Badge>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-600">Easy Apply</p>
              <Badge variant={application.easy_apply ? "default" : "secondary"}>
                {application.easy_apply ? "Yes" : "No"}
              </Badge>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <p className="text-sm font-medium text-gray-600">Employment</p>
              <p className="text-sm font-medium">
                {application.employment_statuses?.[0]?.replace('_', ' ').toUpperCase() || "Full Time"}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            {isRevealed && (
              <Button asChild>
                <a href={application.url ?? "#"} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Open Job
                </a>
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default JobDetailsDialog;
