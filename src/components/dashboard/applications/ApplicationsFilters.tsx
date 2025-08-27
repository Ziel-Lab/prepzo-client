import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, X, Sparkles, Clock, Bookmark, Save, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { SavedFilter } from "@/utils/saveJobSearchFilters";

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
}

const ApplicationsFilters = ({ onFiltersChange, hasSearchResults = false, onAISearch, aiFilters, onSaveFilters, savedFilters = [], onLoadFilter, activeFilter, hideAISearch = false, onBackToSearch }: ApplicationsFiltersProps) => {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [seniorityFilter, setSeniorityFilter] = useState("");
  const [aiPrompt, setAiPrompt] = useState<string>("");
  const [isAISearching, setIsAISearching] = useState(false);

  const handleAISearch = async () => {
    if (!aiPrompt.trim() || !onAISearch) return;
    
    setIsAISearching(true);
    try {
      await onAISearch(aiPrompt);
    } catch (error) {
      console.error('AI Search failed:', error);
    } finally {
      setIsAISearching(false);
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("");
    setLocationFilter("");
    setSeniorityFilter("");
    setAiPrompt("");
    onFiltersChange({});
  };

  // Populate form fields when AI filters are received
  React.useEffect(() => {
    if (activeFilter) {
      console.log("Loading activeFilter into ApplicationsFilters:", activeFilter);
      setSearchTerm(activeFilter.search || "");
      setStatusFilter(activeFilter.status || "");
      setLocationFilter(activeFilter.location || "");
      setSeniorityFilter(activeFilter.seniority || "");
    }
  }, [activeFilter]);

  // Trigger filter change whenever any filter value changes
  React.useEffect(() => {
    onFiltersChange({
      search: searchTerm,
      status: statusFilter,
      location: locationFilter,
      seniority: seniorityFilter,
    });
  }, [searchTerm, statusFilter, locationFilter, seniorityFilter, onFiltersChange]);

  const hasActiveFilters = searchTerm || statusFilter || locationFilter || seniorityFilter || aiPrompt;

  return (
    <div className="space-y-6">
      {/* Show banner when using saved filters */}
      {hideAISearch && activeFilter && (
        <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-blue-100/50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-full bg-blue-600">
                  <Bookmark className="h-4 w-4 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-blue-900">Using Saved Search</h3>
                  <p className="text-sm text-blue-700">
                    Showing results for: {[
                      activeFilter.search && `"${activeFilter.search}"`,
                      activeFilter.location && `Location: ${activeFilter.location}`,
                      activeFilter.seniority && `Seniority: ${activeFilter.seniority}`
                    ].filter(Boolean).join(', ')}
                  </p>
                </div>
              </div>
              {onBackToSearch && (
                <Button variant="outline" size="sm" onClick={onBackToSearch} className="border-blue-300 text-blue-700 hover:bg-blue-100">
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
        <Card className="border-2 border-prepzo/20 bg-gradient-to-br from-white via-prepzo-50/10 to-prepzo-100/20 shadow-lg">
        <CardContent className="p-8">
          <div className="text-center space-y-6">
            <div className="flex items-center justify-center gap-3 mb-2 px-4 sm:px-0">
              
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-prepzo text-center">Start your search with AI</h2>
            </div>
            
            <div className="max-w-5xl mx-auto px-4 sm:px-0">
              <div className="space-y-4">
                {/* Desktop: Button inside textarea, Mobile: Button below */}
                <div className="relative">
                  <Search className="absolute left-3 sm:left-4 top-3 sm:top-4 h-4 w-4 sm:h-5 sm:w-5 text-gray-400 z-10" />
                  <Textarea
                    placeholder="E.g Remote Engineers in software companies for junior positions in US"
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    className="w-full min-h-[50px] sm:min-h-[60px] resize-none border-2 border-prepzo/30 focus:border-prepzo focus:ring-1 focus:ring-prepzo/20 transition-all duration-200 text-base sm:text-lg pl-10 sm:pl-12 pr-4 sm:pr-40 py-2.5 sm:py-3 rounded-lg shadow-sm bg-white/80 backdrop-blur-sm"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleAISearch();
                      }
                    }}
                  />
                  {/* Desktop button - inside textarea */}
                  <Button
                    onClick={handleAISearch}
                    disabled={!aiPrompt.trim() || isAISearching}
                    className="hidden sm:flex absolute right-2 top-5 bg-gradient-to-r from-prepzo to-prepzo-dark hover:from-prepzo-dark hover:to-prepzo text-white font-bold px-6 py-2 text-base rounded-md shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 disabled:transform-none disabled:opacity-50 justify-center items-center whitespace-nowrap h-11 lg: mb-5"
                  >
                    {isAISearching ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                        Searching...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4 mr-2" />
                        AI Search
                      </>
                    )}
                  </Button>
                </div>
                
                {/* Mobile button - below textarea */}
                <Button
                  onClick={handleAISearch}
                  disabled={!aiPrompt.trim() || isAISearching}
                  className="sm:hidden w-full bg-gradient-to-r from-prepzo to-prepzo-dark hover:from-prepzo-dark hover:to-prepzo text-white font-bold px-6 py-3 text-base rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 disabled:transform-none disabled:opacity-50 flex justify-center items-center whitespace-nowrap h-12"
                >
                  {isAISearching ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      AI Search
                    </>
                  )}
                </Button>
              </div>
            </div>


            {/* Saved Searches and Recent Searches */}
            <div className="grid grid-cols-1 md:grid-cols-1 gap-6 sm:gap-8 mt-8 sm:mt-12 max-w-5xl mx-auto px-4 sm:px-0">
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-1 rounded-md bg-prepzo/10">
                    <Bookmark className="h-4 w-4 sm:h-5 sm:w-5 text-prepzo" />
                  </div>
                  <h3 className="font-bold text-base sm:text-lg text-prepzo">Saved Searches</h3>
                </div>
                {savedFilters.length === 0 ? (
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-xl p-4 sm:p-6 text-center text-gray-500 border border-gray-200/50">
                    <Bookmark className="h-6 w-6 sm:h-8 sm:w-8 mx-auto mb-2 text-gray-300" />
                    <p className="font-medium text-sm sm:text-base">No saved searches</p>
                    <p className="text-xs sm:text-sm text-gray-400">Save your searches for quick access</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {savedFilters.map((filter) => (
                      <div key={filter.id} className="bg-white rounded-lg p-4 border border-gray-200 hover:border-prepzo/30 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="text-sm font-medium text-gray-900 mb-1">
                              {new Date(filter.created_at).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                            <div className="text-xs text-gray-500 space-y-1">
                              {filter.filters.search && (
                                <div>Search: {filter.filters.search}</div>
                              )}
                              {filter.filters.location && (
                                <div>Location: {filter.filters.location}</div>
                              )}
                              {filter.filters.seniority && (
                                <div>Seniority: {filter.filters.seniority}</div>
                              )}
                              {filter.filters.status && (
                                <div>Status: {filter.filters.status}</div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {onLoadFilter && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onLoadFilter(filter)}
                                className="text-prepzo hover:text-prepzo-dark hover:bg-prepzo/10"
                              >
                                <Search className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
        </Card>
      )}

      {/* Controls shown in results view */}
      {hasSearchResults && hasActiveFilters && onSaveFilters && (
        <div className="flex justify-start gap-2">
          <Button variant="outline" size="sm" onClick={onSaveFilters}>
            <Save className="h-4 w-4 mr-2" />
            Save Filters
          </Button>
        </div>
      )}
    </div>
  );
};

export default ApplicationsFilters;
