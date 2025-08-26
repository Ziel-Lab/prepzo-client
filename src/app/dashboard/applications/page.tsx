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
  

  const handleFiltersChange = (newFilters: Filters) => {
    setFilters(newFilters);
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
        
        {/* <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <ApplicationsFilters onFiltersChange={handleFiltersChange} />
          </div> */}
          {/* <div className="lg:w-auto"> */}
            {/* <AdvancedFilters 
              onFiltersChange={handleAdvancedFiltersChange}
              activeFilters={advancedFilters}
            /> */}
          {/* </div> */}
        {/* </div> */}
        
        <ApplicationsTable filters={combinedFilters} />
      </div>
    </DashboardLayout>
  );
};

export default Applications;
