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
          <div className="w-full max-w-4xl mx-auto px-3">
            <div className="relative group">
              
              {/* Input field */}
              <Textarea
                placeholder="Software Engineers in New York with 5+ years of experience"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                className="w-full min-h-[64px] resize-none pl-5 pr-32 pt-5 text-lg bg-white border-2 border-gray-200 rounded-2xl shadow-sm hover:shadow-md focus:shadow-lg focus:border-prepzo focus:ring-4 focus:ring-prepzo/10 transition-all duration-300 placeholder:text-gray-400 leading-relaxed"
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
                className="hidden sm:flex absolute right-3 top-1/4 bg-gradient-to-r from-prepzo to-prepzo-dark hover:from-prepzo-dark hover:to-prepzo text-white font-semibold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 disabled:transform-none disabled:opacity-50 disabled:cursor-not-allowed items-center gap-2"
              >
                {isAISearching ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    <span className="hidden sm:inline">Searching...</span>
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
              className="sm:hidden w-full mt-4 bg-gradient-to-r from-prepzo to-prepzo-dark hover:from-prepzo-dark hover:to-prepzo text-white font-semibold px-6 py-4 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] disabled:transform-none disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
            >
              {isAISearching ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                  Searching...
                </>
              ) : (
                <>
                  <Sparkles className="h-5 w-5" />
                  AI Search
                </>
              )}
            </Button>
          </div>
          {/* Saved Searches Section */}
          <div className="w-full max-w-4xl mx-auto px-4 mt-12">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 rounded-lg bg-prepzo-50">
                  <Bookmark className="h-5 w-5 text-prepzo" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900">Saved Searches</h3>
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
                <div className="space-y-3">
                  {savedFilters.map((filter) => (
                    <div key={filter.id} className="group bg-gray-50 hover:bg-prepzo-50 rounded-lg p-4 border border-transparent hover:border-prepzo-200 transition-all duration-200 cursor-pointer">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-600 mb-2">
                            {new Date(filter.created_at).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                          <div className="space-y-1">
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
                            className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-prepzo hover:bg-prepzo-dark text-white px-4 py-2 rounded-lg"
                          >
                            <Search className="h-4 w-4 mr-2" />
                            Load
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}


    </div>
  );
};

export default ApplicationsFilters;
