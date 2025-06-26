"use client";
import { useState } from "react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import ApplicationsTable, { Filters } from "@/components/dashboard/applications/ApplicationsTable";
import ApplicationsFilters from "@/components/dashboard/applications/ApplicationsFilters";
import ApplicationsStats from "@/components/dashboard/applications/ApplicationsStats";
import NewApplicationDialog from "@/components/dashboard/applications/NewApplicationDialog";
import BlurOverlay from "@/components/dashboard/blurrEffect";

// Re-use the primitive/loose filter map used by AdvancedFilters
type Primitive = string | number | boolean;
type FlexibleFilters = Partial<Record<string, Primitive>>;

const Applications = () => {
  const [filters, setFilters] = useState<Filters>({} as Filters);
  const [hasSearchResults, setHasSearchResults] = useState<boolean>(false);

  const handleFiltersChange = (newFilters: Filters) => {
    setFilters(newFilters);
  };

  const handleSearchResultsChange = (hasResults: boolean) => {
    setHasSearchResults(hasResults);
  };

  

  // Combine basic and advanced filters
  const combinedFilters: FlexibleFilters = { ...filters };

  return (
    <DashboardLayout>
      {/* <BlurOverlay /> */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Applications</h1>
            <p className="text-gray-600 mt-1">Track your job applications and progress</p>
          </div>
          <NewApplicationDialog />
        </div>
        
        {/* <ApplicationsStats /> */}
        
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <ApplicationsFilters onFiltersChange={handleFiltersChange} hasSearchResults={hasSearchResults} />
          </div>
          <div className="lg:w-auto">
            {/* <AdvancedFilters 
              onFiltersChange={handleAdvancedFiltersChange}
              activeFilters={advancedFilters}
            /> */}
          </div>
        </div>
        
        <ApplicationsTable filters={combinedFilters} onSearchResultsChange={handleSearchResultsChange} />
      </div>
    </DashboardLayout>
  );
};

export default Applications;