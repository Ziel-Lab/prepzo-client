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
    // Debug: Check authentication status
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    console.log('Debug - Auth user:', user);
    console.log('Debug - Auth error:', authError);
    console.log('Debug - userId state:', userId);
    
    if (authError || !user) {
      toast({
        title: "Authentication required",
        description: "Please log in to save filters.",
        variant: "destructive",
      });
      return;
    }

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

    console.log('Debug - Saving filters:', filters);
    console.log('Debug - User ID:', user.id);

    try {
      const { error } = await saveJobSearchFilter(user.id, filters);
      
      console.log('Debug - Save error:', error);
      
      if (error) {
        console.error('Save filter error details:', error);
        toast({
          title: "Error",
          description: `Failed to save filters: ${error.message || 'Unknown error'}`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Filters saved successfully!",
        });
        // Reload saved filters
        const { data: updatedFilters } = await getSavedFilters(user.id);
        if (updatedFilters) {
          setSavedFilters(updatedFilters);
        }
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    }
  };

  const handleLoadFilter = (savedFilter: SavedFilter) => {
    setFilters(savedFilter.filters);
    toast({
      title: "Filter loaded",
      description: "Saved filter has been applied to your search.",
    });
  };

  const handleAISearch = async (prompt: string) => {
    try {
      setHasSearchResults(false);
      setAiFilters(null); // Clear previous AI filters
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
            }
          }
        } catch (err) {
          // Optionally handle polling error
        }
      }, 3500);
    } catch (error) {
      console.error('AI Search failed:', error);
      // alert(error instanceof Error ? error.message : 'AI Search failed');
    }
  };

  // Combine basic and advanced filters
  const combinedFilters: FlexibleFilters = { ...filters };

  return (
    <DashboardLayout>
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
            />
          </div>
        </div>
        
        <div ref={advancedFiltersRef}>
          <ApplicationsTable filters={combinedFilters} aiFilters={aiFilters} />
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Applications;
