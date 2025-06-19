import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { X, Filter, Calendar, MapPin, Building, DollarSign, Globe, Hash, User, Briefcase, Laptop } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { Filters } from "./ApplicationsTable";
import type { ComponentType } from "react";

type Primitive = string | number | boolean;

type FlexibleFilters = Partial<Record<keyof Filters | string, Primitive>>;

interface AdvancedFiltersProps {
  onFiltersChange: (filters: FlexibleFilters) => void;
  activeFilters: FlexibleFilters;
}

const AdvancedFilters = ({ onFiltersChange, activeFilters }: AdvancedFiltersProps) => {
  const [localFilters, setLocalFilters] = useState<FlexibleFilters>(activeFilters);
  const [isOpen, setIsOpen] = useState(false);

  type FilterOption = {
    key: keyof Filters | string;
    label: string;
    icon: ComponentType<{ className?: string }>;
    type: 'text' | 'number' | 'date' | 'boolean' | 'select';
    options?: string[];
  };

  const filterOptions: FilterOption[] = [
    { key: 'postedDate', label: 'Posted Date', icon: Calendar, type: 'date' },
    { key: 'discoveredDate', label: 'Discovered Date', icon: Calendar, type: 'date' },
    { key: 'jobCountry', label: 'Job Country', icon: Globe, type: 'select', options: ['India', 'United States', 'United Kingdom', 'Canada', 'Australia'] },
    { key: 'jobTitle', label: 'Job Title', icon: Briefcase, type: 'text' },
    { key: 'jobDescription', label: 'Job Description', icon: Briefcase, type: 'text' },
    { key: 'jobLocation', label: 'Job Location', icon: MapPin, type: 'text' },
    { key: 'annualSalary', label: 'Annual Salary (USD)', icon: DollarSign, type: 'number' },
    { key: 'remote', label: 'Remote', icon: Laptop, type: 'boolean' },
    { key: 'jobTechnology', label: 'Job Technology', icon: Building, type: 'text' },
    { key: 'hasHiringManager', label: 'Has Hiring Manager', icon: User, type: 'boolean' },
    { key: 'includesReportsToRole', label: 'Includes Reports To Role', icon: User, type: 'boolean' },
    { key: 'isEasyApply', label: 'Is Easy Apply', icon: Briefcase, type: 'boolean' },
    { key: 'atsUrlExists', label: 'ATS URL exists', icon: Globe, type: 'boolean' },
    { key: 'jobId', label: 'Job ID', icon: Hash, type: 'text' },
    { key: 'urlDomain', label: 'URL Domain', icon: Globe, type: 'text' },
  ];

  const handleFilterChange = (key: string, value: Primitive) => {
    const updatedFilters = { ...localFilters, [key]: value };
    setLocalFilters(updatedFilters);
  };

  const removeFilter = (key: string) => {
    const updatedFilters = { ...localFilters };
    delete updatedFilters[key];
    setLocalFilters(updatedFilters);
  };

  const applyFilters = () => {
    onFiltersChange(localFilters);
    setIsOpen(false);
  };

  const clearAllFilters = () => {
    setLocalFilters({});
    onFiltersChange({});
  };

  const getActiveFilterCount = () => {
    return Object.keys(activeFilters).filter(key => activeFilters[key] !== '' && activeFilters[key] !== null && activeFilters[key] !== undefined).length;
  };

  const renderFilterInput = (option: FilterOption) => {
    const rawVal = localFilters[option.key];
    const value: Primitive | '' = (rawVal === undefined ? '' : rawVal) as Primitive | '';

    switch (option.type) {
      case 'text':
        return (
          <Input
            placeholder={`Enter ${option.label.toLowerCase()}`}
            value={String(value)}
            onChange={(e) => handleFilterChange(option.key, e.target.value as Primitive)}
          />
        );
      case 'number':
        return (
          <Input
            type="number"
            placeholder={`Enter ${option.label.toLowerCase()}`}
            value={String(value)}
            onChange={(e) => handleFilterChange(option.key, e.target.value as Primitive)}
          />
        );
      case 'date':
        return (
          <Input
            type="date"
            value={String(value)}
            onChange={(e) => handleFilterChange(option.key, e.target.value as Primitive)}
          />
        );
      case 'boolean':
        return (
          <Select value={String(value)} onValueChange={(val) => handleFilterChange(option.key, val === 'true')}>
            <SelectTrigger>
              <SelectValue placeholder="Select option" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">Yes</SelectItem>
              <SelectItem value="false">No</SelectItem>
            </SelectContent>
          </Select>
        );
      case 'select':
        return (
          <Select value={String(value)} onValueChange={(val) => handleFilterChange(option.key, val as Primitive)}>
            <SelectTrigger>
              <SelectValue placeholder={`Select ${option.label.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              {option.options?.map((opt: string) => (
                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {/* Active Filters Display */}
      {Object.keys(activeFilters).length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-sm font-medium text-gray-600">Active filters:</span>
              {Object.entries(activeFilters).map(([key, value]) => {
                if (!value) return null;
                const option = filterOptions.find(opt => opt.key === key);
                return (
                  <Badge key={key} variant="secondary" className="flex items-center gap-1">
                    {option?.label}: {value.toString()}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => {
                        const updatedFilters = { ...activeFilters };
                        delete updatedFilters[key];
                        onFiltersChange(updatedFilters);
                      }}
                    />
                  </Badge>
                );
              })}
              <Button variant="outline" size="sm" onClick={clearAllFilters}>
                Clear All
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filter Trigger */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" className="relative">
            <Filter className="h-4 w-4 mr-2" />
            Advanced Filters
            {getActiveFilterCount() > 0 && (
              <Badge className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs">
                {getActiveFilterCount()}
              </Badge>
            )}
          </Button>
        </SheetTrigger>
        
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Advanced Filters</SheetTitle>
          </SheetHeader>
          
          <div className="space-y-6 mt-6">
            {/* Job Posting Filters */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Briefcase className="h-4 w-4" />
                Job Posting
              </h3>
              <div className="space-y-4">
                {filterOptions.slice(0, 7).map((option) => (
                  <div key={option.key} className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <option.icon className="h-4 w-4" />
                      {option.label}
                    </label>
                    {renderFilterInput(option)}
                  </div>
                ))}
              </div>
            </div>

            {/* Company Filters */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Building className="h-4 w-4" />
                Company & Additional
              </h3>
              <div className="space-y-4">
                {filterOptions.slice(7).map((option) => (
                  <div key={option.key} className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
                      <option.icon className="h-4 w-4" />
                      {option.label}
                    </label>
                    {renderFilterInput(option)}
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4 border-t">
              <Button onClick={applyFilters} className="flex-1">
                Apply Filters
              </Button>
              <Button variant="outline" onClick={clearAllFilters}>
                Clear All
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default AdvancedFilters;