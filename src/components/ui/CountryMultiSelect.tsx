import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Filter, X } from "lucide-react";
import countries from 'world-countries';

const COUNTRIES = countries.map(country => ({
  code: country.cca2,
  name: country.name.common,
  flag: country.flag
})).sort((a, b) => a.name.localeCompare(b.name));

const CountryMultiSelect = ({
  selectedCountries,
  onSelectionChange,
}: {
  selectedCountries: string[];
  onSelectionChange: (countries: string[]) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('.country-multiselect')) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const filteredCountries = COUNTRIES.filter(country =>
    country.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    country.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleCountry = (countryCode: string) => {
    if (selectedCountries.includes(countryCode)) {
      onSelectionChange(selectedCountries.filter(code => code !== countryCode));
    } else {
      onSelectionChange([...selectedCountries, countryCode]);
    }
  };

  const removeCountry = (countryCode: string) => {
    onSelectionChange(selectedCountries.filter(code => code !== countryCode));
  };

  const getSelectedCountryObjects = () => {
    return selectedCountries
      .map(code => COUNTRIES.find(c => c.code === code))
      .filter(Boolean) as { code: string; name: string; flag: string }[];
  };

  return (
    <div className="relative country-multiselect">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full border rounded-md p-2 text-left flex items-center min-h-[40px] flex-wrap gap-1"
      >
        {selectedCountries.length === 0 ? (
          <span className="text-gray-500">Select countries...</span>
        ) : (
          <div className="flex flex-wrap gap-1">
            {getSelectedCountryObjects().map((country) => (
              <span
                key={country.code}
                className="flex items-center bg-blue-100 text-blue-700 rounded px-2 py-0.5 text-xs font-medium mr-1 mb-1"
                onClick={e => e.stopPropagation()}
              >
                <span className="mr-1">{country.flag}</span>
                {country.name}
                <button
                  type="button"
                  className="ml-1 text-blue-500 hover:text-red-500 focus:outline-none"
                  onClick={e => { e.stopPropagation(); removeCountry(country.code); }}
                  aria-label={`Remove ${country.name}`}
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
          </div>
        )}
        <span className="ml-auto pl-2"><Filter className="h-4 w-4" /></span>
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border rounded-md shadow-lg max-h-64 overflow-hidden">
          <div className="p-2 border-b">
            <Input
              type="text"
              placeholder="Search countries..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8"
            />
          </div>
          <div className="overflow-y-auto max-h-48">
            {filteredCountries.map((country) => (
              <div
                key={country.code}
                className="flex items-center gap-2 p-2 hover:bg-gray-50 cursor-pointer"
                onClick={() => toggleCountry(country.code)}
              >
                <Checkbox
                  checked={selectedCountries.includes(country.code)}
                  onChange={() => {}} // Handled by onClick above
                />
                <span className="flex items-center gap-2">
                  <span>{country.flag}</span>
                  <span>{country.name}</span>
                </span>
              </div>
            ))}
            {filteredCountries.length === 0 && (
              <div className="p-4 text-center text-gray-500">
                No countries found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CountryMultiSelect; 