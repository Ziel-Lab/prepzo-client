"use client";
import { useState, useMemo, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Search, Filter, Plus, Building, Calendar, MapPin,  ArrowUpDown, MoreHorizontal, Edit, Trash2, ExternalLink, Link2 } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import Link from "next/link";

type JobStatus = "applied" | "shortlisted" | "interview_scheduled" | "interviewed" | "rejected" | "withdrawn" | "offer_letter" | "offer_accepted";

interface Job {
  id: string;
  company: string;
  position: string;
  location: string;
  company_url?: string;
  appliedDate: string;
  status: JobStatus;
  notes?: string;
  nextAction?: string;
  nextActionDate?: string;
  resume_url?: string;
  cover_letter_url?: string;
}

const mockJobs: Job[] = [];

const statusConfig: Record<JobStatus, { label: string; color: string }> = {
  applied: { label: "Applied", color: "bg-blue-100 text-blue-800" },
  shortlisted: { label: "Shortlisted", color: "bg-purple-100 text-purple-800" },
  interview_scheduled: { label: "Interview Scheduled", color: "bg-yellow-100 text-yellow-800" },
  interviewed: { label: "Interviewed", color: "bg-orange-100 text-orange-800" },
  rejected: { label: "Rejected", color: "bg-red-100 text-red-800" },
  withdrawn: { label: "Withdrawn", color: "bg-gray-100 text-gray-800" },
  offer_letter: { label: "Offer Letter", color: "bg-green-100 text-green-800" },
  offer_accepted: { label: "Offer Accepted", color: "bg-emerald-100 text-emerald-800" }
};

type SortField = "company" | "position" | "appliedDate" | "status";
type SortDirection = "asc" | "desc";

const JobTracker = () => {
  const [jobs, setJobs] = useState<Job[]>(mockJobs);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>("appliedDate");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editJob, setEditJob] = useState<Partial<Job> & { id?: string }>({});
  const [loading, setLoading] = useState(false);
  const [newJob, setNewJob] = useState<Partial<Job>>({
    company: "",
    position: "",
    location: "",
    company_url: "",
    appliedDate: new Date().toISOString().split('T')[0],
    status: "applied",
    notes: "",
    nextAction: "",
    nextActionDate: "",
    resume_url: "",
    cover_letter_url: ""
  });

  const filteredAndSortedJobs = useMemo(() => jobs, [jobs]);

  const loadJobs = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.set('q', searchTerm);
      if (statusFilter) params.set('status', statusFilter);
      params.set('sortField', sortField === 'appliedDate' ? 'applied_date' : sortField);
      params.set('sortDirection', sortDirection);
      const res = await fetch(`/api/jobTracker?${params.toString()}`, { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok) {
        console.error('Failed to load jobs:', json);
        throw new Error(json.error || 'Failed to load jobs');
      }
      const apiJobs: Array<{
        id: string;
        company: string;
        position: string;
        location?: string | null;
        company_url?: string | null;
        applied_date: string;
        status: JobStatus;
        notes?: string | null;
        next_action?: string | null;
        next_action_date?: string | null;
        resume_url?: string | null;
        cover_letter_url?: string | null;
      }> = json.data || [];
      const mapped: Job[] = apiJobs.map(j => ({
        id: j.id,
        company: j.company,
        position: j.position,
        location: j.location || "",
        company_url: j.company_url || "",
        appliedDate: j.applied_date,
        status: j.status,
        notes: j.notes || "",
        nextAction: j.next_action || "",
        nextActionDate: j.next_action_date || "",
        resume_url: j.resume_url || "",
        cover_letter_url: j.cover_letter_url || ""
      }));
      setJobs(mapped);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, statusFilter, sortField, sortDirection]);

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const updateJobStatus = async (jobId: string, newStatus: JobStatus) => {
    try {
      const res = await fetch(`/api/jobTracker?id=${jobId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (!res.ok) {
        const json = await res.json();
        console.error('Failed to update job status:', json);
        return;
      }
      loadJobs();
    } catch (e) {
      console.error('Error updating job status:', e);
    }
  };

  const startEdit = (job: Job) => {
    setEditJob({ ...job });
    setIsEditDialogOpen(true);
  };

  const saveEdit = async () => {
    if (!editJob.id) return;
    await fetch(`/api/jobTracker?id=${editJob.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        company: editJob.company,
        position: editJob.position,
        location: editJob.location,
        company_url: editJob.company_url,
        appliedDate: editJob.appliedDate,
        status: editJob.status,
        notes: editJob.notes,
        nextAction: editJob.nextAction,
        nextActionDate: editJob.nextActionDate,
        resume_url: editJob.resume_url,
        cover_letter_url: editJob.cover_letter_url
      })
    });
    setIsEditDialogOpen(false);
    loadJobs();
  };

  const addJob = async () => {
    if (!newJob.company || !newJob.position) return;
    try {
      const res = await fetch('/api/jobTracker', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company: newJob.company,
          position: newJob.position,
          location: newJob.location,
          company_url: newJob.company_url,
          appliedDate: newJob.appliedDate,
          status: newJob.status,
          notes: newJob.notes,
          nextAction: newJob.nextAction,
          nextActionDate: newJob.nextActionDate,
          resume_url: newJob.resume_url,
          cover_letter_url: newJob.cover_letter_url
        })
      });
      if (!res.ok) {
        const json = await res.json();
        console.error('Failed to add job:', json);
        return;
      }
      setNewJob({
        company: "",
        position: "",
        location: "",
        company_url: "",
        appliedDate: new Date().toISOString().split('T')[0],
        status: "applied",
        notes: "",
        nextAction: "",
        nextActionDate: "",
        resume_url: "",
        cover_letter_url: ""
      });
      setIsAddDialogOpen(false);
      loadJobs();
    } catch (e) {
      console.error('Error adding job:', e);
    }
  };

  const deleteJob = async (jobId: string) => {
    await fetch(`/api/jobTracker?id=${jobId}`, { method: 'DELETE' });
    loadJobs();
  };

  const getStatusStats = () => {
    const stats = jobs.reduce((acc, job) => {
      acc[job.status] = (acc[job.status] || 0) + 1;
      return acc;
    }, {} as Record<JobStatus, number>);
    
    return stats;
  };

  const stats = getStatusStats();

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-100px)] overflow-hidden">
        <div className="h-full overflow-y-auto space-y-6 p-1">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-prepzo-900">Job Tracker</h1>
              <p className="text-gray-600 mt-1">Track your job applications and interview progress</p>
            </div>
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button className="self-start sm:self-auto bg-prepzo-900 lg:mr-10 hover:bg-prepzo-700 text-white">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Job Application
                </Button>
              </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Job Application</DialogTitle>
                <DialogDescription>
                  Enter the details of your new job application to track your progress.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="company">Company *</Label>
                    <Input
                      id="company"
                      placeholder="e.g., TechCorp"
                      value={newJob.company}
                      onChange={(e) => setNewJob({ ...newJob, company: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="position">Position *</Label>
                    <Input
                      id="position"
                      placeholder="e.g., Senior Software Engineer"
                      value={newJob.position}
                      onChange={(e) => setNewJob({ ...newJob, position: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      placeholder="e.g., San Francisco, CA"
                      value={newJob.location}
                      onChange={(e) => setNewJob({ ...newJob, location: e.target.value })}
                    />
                  </div>
                  
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="company_url">Company URL</Label>
                    <Input
                      id="company_url"
                      placeholder="https://..."
                      value={newJob.company_url || ""}
                      onChange={(e) => setNewJob({ ...newJob, company_url: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="appliedDate">Applied Date</Label>
                    <Input
                      id="appliedDate"
                      type="date"
                      value={newJob.appliedDate}
                      onChange={(e) => setNewJob({ ...newJob, appliedDate: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select 
                      value={newJob.status} 
                      onValueChange={(value: JobStatus) => setNewJob({ ...newJob, status: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(statusConfig).map(([status, config]) => (
                          <SelectItem key={status} value={status}>
                            {config.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nextAction">Next Action</Label>
                    <Input
                      id="nextAction"
                      placeholder="e.g., Technical Interview"
                      value={newJob.nextAction}
                      onChange={(e) => setNewJob({ ...newJob, nextAction: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="nextActionDate">Next Action Date</Label>
                    <Input
                      id="nextActionDate"
                      type="date"
                      value={newJob.nextActionDate}
                      onChange={(e) => setNewJob({ ...newJob, nextActionDate: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Job Description</Label>
                  <Textarea
                    id="notes"
                    placeholder="Any additional notes about this application..."
                    value={newJob.notes}
                    onChange={(e) => setNewJob({ ...newJob, notes: e.target.value })}
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="resume_url">Resume URL</Label>
                    <Input
                      id="resume_url"
                      placeholder="https://..."
                      value={newJob.resume_url || ""}
                      onChange={(e) => setNewJob({ ...newJob, resume_url: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cover_letter_url">Cover Letter URL</Label>
                    <Input
                      id="cover_letter_url"
                      placeholder="https://..."
                      value={newJob.cover_letter_url || ""}
                      onChange={(e) => setNewJob({ ...newJob, cover_letter_url: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={addJob}
                  disabled={!newJob.company || !newJob.position}
                  className="bg-prepzo-600 hover:bg-prepzo-700"
                >
                  Add Application
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-prepzo-600">{jobs.length}</div>
                <div className="text-sm text-gray-600">Total Applications</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{stats.interview_scheduled || 0}</div>
                <div className="text-sm text-gray-600">Interviews Scheduled</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{(stats.offer_letter || 0) + (stats.offer_accepted || 0)}</div>
                <div className="text-sm text-gray-600">Offers</div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.shortlisted || 0}</div>
                <div className="text-sm text-gray-600">Shortlisted</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters & Search
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="h-4 w-4 absolute left-3 top-3 text-gray-400" />
                  <Input
                    placeholder="Search by company, position, or location..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  {Object.entries(statusConfig).map(([status, config]) => (
                    <SelectItem key={status} value={status}>
                      {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Desktop Table */}
        <Card className="hidden lg:flex lg:flex-col">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Job Applications ({filteredAndSortedJobs.length})</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="border rounded-md overflow-hidden">
              <div className="max-h-[68vh] overflow-y-auto">
                <Table className="min-w-full">
                  <TableHeader className="sticky top-0 z-10 bg-white">
                    <TableRow>
                      <TableHead className="w-[18%]"><Button variant="ghost" onClick={() => handleSort("company")} className="h-auto p-0 font-semibold hover:bg-transparent">Company<ArrowUpDown className="ml-2 h-4 w-4" /></Button></TableHead>
                      <TableHead className="w-[18%]"><Button variant="ghost" onClick={() => handleSort("position")} className="h-auto p-0 font-semibold hover:bg-transparent">Position<ArrowUpDown className="ml-2 h-4 w-4" /></Button></TableHead>
                      <TableHead className="w-[14%]">Location</TableHead>
                      <TableHead className="w-[12%]"><Button variant="ghost" onClick={() => handleSort("appliedDate")} className="h-auto p-0 font-semibold hover:bg-transparent">Applied Date<ArrowUpDown className="ml-2 h-4 w-4" /></Button></TableHead>
                      <TableHead className="w-[10%]"><Button variant="ghost" onClick={() => handleSort("status")} className="h-auto p-0 font-semibold hover:bg-transparent">Status<ArrowUpDown className="ml-2 h-4 w-4" /></Button></TableHead>
                      <TableHead className="w-[12%]">Resume</TableHead>
                      <TableHead className="w-[12%]">Cover Letter</TableHead>
                      <TableHead className="w-[6%] text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredAndSortedJobs.map((job) => (
                      <TableRow key={job.id}>
                        <TableCell className="font-medium">
                          {job.company_url ? (
                            <Link href={job.company_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                              <span className="flex items-center gap-1"><Link2 className="h-4 w-4" /> {job.company}</span>
                            </Link>
                          ) : (
                            <span>{job.company}</span>
                          )}
                        </TableCell>
                        <TableCell>{job.position}</TableCell>
                        <TableCell className="text-sm text-gray-600">{job.location}</TableCell>
                        <TableCell className="text-sm">{new Date(job.appliedDate).toLocaleDateString()}</TableCell>
                        <TableCell><Badge className={statusConfig[job.status].color}>{statusConfig[job.status].label}</Badge></TableCell>
                        <TableCell>
                          {job.resume_url ? (
                            <Link href={job.resume_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline"><span className="flex items-center gap-1"><ExternalLink className="h-4 w-4" /> View Resume </span></Link>
                          ) : (
                            <Link
                              href={`/dashboard/tools/resume-generator?${new URLSearchParams({
                                company: job.company,
                                position: job.position,
                                companyWebsite: job.company_url || '',
                                jobDescription: job.notes || ''
                              }).toString()}`}
                            >
                              <Button variant="outline" size="sm">Create Resume</Button>
                            </Link>
                          )}
                        </TableCell>
                        <TableCell>
                          {job.cover_letter_url ? (
                            <Link href={job.cover_letter_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline"><span className="flex items-center gap-1"><ExternalLink className="h-4 w-4" /> View Letter</span></Link>
                          ) : (
                            <Link
                              href={`/dashboard/tools/cover-letter?${new URLSearchParams({
                                companyWebsite: job.company_url || '',
                                jobDescription: job.notes || ''
                              }).toString()}`}
                            >
                              <Button variant="outline" size="sm">Create Letter</Button>
                            </Link>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => startEdit(job)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Details
                              </DropdownMenuItem>
                              {Object.entries(statusConfig).map(([status, config]) => (
                                <DropdownMenuItem key={status} onClick={() => updateJobStatus(job.id, status as JobStatus)}>
                                  Change to {config.label}
                                </DropdownMenuItem>
                              ))}
                              <DropdownMenuItem onClick={() => deleteJob(job.id)} className="text-red-600">
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Mobile Cards */}
        <div className="lg:hidden space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Applications ({filteredAndSortedJobs.length})</h2>
          </div>
          <div className="space-y-3 pr-2">
            {filteredAndSortedJobs.map((job) => (
              <Card key={job.id} className="p-3 sm:p-4">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-base sm:text-lg leading-tight">{job.company}</h3>
                      <p className="text-gray-600 text-sm leading-tight mt-1">{job.position}</p>
                    </div>
                    <div className="flex-shrink-0">
                      <Badge className={`${statusConfig[job.status].color} text-xs whitespace-nowrap`}>
                        {statusConfig[job.status].label}
                      </Badge>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-2 text-sm">
                    <div className="flex items-center text-gray-600">
                      <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span className="truncate">{job.location || "No location"}</span>
                    </div>
                    
                    <div className="flex items-center text-gray-600">
                      <Calendar className="h-4 w-4 mr-2 flex-shrink-0" />
                      <span>Applied: {new Date(job.appliedDate).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {job.notes && (
                    <div className="bg-gray-50 p-2 sm:p-3 rounded-md">
                      <p className="text-sm text-gray-700 line-clamp-2">{job.notes}</p>
                    </div>
                  )}

                  <div className="flex justify-end pt-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm" className="w-24">
                          <MoreHorizontal className="h-4 w-4 mr-2" />
                          Actions
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => startEdit(job)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Details
                        </DropdownMenuItem>
                        {Object.entries(statusConfig).map(([status, config]) => (
                          <DropdownMenuItem 
                            key={status}
                            onClick={() => updateJobStatus(job.id, status as JobStatus)}
                          >
                            Change to {config.label}
                          </DropdownMenuItem>
                        ))}
                        <DropdownMenuItem 
                          onClick={() => deleteJob(job.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                       </DropdownMenuContent>
                     </DropdownMenu>
                   </div>
                 </div>
               </Card>
              ))}
            </div>
          </div>
        </div>

      {/* Edit Job Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Job Application</DialogTitle>
            <DialogDescription>Update the details of this application.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-company">Company *</Label>
                <Input id="edit-company" value={editJob.company ?? ""} onChange={(e) => setEditJob({ ...editJob, company: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-position">Position *</Label>
                <Input id="edit-position" value={editJob.position ?? ""} onChange={(e) => setEditJob({ ...editJob, position: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-location">Location</Label>
                <Input id="edit-location" value={editJob.location ?? ""} onChange={(e) => setEditJob({ ...editJob, location: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-appliedDate">Applied Date</Label>
                <Input id="edit-appliedDate" type="date" value={editJob.appliedDate ?? ""} onChange={(e) => setEditJob({ ...editJob, appliedDate: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-status">Status</Label>
                <Select value={(editJob.status as JobStatus) ?? "applied"} onValueChange={(value: JobStatus) => setEditJob({ ...editJob, status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(statusConfig).map(([status, config]) => (
                      <SelectItem key={status} value={status}>{config.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-nextActionDate">Next Action Date</Label>
                <Input id="edit-nextActionDate" type="date" value={editJob.nextActionDate ?? ""} onChange={(e) => setEditJob({ ...editJob, nextActionDate: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-nextAction">Next Action</Label>
                <Input id="edit-nextAction" value={editJob.nextAction ?? ""} onChange={(e) => setEditJob({ ...editJob, nextAction: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-notes">Job Description</Label>
              <Textarea id="edit-notes" rows={3} value={editJob.notes ?? ""} onChange={(e) => setEditJob({ ...editJob, notes: e.target.value })} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-resume_url">Resume URL</Label>
                <Input
                  id="edit-resume_url"
                  placeholder="https://..."
                  value={editJob.resume_url ?? ""}
                  onChange={(e) => setEditJob({ ...editJob, resume_url: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-cover_letter_url">Cover Letter URL</Label>
                <Input
                  id="edit-cover_letter_url"
                  placeholder="https://..."
                  value={editJob.cover_letter_url ?? ""}
                  onChange={(e) => setEditJob({ ...editJob, cover_letter_url: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
            <Button className="bg-prepzo-600 hover:bg-prepzo-700" onClick={saveEdit}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </DashboardLayout>
   );
};

export default JobTracker;