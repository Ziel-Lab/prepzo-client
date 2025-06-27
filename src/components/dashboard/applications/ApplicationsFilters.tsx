import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface FilterOptions {
  search?: string;
  status?: string;
  location?: string;
  seniority?: string;
}

interface ApplicationsFiltersProps {
  onFiltersChange: (filters: FilterOptions) => void;
  hasSearchResults?: boolean;
}

const ApplicationsFilters = ({ onFiltersChange, hasSearchResults = false }: ApplicationsFiltersProps) => {
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [seniorityFilter, setSeniorityFilter] = useState("");

  const handleFilterChange = () => {
    onFiltersChange({
      search: searchTerm,
      status: statusFilter,
      location: locationFilter,
      seniority: seniorityFilter,
    });
  };

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("");
    setLocationFilter("");
    setSeniorityFilter("");
    onFiltersChange({});
  };

  // Trigger filter change whenever any filter value changes
  React.useEffect(() => {
    handleFilterChange();
  }, [searchTerm, statusFilter, locationFilter, seniorityFilter]);

  const hasActiveFilters = searchTerm || statusFilter || locationFilter || seniorityFilter;

  return (
    <Card>
      <CardContent className="p-4 lg:p-6">
        <div className="space-y-4">
          {/* Search and basic filters */}
          {hasSearchResults && (
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search positions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          )}

          {/* Clear filters button */}
          {hasActiveFilters && (
            <div className="flex justify-start">
              <Button variant="outline" size="sm" onClick={clearFilters}>
                <X className="h-4 w-4 mr-2" />
                Clear Filters
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default ApplicationsFilters;
