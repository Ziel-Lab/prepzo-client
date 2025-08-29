"use client";
import { useState, useCallback, useRef, useEffect } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import ApplicationsTable, { Filters } from "@/components/dashboard/applications/ApplicationsTable";
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
  const supabase = createClient();
  const { toast } = useToast();

  // Ref for AdvancedFilters section
  const advancedFiltersRef = useRef<HTMLDivElement>(null);

  // Get user and load saved filters
  useEffect(() => {
    const fetchUserAndFilters = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.id) {
        setUserId(user.id);
        const { data: filters } = await getSavedFilters(user.id);
        if (filters) {
          setSavedFilters(filters);
        }
      }
    };
    fetchUserAndFilters();
  }, [supabase.auth]);

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
  const combinedFilters: FlexibleFilters = { ...filters };

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
