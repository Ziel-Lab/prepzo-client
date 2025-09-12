import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, X, Sparkles, Clock, Bookmark, Save, Trash2, History, Loader2, Building, MapPin, Calendar, DollarSign, Eye, FileText, Link2, ArrowRight, ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { SavedFilter } from "@/utils/saveJobSearchFilters";
import { Job, JobStatus, JOB_STATUSES } from "./types";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";

interface FilterOptions {
  search?: string;
  status?: string;
  location?: string;
  seniority?: string;
  aiSearch?: string;
}

interface AIFilters {
  search?: string;
  location?: string;
  seniority?: string;
  company?: string;
  country?: string;
}

interface ApplicationsFiltersProps {
  onFiltersChange: (filters: FilterOptions) => void;
  hasSearchResults?: boolean;
  onAISearch?: (prompt: string) => void;
  aiFilters?: AIFilters | null;
  onSaveFilters?: () => void;
  savedFilters?: SavedFilter[];
  onLoadFilter?: (filter: SavedFilter) => void;
  activeFilter?: FilterOptions | null;
  hideAISearch?: boolean;
  onBackToSearch?: () => void;
  revealedJobsHistory?: Array<{ job_id: number; job_details?: Job; revealed_at: string }>;
  historyLoading?: boolean;
  jobStatuses?: Map<number, JobStatus>;
  onStatusUpdate?: (jobId: number, newStatus: JobStatus) => void;
  updatingStatus?: Set<number>;
  generatedDocuments?: Map<string, { current_resume?: string; company_website?: string; created_at?: string }>;
}

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

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });
};

const ApplicationsFilters = ({ 
  onFiltersChange, 
  hasSearchResults = false, 
  onAISearch, 
  aiFilters, 
  onSaveFilters, 
  savedFilters = [], 
  onLoadFilter, 
  activeFilter, 
  hideAISearch = false, 
  onBackToSearch,
  revealedJobsHistory = [],
  historyLoading = false,
  jobStatuses = new Map(),
  onStatusUpdate,
  updatingStatus = new Set(),
  generatedDocuments = new Map()
}: ApplicationsFiltersProps) => {
  const [aiPrompt, setAiPrompt] = useState<string>("");
  const [isAISearching, setIsAISearching] = useState(false);
  const [historyCurrentPage, setHistoryCurrentPage] = useState(1);
  const [historyItemsPerPage] = useState(5);
  const [searchesCurrentPage, setSearchesCurrentPage] = useState(1);
  const [searchesItemsPerPage] = useState(5);

  const handleAISearch = async () => {
    if (!aiPrompt.trim() || !onAISearch) return;
    
    setIsAISearching(true);
    try {
      await onAISearch(aiPrompt);
      // Clear the prompt after successful search
      setAiPrompt("");
    } catch (error) {
      console.error('AI Search failed:', error);
    } finally {
      setIsAISearching(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Show banner when using saved filters */}
      {hideAISearch && activeFilter && (
        <Card className="border-2 border-prepzo bg-gradient-to-r from-prepzo/10 to-prepzo/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-prepzo">
                  <Bookmark className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-prepzo">Using Saved Search</h3>
                  <p className="text-sm text-prepzo">
                    Showing results for: {[
                      activeFilter.search && `"${activeFilter.search}"`,
                      activeFilter.location && `Location: ${activeFilter.location}`,
                      activeFilter.seniority && `Seniority: ${activeFilter.seniority}`
                    ].filter(Boolean).join(', ')}
                  </p>
                </div>
              </div>
              {onBackToSearch && (
                <Button variant="outline" size="sm" onClick={onBackToSearch} className="border-prepzo text-prepzo hover:bg-prepzo/10">
                  <Search className="h-4 w-4 mr-2" />
                  New Search
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Search Section - Hide when using saved filters or when showing results */}
      {!hideAISearch && !hasSearchResults && (
        <div className="min-h-[400px] flex flex-col items-center justify-center space-y-8 py-12">
          {/* Main heading */}
          <div className="text-center space-y-4">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent leading-tight">
              Start your search with AI
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Describe your ideal job in natural language and let AI find the perfect matches for you
            </p>
          </div>

          {/* Search container */}
          <div className="w-full max-w-4xl mx-auto px-4 sm:px-6">
            <div className="relative">
               {/* Input field */}
               <Textarea
                 placeholder="Software Engineers in New York with 5+ years of experience"
                 value={aiPrompt}
                 onChange={(e) => setAiPrompt(e.target.value)}
                 className="w-full !min-h-[60px] resize-none px-4 pt-4 lg:pb-0 pb-4 text-base sm:text-lg bg-white border-2 border-gray-200 rounded-2xl shadow-sm hover:shadow-md focus:shadow-lg focus:border-prepzo focus:ring-4 focus:ring-prepzo/10 transition-all duration-300 placeholder:text-gray-400 leading-relaxed sm:pr-[140px] flex items-center"
                 onKeyDown={(e) => {
                   if (e.key === 'Enter' && !e.shiftKey) {
                     e.preventDefault();
                     handleAISearch();
                   }
                 }}
               />
               
               {/* AI Search button - Desktop only */}
               <Button
                 onClick={handleAISearch}
                 disabled={!aiPrompt.trim() || isAISearching}
                 className="hidden sm:flex absolute right-3 top-1/4 md:mr-3 bg-gradient-to-r from-prepzo to-prepzo-dark hover:from-prepzo-dark hover:to-prepzo text-white font-semibold px-5 py-2.5 rounded-xl shadow-md hover:shadow-lg hover:scale-105 disabled:transform-none disabled:opacity-50 disabled:cursor-not-allowed items-center gap-2"
               >
                 {isAISearching ? (
                   <>
                     <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                     <span>Searching...</span>
                   </>
                 ) : (
                   <>
                     <Sparkles className="h-4 w-4" />
                     <span>AI Search</span>
                   </>
                 )}
               </Button>
            </div>
            
            {/* Mobile button - Full width below input */}
            <Button
              onClick={handleAISearch}
              disabled={!aiPrompt.trim() || isAISearching}
              className="sm:hidden w-full mt-3 bg-gradient-to-r from-prepzo to-prepzo-dark hover:from-prepzo-dark hover:to-prepzo text-white font-semibold px-4 py-3 text-base rounded-xl shadow-md hover:shadow-lg transition-all duration-300 hover:scale-[1.02] disabled:transform-none disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2.5"
            >
              {isAISearching ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  Searching...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  AI Search
                </>
              )}
            </Button>
          </div>
          {/* Saved Searches & History Section */}
          <div className="w-full max-w-4xl mx-auto px-4 mt-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Saved Searches */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-prepzo-50">
                      <Bookmark className="h-5 w-5 text-prepzo" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      Saved Searches ({savedFilters.length})
                    </h3>
                  </div>
                </div>
                
                {savedFilters.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-prepzo-50 flex items-center justify-center">
                      <Bookmark className="h-8 w-8 text-prepzo-400" />
                    </div>
                    <h4 className="text-lg font-medium text-gray-900 mb-2">No saved searches</h4>
                    <p className="text-gray-500">Save your searches for quick access later</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {savedFilters
                      .slice((searchesCurrentPage - 1) * searchesItemsPerPage, searchesCurrentPage * searchesItemsPerPage)
                      .map((filter) => (
                        <div key={filter.id} className="group bg-gray-50 hover:bg-prepzo-50 rounded-lg p-4 border border-transparent hover:border-prepzo-200 transition-all duration-200">
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-gray-600 mb-2">
                                {new Date(filter.created_at).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </div>
                              <div className="space-y-2">
                                {filter.filters.search && (
                                  <div className="text-sm text-gray-900">
                                    <span className="font-medium">Search:</span> {filter.filters.search}
                                  </div>
                                )}
                                {filter.filters.location && (
                                  <div className="text-sm text-gray-900">
                                    <span className="font-medium">Location:</span> {filter.filters.location}
                                  </div>
                                )}
                                {filter.filters.seniority && (
                                  <div className="text-sm text-gray-900">
                                    <span className="font-medium">Seniority:</span> {filter.filters.seniority}
                                  </div>
                                )}
                              </div>
                            </div>
                            {onLoadFilter && (
                              <Button
                                onClick={() => onLoadFilter(filter)}
                                className="w-full sm:w-auto opacity-100 sm:opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-prepzo hover:bg-prepzo-dark text-white px-4 py-2 rounded-lg"
                              >
                                <Search className="h-4 w-4 mr-2" />
                                Load Search
                              </Button>
                            )}
                          </div>
                        </div>
                    ))}

                    {/* Pagination */}
                    {Math.ceil(savedFilters.length / searchesItemsPerPage) > 1 && (
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-4 pt-4 border-t">
                        <div className="text-sm text-gray-500 w-full sm:w-auto order-2 sm:order-1 text-center sm:text-left">
                          Showing {(searchesCurrentPage - 1) * searchesItemsPerPage + 1}-
                          {Math.min(searchesCurrentPage * searchesItemsPerPage, savedFilters.length)} of {savedFilters.length}
                        </div>
                        <div className="flex items-center justify-center w-full sm:w-auto gap-1 order-1 sm:order-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSearchesCurrentPage(p => Math.max(1, p - 1))}
                            disabled={searchesCurrentPage === 1}
                            className="h-8 px-3"
                          >
                              <ArrowLeft className="h-4 w-4" />
                          </Button>
                          
                          <div className="flex items-center">
                            {Array.from({ length: Math.ceil(savedFilters.length / searchesItemsPerPage) }, (_, i) => (
                              <Button
                                key={i + 1}
                                variant={searchesCurrentPage === i + 1 ? "default" : "outline"}
                                size="sm"
                                onClick={() => setSearchesCurrentPage(i + 1)}
                                className={`h-8 w-8 p-0 ${
                                  searchesCurrentPage === i + 1 
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
                            onClick={() => setSearchesCurrentPage(p => Math.min(Math.ceil(savedFilters.length / searchesItemsPerPage), p + 1))}
                            disabled={searchesCurrentPage === Math.ceil(savedFilters.length / searchesItemsPerPage)}
                            className="h-8 px-3"
                          >
                            <ArrowRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Saved Jobs */}
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-prepzo-50">
                      <History className="h-5 w-5 text-prepzo" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      Saved Jobs ({revealedJobsHistory.length})
                    </h3>
                  </div>
                </div>

                {historyLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="mr-2 h-5 w-5 animate-spin text-prepzo" />
                    <span className="text-gray-600">Loading saved jobs...</span>
                  </div>
                ) : revealedJobsHistory.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-prepzo-50 flex items-center justify-center">
                      <History className="h-8 w-8 text-prepzo-400" />
                    </div>
                    <h4 className="text-lg font-medium text-gray-900 mb-2">No saved jobs</h4>
                    <p className="text-gray-500">Your revealed jobs will appear here</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {revealedJobsHistory
                      .slice((historyCurrentPage - 1) * historyItemsPerPage, historyCurrentPage * historyItemsPerPage)
                      .map((item) => (
                        <div key={item.job_id} className="group bg-gray-50 hover:bg-prepzo-50 rounded-lg p-4 border border-transparent hover:border-prepzo-200 transition-all duration-200">
                          <div className="space-y-3">
                            {/* Job title and status */}
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

                              {/* Status dropdown */}
                              {onStatusUpdate && (
                                <div className="w-full sm:w-auto">
                                  <Select
                                    value={jobStatuses.get(item.job_id) || 'revealed'}
                                    onValueChange={(value: JobStatus) => onStatusUpdate(item.job_id, value)}
                                    disabled={updatingStatus.has(item.job_id)}
                                  >
                                    <SelectTrigger 
                                      className={`
                                        w-full sm:w-36 h-9 text-sm 
                                        border-2 border-prepzo-500 
                                        bg-prepzo-50 
                                        hover:bg-prepzo-100 
                                        transition-all 
                                        duration-200 
                                        focus:ring-2 
                                        focus:ring-prepzo-200 
                                        focus:border-prepzo-500
                                        ${updatingStatus.has(item.job_id) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                                      `}
                                    >
                                      <SelectValue placeholder="Update Status" className="text-prepzo-700 font-medium" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {Object.entries(JOB_STATUSES).map(([key, label]) => (
                                        <SelectItem 
                                          key={key} 
                                          value={key} 
                                          className="text-sm hover:bg-prepzo-50 cursor-pointer"
                                        >
                                          {label}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              )}
                            </div>

                            {/* Company and job details */}
                            {item.job_details && (
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
                                      <span>{item.job_details.seniority}</span>
                                    </div>
                                  )}
                                  
                                  {item.job_details.remote && (
                                    <Badge variant="outline" className="text-xs border-prepzo-200 text-prepzo-700 bg-prepzo-50">
                                      Remote
                                    </Badge>
                                  )}
                                  
                                  {item.job_details.hybrid && (
                                    <Badge variant="outline" className="text-xs border-prepzo-300 text-prepzo-600 bg-prepzo-50">
                                      Hybrid
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Footer with date and actions */}
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-3 pt-2 border-t border-gray-100">
                              <div className="flex items-center gap-1 text-xs text-gray-500">
                                <Calendar className="h-3 w-3" />
                                <span>Revealed on {formatDate(item.revealed_at)}</span>
                              </div>
                              
                              {/* Action buttons */}
                              {item.job_details && (
                                <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full">
                                  {item.job_details.url && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      asChild
                                      className="flex-1 sm:flex-none h-8 text-xs"
                                    >
                                      <Link href={item.job_details.url} target="_blank" rel="noopener noreferrer">
                                        <Link2 className="h-3 w-3 mr-1" />
                                        Apply
                                      </Link>
                                    </Button>
                                  )}
                                  
                                  {item.job_details.company_object?.domain && (
                                    <>
                                      {/* Resume button */}
                                      {generatedDocuments.has(item.job_details.company_object.domain) ? (
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
                                              item.job_details.company_object.domain || ""
                                            )}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                          >
                                            <FileText className="h-3 w-3 mr-1" />
                                            Generate Resume
                                          </Link>
                                        </Button>
                                      )}
                                    </>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}

                    {/* Pagination */}
                    {Math.ceil(revealedJobsHistory.length / historyItemsPerPage) > 1 && (
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t">
                        {/* Page info - Mobile friendly */}
                        <div className="text-sm text-gray-500 w-full sm:w-auto order-2 sm:order-1 text-center sm:text-left">
                          Showing {(historyCurrentPage - 1) * historyItemsPerPage + 1}-
                          {Math.min(historyCurrentPage * historyItemsPerPage, revealedJobsHistory.length)} of {revealedJobsHistory.length}
                        </div>

                        {/* Pagination controls */}
                        <div className="flex items-center justify-center w-full sm:w-auto gap-1 order-1 sm:order-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setHistoryCurrentPage(p => Math.max(1, p - 1))}
                            disabled={historyCurrentPage === 1}
                            className="h-8 px-3"
                          >
                            <ArrowLeft className="h-4 w-4" />
                          </Button>

                          <div className="hidden sm:flex items-center gap-1">
                            {Array.from({ length: Math.ceil(revealedJobsHistory.length / historyItemsPerPage) }, (_, i) => {
                              // Show first page, last page, and pages around current page
                              const showPage = i === 0 || 
                                             i === Math.ceil(revealedJobsHistory.length / historyItemsPerPage) - 1 || 
                                             Math.abs(i + 1 - historyCurrentPage) <= 1;
                              
                              // Show dots for skipped pages
                              if (!showPage && (i === 1 || i === Math.ceil(revealedJobsHistory.length / historyItemsPerPage) - 2)) {
                                return (
                                  <span key={`dots-${i}`} className="px-2 text-gray-400">
                                    ...
                                  </span>
                                );
                              }

                              return showPage ? (
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
                              ) : null;
                            })}
                          </div>

                          {/* Mobile current page indicator */}
                          <span className="sm:hidden px-4 text-sm font-medium">
                            Page {historyCurrentPage}
                          </span>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setHistoryCurrentPage(p => Math.min(Math.ceil(revealedJobsHistory.length / historyItemsPerPage), p + 1))}
                            disabled={historyCurrentPage === Math.ceil(revealedJobsHistory.length / historyItemsPerPage)}
                            className="h-8 px-3"
                          >
                            <ArrowRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApplicationsFilters;