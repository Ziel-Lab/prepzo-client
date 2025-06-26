import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { MoreHorizontal, ExternalLink, Eye, Edit, Trash2, Building, MapPin, Calendar, DollarSign, EyeOff, Link2, Search, Filter, X } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useIsMobile } from "@/hooks/use-mobile";
import JobDetailsDialog from "./JobDetailsDialog";
import { toast } from "@/hooks/use-toast";
import { createClient } from "@/utils/supabase/client";
import { useSubscription } from "@/contexts/SubscriptionContext";
import type { FeatureUsage, SubscriptionPlan } from "@/contexts/SubscriptionContext";

// Country data - comprehensive list with flags and codes
const COUNTRIES = [
  { code: "AF", name: "Afghanistan", flag: "🇦🇫" },
  { code: "AL", name: "Albania", flag: "🇦🇱" },
  { code: "DZ", name: "Algeria", flag: "🇩🇿" },
  { code: "AS", name: "American Samoa", flag: "🇦🇸" },
  { code: "AD", name: "Andorra", flag: "🇦🇩" },
  { code: "AO", name: "Angola", flag: "🇦🇴" },
  { code: "AI", name: "Anguilla", flag: "🇦🇮" },
  { code: "AQ", name: "Antarctica", flag: "🇦🇶" },
  { code: "AG", name: "Antigua and Barbuda", flag: "🇦🇬" },
  { code: "AR", name: "Argentina", flag: "🇦🇷" },
  { code: "AM", name: "Armenia", flag: "🇦🇲" },
  { code: "AW", name: "Aruba", flag: "🇦🇼" },
  { code: "AU", name: "Australia", flag: "🇦🇺" },
  { code: "AT", name: "Austria", flag: "🇦🇹" },
  { code: "AZ", name: "Azerbaijan", flag: "🇦🇿" },
  { code: "BS", name: "Bahamas", flag: "🇧🇸" },
  { code: "BH", name: "Bahrain", flag: "🇧🇭" },
  { code: "BD", name: "Bangladesh", flag: "🇧🇩" },
  { code: "BB", name: "Barbados", flag: "🇧🇧" },
  { code: "BY", name: "Belarus", flag: "🇧🇾" },
  { code: "BE", name: "Belgium", flag: "🇧🇪" },
  { code: "BZ", name: "Belize", flag: "🇧🇿" },
  { code: "BJ", name: "Benin", flag: "🇧🇯" },
  { code: "BM", name: "Bermuda", flag: "🇧🇲" },
  { code: "BT", name: "Bhutan", flag: "🇧🇹" },
  { code: "BO", name: "Bolivia", flag: "🇧🇴" },
  { code: "BA", name: "Bosnia and Herzegovina", flag: "🇧🇦" },
  { code: "BW", name: "Botswana", flag: "🇧🇼" },
  { code: "BR", name: "Brazil", flag: "🇧🇷" },
  { code: "BN", name: "Brunei", flag: "🇧🇳" },
  { code: "BG", name: "Bulgaria", flag: "🇧🇬" },
  { code: "BF", name: "Burkina Faso", flag: "🇧🇫" },
  { code: "BI", name: "Burundi", flag: "🇧🇮" },
  { code: "CV", name: "Cape Verde", flag: "🇨🇻" },
  { code: "KH", name: "Cambodia", flag: "🇰🇭" },
  { code: "CM", name: "Cameroon", flag: "🇨🇲" },
  { code: "CA", name: "Canada", flag: "🇨🇦" },
  { code: "KY", name: "Cayman Islands", flag: "🇰🇾" },
  { code: "CF", name: "Central African Republic", flag: "🇨🇫" },
  { code: "TD", name: "Chad", flag: "🇹🇩" },
  { code: "CL", name: "Chile", flag: "🇨🇱" },
  { code: "CN", name: "China", flag: "🇨🇳" },
  { code: "CO", name: "Colombia", flag: "🇨🇴" },
  { code: "KM", name: "Comoros", flag: "🇰🇲" },
  { code: "CG", name: "Congo", flag: "🇨🇬" },
  { code: "CD", name: "Congo (DRC)", flag: "🇨🇩" },
  { code: "CK", name: "Cook Islands", flag: "🇨🇰" },
  { code: "CR", name: "Costa Rica", flag: "🇨🇷" },
  { code: "CI", name: "Côte d'Ivoire", flag: "🇨🇮" },
  { code: "HR", name: "Croatia", flag: "🇭🇷" },
  { code: "CU", name: "Cuba", flag: "🇨🇺" },
  { code: "CW", name: "Curaçao", flag: "🇨🇼" },
  { code: "CY", name: "Cyprus", flag: "🇨🇾" },
  { code: "CZ", name: "Czech Republic", flag: "🇨🇿" },
  { code: "DK", name: "Denmark", flag: "🇩🇰" },
  { code: "DJ", name: "Djibouti", flag: "🇩🇯" },
  { code: "DM", name: "Dominica", flag: "🇩🇲" },
  { code: "DO", name: "Dominican Republic", flag: "🇩🇴" },
  { code: "EC", name: "Ecuador", flag: "🇪🇨" },
  { code: "EG", name: "Egypt", flag: "🇪🇬" },
  { code: "SV", name: "El Salvador", flag: "🇸🇻" },
  { code: "GQ", name: "Equatorial Guinea", flag: "🇬🇶" },
  { code: "ER", name: "Eritrea", flag: "🇪🇷" },
  { code: "EE", name: "Estonia", flag: "🇪🇪" },
  { code: "SZ", name: "Eswatini", flag: "🇸🇿" },
  { code: "ET", name: "Ethiopia", flag: "🇪🇹" },
  { code: "FK", name: "Falkland Islands", flag: "🇫🇰" },
  { code: "FO", name: "Faroe Islands", flag: "🇫🇴" },
  { code: "FJ", name: "Fiji", flag: "🇫🇯" },
  { code: "FI", name: "Finland", flag: "🇫🇮" },
  { code: "FR", name: "France", flag: "🇫🇷" },
  { code: "GF", name: "French Guiana", flag: "🇬🇫" },
  { code: "PF", name: "French Polynesia", flag: "🇵🇫" },
  { code: "GA", name: "Gabon", flag: "🇬🇦" },
  { code: "GM", name: "Gambia", flag: "🇬🇲" },
  { code: "GE", name: "Georgia", flag: "🇬🇪" },
  { code: "DE", name: "Germany", flag: "🇩🇪" },
  { code: "GH", name: "Ghana", flag: "🇬🇭" },
  { code: "GI", name: "Gibraltar", flag: "🇬🇮" },
  { code: "GR", name: "Greece", flag: "🇬🇷" },
  { code: "GL", name: "Greenland", flag: "🇬🇱" },
  { code: "GD", name: "Grenada", flag: "🇬🇩" },
  { code: "GP", name: "Guadeloupe", flag: "🇬🇵" },
  { code: "GU", name: "Guam", flag: "🇬🇺" },
  { code: "GT", name: "Guatemala", flag: "🇬🇹" },
  { code: "GG", name: "Guernsey", flag: "🇬🇬" },
  { code: "GN", name: "Guinea", flag: "🇬🇳" },
  { code: "GW", name: "Guinea-Bissau", flag: "🇬🇼" },
  { code: "GY", name: "Guyana", flag: "🇬🇾" },
  { code: "HT", name: "Haiti", flag: "🇭🇹" },
  { code: "HN", name: "Honduras", flag: "🇭🇳" },
  { code: "HK", name: "Hong Kong", flag: "🇭🇰" },
  { code: "HU", name: "Hungary", flag: "🇭🇺" },
  { code: "IS", name: "Iceland", flag: "🇮🇸" },
  { code: "IN", name: "India", flag: "🇮🇳" },
  { code: "ID", name: "Indonesia", flag: "🇮🇩" },
  { code: "IR", name: "Iran", flag: "🇮🇷" },
  { code: "IQ", name: "Iraq", flag: "🇮🇶" },
  { code: "IE", name: "Ireland", flag: "🇮🇪" },
  { code: "IM", name: "Isle of Man", flag: "🇮🇲" },
  { code: "IL", name: "Israel", flag: "🇮🇱" },
  { code: "IT", name: "Italy", flag: "🇮🇹" },
  { code: "JM", name: "Jamaica", flag: "🇯🇲" },
  { code: "JP", name: "Japan", flag: "🇯🇵" },
  { code: "JE", name: "Jersey", flag: "🇯🇪" },
  { code: "JO", name: "Jordan", flag: "🇯🇴" },
  { code: "KZ", name: "Kazakhstan", flag: "🇰🇿" },
  { code: "KE", name: "Kenya", flag: "🇰🇪" },
  { code: "KI", name: "Kiribati", flag: "🇰🇮" },
  { code: "KP", name: "North Korea", flag: "🇰🇵" },
  { code: "KR", name: "South Korea", flag: "🇰🇷" },
  { code: "KW", name: "Kuwait", flag: "🇰🇼" },
  { code: "KG", name: "Kyrgyzstan", flag: "🇰🇬" },
  { code: "LA", name: "Laos", flag: "🇱🇦" },
  { code: "LV", name: "Latvia", flag: "🇱🇻" },
  { code: "LB", name: "Lebanon", flag: "🇱🇧" },
  { code: "LS", name: "Lesotho", flag: "🇱🇸" },
  { code: "LR", name: "Liberia", flag: "🇱🇷" },
  { code: "LY", name: "Libya", flag: "🇱🇾" },
  { code: "LI", name: "Liechtenstein", flag: "🇱🇮" },
  { code: "LT", name: "Lithuania", flag: "🇱🇹" },
  { code: "LU", name: "Luxembourg", flag: "🇱🇺" },
  { code: "MO", name: "Macao", flag: "🇲🇴" },
  { code: "MK", name: "North Macedonia", flag: "🇲🇰" },
  { code: "MG", name: "Madagascar", flag: "🇲🇬" },
  { code: "MW", name: "Malawi", flag: "🇲🇼" },
  { code: "MY", name: "Malaysia", flag: "🇲🇾" },
  { code: "MV", name: "Maldives", flag: "🇲🇻" },
  { code: "ML", name: "Mali", flag: "🇲🇱" },
  { code: "MT", name: "Malta", flag: "🇲🇹" },
  { code: "MH", name: "Marshall Islands", flag: "🇲🇭" },
  { code: "MQ", name: "Martinique", flag: "🇲🇶" },
  { code: "MR", name: "Mauritania", flag: "🇲🇷" },
  { code: "MU", name: "Mauritius", flag: "🇲🇺" },
  { code: "YT", name: "Mayotte", flag: "🇾🇹" },
  { code: "MX", name: "Mexico", flag: "🇲🇽" },
  { code: "FM", name: "Micronesia", flag: "🇫🇲" },
  { code: "MD", name: "Moldova", flag: "🇲🇩" },
  { code: "MC", name: "Monaco", flag: "🇲🇨" },
  { code: "MN", name: "Mongolia", flag: "🇲🇳" },
  { code: "ME", name: "Montenegro", flag: "🇲🇪" },
  { code: "MS", name: "Montserrat", flag: "🇲🇸" },
  { code: "MA", name: "Morocco", flag: "🇲🇦" },
  { code: "MZ", name: "Mozambique", flag: "🇲🇿" },
  { code: "MM", name: "Myanmar", flag: "🇲🇲" },
  { code: "NA", name: "Namibia", flag: "🇳🇦" },
  { code: "NR", name: "Nauru", flag: "🇳🇷" },
  { code: "NP", name: "Nepal", flag: "🇳🇵" },
  { code: "NL", name: "Netherlands", flag: "🇳🇱" },
  { code: "NC", name: "New Caledonia", flag: "🇳🇨" },
  { code: "NZ", name: "New Zealand", flag: "🇳🇿" },
  { code: "NI", name: "Nicaragua", flag: "🇳🇮" },
  { code: "NE", name: "Niger", flag: "🇳🇪" },
  { code: "NG", name: "Nigeria", flag: "🇳🇬" },
  { code: "NU", name: "Niue", flag: "🇳🇺" },
  { code: "NF", name: "Norfolk Island", flag: "🇳🇫" },
  { code: "MP", name: "Northern Mariana Islands", flag: "🇲🇵" },
  { code: "NO", name: "Norway", flag: "🇳🇴" },
  { code: "OM", name: "Oman", flag: "🇴🇲" },
  { code: "PK", name: "Pakistan", flag: "🇵🇰" },
  { code: "PW", name: "Palau", flag: "🇵🇼" },
  { code: "PS", name: "Palestine", flag: "🇵🇸" },
  { code: "PA", name: "Panama", flag: "🇵🇦" },
  { code: "PG", name: "Papua New Guinea", flag: "🇵🇬" },
  { code: "PY", name: "Paraguay", flag: "🇵🇾" },
  { code: "PE", name: "Peru", flag: "🇵🇪" },
  { code: "PH", name: "Philippines", flag: "🇵🇭" },
  { code: "PN", name: "Pitcairn Islands", flag: "🇵🇳" },
  { code: "PL", name: "Poland", flag: "🇵🇱" },
  { code: "PT", name: "Portugal", flag: "🇵🇹" },
  { code: "PR", name: "Puerto Rico", flag: "🇵🇷" },
  { code: "QA", name: "Qatar", flag: "🇶🇦" },
  { code: "RE", name: "Réunion", flag: "🇷🇪" },
  { code: "RO", name: "Romania", flag: "🇷🇴" },
  { code: "RU", name: "Russia", flag: "🇷🇺" },
  { code: "RW", name: "Rwanda", flag: "🇷🇼" },
  { code: "BL", name: "Saint Barthélemy", flag: "🇧🇱" },
  { code: "SH", name: "Saint Helena", flag: "🇸🇭" },
  { code: "KN", name: "Saint Kitts and Nevis", flag: "🇰🇳" },
  { code: "LC", name: "Saint Lucia", flag: "🇱🇨" },
  { code: "MF", name: "Saint Martin", flag: "🇲🇫" },
  { code: "PM", name: "Saint Pierre and Miquelon", flag: "🇵🇲" },
  { code: "VC", name: "Saint Vincent and the Grenadines", flag: "🇻🇨" },
  { code: "WS", name: "Samoa", flag: "🇼🇸" },
  { code: "SM", name: "San Marino", flag: "🇸🇲" },
  { code: "ST", name: "São Tomé and Príncipe", flag: "🇸🇹" },
  { code: "SA", name: "Saudi Arabia", flag: "🇸🇦" },
  { code: "SN", name: "Senegal", flag: "🇸🇳" },
  { code: "RS", name: "Serbia", flag: "🇷🇸" },
  { code: "SC", name: "Seychelles", flag: "🇸🇨" },
  { code: "SL", name: "Sierra Leone", flag: "🇸🇱" },
  { code: "SG", name: "Singapore", flag: "🇸🇬" },
  { code: "SX", name: "Sint Maarten", flag: "🇸🇽" },
  { code: "SK", name: "Slovakia", flag: "🇸🇰" },
  { code: "SI", name: "Slovenia", flag: "🇸🇮" },
  { code: "SB", name: "Solomon Islands", flag: "🇸🇧" },
  { code: "SO", name: "Somalia", flag: "🇸🇴" },
  { code: "ZA", name: "South Africa", flag: "🇿🇦" },
  { code: "GS", name: "South Georgia", flag: "🇬🇸" },
  { code: "SS", name: "South Sudan", flag: "🇸🇸" },
  { code: "ES", name: "Spain", flag: "🇪🇸" },
  { code: "LK", name: "Sri Lanka", flag: "🇱🇰" },
  { code: "SD", name: "Sudan", flag: "🇸🇩" },
  { code: "SR", name: "Suriname", flag: "🇸🇷" },
  { code: "SJ", name: "Svalbard and Jan Mayen", flag: "🇸🇯" },
  { code: "SE", name: "Sweden", flag: "🇸🇪" },
  { code: "CH", name: "Switzerland", flag: "🇨🇭" },
  { code: "SY", name: "Syria", flag: "🇸🇾" },
  { code: "TW", name: "Taiwan", flag: "🇹🇼" },
  { code: "TJ", name: "Tajikistan", flag: "🇹🇯" },
  { code: "TZ", name: "Tanzania", flag: "🇹🇿" },
  { code: "TH", name: "Thailand", flag: "🇹🇭" },
  { code: "TL", name: "Timor-Leste", flag: "🇹🇱" },
  { code: "TG", name: "Togo", flag: "🇹🇬" },
  { code: "TK", name: "Tokelau", flag: "🇹🇰" },
  { code: "TO", name: "Tonga", flag: "🇹🇴" },
  { code: "TT", name: "Trinidad and Tobago", flag: "🇹🇹" },
  { code: "TN", name: "Tunisia", flag: "🇹🇳" },
  { code: "TR", name: "Turkey", flag: "🇹🇷" },
  { code: "TM", name: "Turkmenistan", flag: "🇹🇲" },
  { code: "TC", name: "Turks and Caicos Islands", flag: "🇹🇨" },
  { code: "TV", name: "Tuvalu", flag: "🇹🇻" },
  { code: "UG", name: "Uganda", flag: "🇺🇬" },
  { code: "UA", name: "Ukraine", flag: "🇺🇦" },
  { code: "AE", name: "United Arab Emirates", flag: "🇦🇪" },
  { code: "GB", name: "United Kingdom", flag: "🇬🇧" },
  { code: "US", name: "United States", flag: "🇺🇸" },
  { code: "UY", name: "Uruguay", flag: "🇺🇾" },
  { code: "UZ", name: "Uzbekistan", flag: "🇺🇿" },
  { code: "VU", name: "Vanuatu", flag: "🇻🇺" },
  { code: "VA", name: "Vatican City", flag: "🇻🇦" },
  { code: "VE", name: "Venezuela", flag: "🇻🇪" },
  { code: "VN", name: "Vietnam", flag: "🇻🇳" },
  { code: "VG", name: "British Virgin Islands", flag: "🇻🇬" },
  { code: "VI", name: "U.S. Virgin Islands", flag: "🇻🇮" },
  { code: "WF", name: "Wallis and Futuna", flag: "🇼🇫" },
  { code: "EH", name: "Western Sahara", flag: "🇪🇭" },
  { code: "YE", name: "Yemen", flag: "🇾🇪" },
  { code: "ZM", name: "Zambia", flag: "🇿🇲" },
  { code: "ZW", name: "Zimbabwe", flag: "🇿🇼" }
];

// Tag component for job keywords and company names
const TagInput = ({ 
  tags, 
  onAddTag, 
  onRemoveTag, 
  placeholder,
  id 
}: {
  tags: string[];
  onAddTag: (tag: string) => void;
  onRemoveTag: (index: number) => void;
  placeholder: string;
  id: string;
}) => {
  const [inputValue, setInputValue] = useState("");

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const value = inputValue.trim();
      if (value && !tags.includes(value)) {
        onAddTag(value);
        setInputValue("");
      }
    } else if (e.key === "Backspace" && !inputValue && tags.length > 0) {
      onRemoveTag(tags.length - 1);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  };

  return (
    <div className="border rounded-md p-2 min-h-[40px] flex flex-wrap gap-1 items-center">
      {tags.map((tag, index) => (
        <span
          key={index}
          className="bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-sm flex items-center gap-1"
        >
          {tag}
          <button
            type="button"
            onClick={() => onRemoveTag(index)}
            className="hover:text-blue-600"
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
      <input
        id={id}
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder={tags.length === 0 ? placeholder : ""}
        className="flex-1 outline-none bg-transparent min-w-[120px]"
      />
    </div>
  );
};

// Multi-select component for countries
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

  const getSelectedCountryNames = () => {
    return selectedCountries
      .map(code => COUNTRIES.find(c => c.code === code))
      .filter(Boolean)
      .map(c => `${c!.flag} ${c!.name}`)
      .join(", ");
  };

  return (
    <div className="relative country-multiselect">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full border rounded-md p-2 text-left flex items-center justify-between min-h-[40px]"
      >
        <span className={selectedCountries.length === 0 ? "text-gray-500" : ""}>
          {selectedCountries.length === 0 
            ? "Select countries..." 
            : selectedCountries.length === 1 
            ? getSelectedCountryNames()
            : `${selectedCountries.length} countries selected`
          }
        </span>
        <Filter className="h-4 w-4" />
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

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case "interview":
      return "bg-green-100 text-green-800 hover:bg-green-200";
    case "applied":
      return "bg-blue-100 text-blue-800 hover:bg-blue-200";
    case "review":
      return "bg-yellow-100 text-yellow-800 hover:bg-yellow-200";
    case "rejected":
      return "bg-red-100 text-red-800 hover:bg-red-200";
    case "offer":
      return "bg-purple-100 text-purple-800 hover:bg-purple-200";
    default:
      return "bg-gray-100 text-gray-800 hover:bg-gray-200";
  }
};

const getMatchScoreColor = (score: number) => {
  if (score >= 85) return "text-green-600 font-semibold";
  if (score >= 70) return "text-yellow-600 font-semibold";
  return "text-red-600 font-semibold";
};

const getSeniorityLevel = (seniority: string) => {
  switch (seniority) {
    case "entry_level":
      return "Entry Level";
    case "mid_level":
      return "Mid Level";
    case "senior_level":
      return "Senior Level";
    case "executive":
      return "Executive";
    default:
      return "Not Specified";
  }
};

// ---------------------------------------------------------------------------
// Helpers for country display
// ---------------------------------------------------------------------------

const getFlagEmoji = (countryCode?: string) => {
  if (!countryCode) return "";
  const cleaned = countryCode.trim().toUpperCase();
  if (cleaned.length !== 2 || /[^A-Z]/.test(cleaned)) return "";
  const codePoints = [...cleaned].map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
};

const getCountryName = (countryCode?: string) => {
  if (!countryCode) return "";
  try {
    // Intl.DisplayNames is supported in modern browsers
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - Some TS versions may not have DisplayNames definition
    const dn = new Intl.DisplayNames(["en"], { type: "region" });
    return dn.of(countryCode) || countryCode;
  } catch {
    return countryCode;
  }
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type Job = {
  id: number;
  job_title: string;
  url: string;
  date_posted: string;
  company: string;
  location: string;
  remote: boolean;
  hybrid: boolean;
  salary_string?: string;
  seniority: string;
  easy_apply?: boolean;
  industry?: string;
  description?: string;
  company_object?: {
    name?: string;
    domain?: string;
    employee_count?: number;
    logo?: string;
    employee_count_range?: string;
  };
  hiring_team?: Array<{
    first_name?: string;
    full_name?: string;
    linkedin_url?: string;
  }>;
  applied_at?: string;
  status?: string;
  match_score?: number;
  revealed?: boolean;
  employment_statuses?: string[];
  has_blurred_data?: boolean;
  country_code?: string;
};

export type SearchFilters = {
  job_description_contains_or?: string[];
  job_country_code_or?: string[];
  job_seniority_or?: string[];
  remote?: boolean;
  posted_at_max_age_days?: number;
  min_salary_usd?: number;
  max_salary_usd?: number;
  company_name_or?: string[];
  hiring_managers_exists?: boolean;
  job_location_pattern_or?: string[];
};

export type Filters = {
  search?: string;
  status?: string;
  remote?: boolean;
  seniority?: string; 
};

// Extend FeatureUsage and SubscriptionPlan to accommodate job search credits
type ExtendedFeatureUsage = FeatureUsage & { job_search_results_count?: number };

type ExtendedSubscriptionPlan = SubscriptionPlan & {
  job_search_results_limit_per_month?: number;
  job_search_results_limit?: number;
};

const ApplicationsTable = ({ filters = {} as Filters }: { filters?: Filters }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [applications, setApplications] = useState<Job[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [showFilters, setShowFilters] = useState<boolean>(true);
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    posted_at_max_age_days: 15,
    job_country_code_or: ["IN"],
  });
  
  // Separate state for tag inputs
  const [jobKeywords, setJobKeywords] = useState<string[]>([]);
  const [companyNames, setCompanyNames] = useState<string[]>([]);
  const [selectedCountries, setSelectedCountries] = useState<string[]>(["IN"]);
  
  const [revealedJobs, setRevealedJobs] = useState<Set<number>>(new Set([540181867]));
  const [chargedJobs, setChargedJobs] = useState<Set<number>>(new Set());
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const isMobile = useIsMobile();
  const itemsPerPage = 10;

  // Initialize Supabase client once for this component
  const supabase = createClient();

  // ---------------------------------------------------------------------------
  // Credit tracking via feature_usage.job_search_results_count
  // ---------------------------------------------------------------------------
  const { subscription } = useSubscription();

  // Prefer the new column `job_search_results_limit`; fallback to *_per_month for backward-compat
  const JOB_SEARCH_LIMIT = (subscription?.subscription_plans as ExtendedSubscriptionPlan | undefined)?.job_search_results_limit ??
                           (subscription?.subscription_plans as ExtendedSubscriptionPlan | undefined)?.job_search_results_limit_per_month ??
                           100;
  const initialUsed = (subscription?.usage as ExtendedFeatureUsage | undefined)?.job_search_results_count ?? 0;

  const [creditsLeft, setCreditsLeft] = useState<number>(JOB_SEARCH_LIMIT - initialUsed);

  // Recalculate remaining credits whenever subscription usage or limits change
  useEffect(() => {
    if (subscription) {
      const used = (subscription?.usage as ExtendedFeatureUsage | undefined)?.job_search_results_count ?? 0;
      setCreditsLeft(JOB_SEARCH_LIMIT - used);
    }
  }, [subscription, JOB_SEARCH_LIMIT]);

  // ---------------------------------------------------------------------------
  // Data fetching
  // ---------------------------------------------------------------------------
  const fetchJobs = async () => {
    try {
      setLoading(true);

      const requestBody = {
        page: currentPage - 1, // API is 0-indexed
        limit: 100,
        posted_at_max_age_days: searchFilters.posted_at_max_age_days || 15,
        blur_company_data: true,
        order_by: [{ desc: true, field: "date_posted" }],
        job_country_code_or: searchFilters.job_country_code_or || ["IN"],
        include_total_results: false,
        ...(searchFilters.job_description_contains_or && searchFilters.job_description_contains_or.length > 0 && { job_description_contains_or: searchFilters.job_description_contains_or }),
        ...(searchFilters.job_seniority_or && searchFilters.job_seniority_or.length > 0 && { job_seniority_or: searchFilters.job_seniority_or }),
        ...(searchFilters.company_name_or && searchFilters.company_name_or.length > 0 && { company_name_or: searchFilters.company_name_or }),
        ...(searchFilters.min_salary_usd && { min_salary_usd: searchFilters.min_salary_usd }),
        ...(searchFilters.max_salary_usd && { max_salary_usd: searchFilters.max_salary_usd }),
        ...(searchFilters.hiring_managers_exists !== undefined && { hiring_managers_exists: searchFilters.hiring_managers_exists }),
        ...(searchFilters.job_location_pattern_or && searchFilters.job_location_pattern_or.length > 0 && { job_location_pattern_or: searchFilters.job_location_pattern_or }),
      };

      // Retrieve JWT token from Supabase session for Authorization header
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (!sessionError && session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }

      const res = await fetch(process.env.NEXT_PUBLIC_BACKEND_URL_USER_PORTAL + "/search-jobs", {
        method: "POST",
        headers,
        body: JSON.stringify(requestBody),
      });

      // -------------------------------------------------------------------
      // Handle API errors (e.g. usage limits) and HTTP errors gracefully
      // -------------------------------------------------------------------
      type ApiResponse = {
        data?: unknown;
        error?: string;
        limit?: number;
        usage?: number;
      };

      let json: ApiResponse | null = null;
      try {
        json = await res.json();
      } catch {
        // If parsing fails we will handle via status check below
      }

      // If backend returned an explicit error payload, surface it to the user
      if (json?.error) {
        toast({
          title: "Limit reached",
          description: json.error as string,
        });
        return; // Stop further processing – nothing to render
      }

      // If HTTP status is not OK, use any parsed message or a fallback
      if (!res.ok) {
        const errMsg = (json && typeof json.error === "string") ? json.error : `Failed to fetch jobs – status ${res.status}`;
        throw new Error(errMsg);
      }

      if (json?.data && Array.isArray(json.data)) {
        setApplications(json.data as Job[]);
      }
    } catch (err: unknown) {
      console.error(err);
      const message = err instanceof Error ? err.message : "Unknown error";
      toast({
        title: "Unable to fetch applications",
        description: message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    // Update searchFilters with tag input data
    setSearchFilters(prev => ({
      ...prev,
      job_description_contains_or: jobKeywords.length > 0 ? jobKeywords : undefined,
      company_name_or: companyNames.length > 0 ? companyNames : undefined,
      job_country_code_or: selectedCountries.length > 0 ? selectedCountries : ["IN"],
    }));
    
    setHasSearched(true);
    setShowFilters(false);
    setCurrentPage(1);
    fetchJobs();
  };

  const handleEditFilters = () => {
    setShowFilters(true);
  };

  // Fetch jobs when page changes (but only after initial search)
  useEffect(() => {
    if (hasSearched && !showFilters) {
      fetchJobs();
    }
  }, [currentPage, hasSearched, showFilters, searchFilters]);

  // Apply filters to applications
  const filteredApplications = applications.filter((app) => {
    if (filters.search && !app.job_title.toLowerCase().includes(filters.search.toLowerCase()) && 
        !app.company.toLowerCase().includes(filters.search.toLowerCase())) {
      return false;
    }
    if (filters.status && (app.status || '').toLowerCase() !== filters.status.toLowerCase()) {
      return false;
    }
    // if (filters.seniority && app.seniority !== filters.seniority) {
    //   return false;
    // }
    if (filters.remote !== undefined && app.remote !== filters.remote) {
      return false;
    }
    // Add more filter logic as needed
    return true;
  });

  const totalPages = Math.ceil(filteredApplications.length / itemsPerPage);

  const fetchJobDetails = async (jobId: number) => {
    try {
      // Retrieve JWT token for Authorization header
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (!sessionError && session?.access_token) {
        headers["Authorization"] = `Bearer ${session.access_token}`;
      }

      const res = await fetch(process.env.NEXT_PUBLIC_BACKEND_URL_USER_PORTAL + "/get-job-details", {
        method: "POST",
        headers,
        body: JSON.stringify({ job_id_or: [jobId], limit: 1, blur_company_data: false }),
      });
      if (!res.ok) throw new Error(`Failed to fetch job ${jobId}`);
      const json = await res.json();
      const jobData: Job | undefined = json?.data?.[0];
      if (jobData) {
        setApplications(prev => prev.map(j => (j.id === jobId ? { ...jobData, has_blurred_data: false } : j)));
      }
    } catch (error) {
      console.error(error);
      toast({ title: "Unable to reveal job", description: (error as Error).message });
    }
  };

  const toggleReveal = async (jobId: number) => {
    const job = applications.find(j => j.id === jobId);
    if (job && !job.has_blurred_data) {
      // No need to reveal unblurred job
      return;
    }

    const isCurrentlyRevealed = revealedJobs.has(jobId);

    // If the job is currently revealed, hide it without affecting credits
    if (isCurrentlyRevealed) {
      setRevealedJobs(prev => {
        const ns = new Set(prev);
        ns.delete(jobId);
        return ns;
      });
      return;
    }

    // If the job was revealed before, allow reveal without additional credit deduction
    if (chargedJobs.has(jobId)) {
      setRevealedJobs(prev => new Set(prev).add(jobId));
      return;
    }

    // New reveal attempt – check credits
    if (creditsLeft === 0) {
      toast({
        title: "No credits left",
        description: "You've used all of your monthly credits. Upgrade or wait until next month to reveal more jobs.",
      });
      return;
    }

    // Deduct one credit locally
    setCreditsLeft(cl => Math.max(cl - 1, 0));
    setChargedJobs(prev => new Set(prev).add(jobId));
    setRevealedJobs(prev => new Set(prev).add(jobId));

    // Fetch full job details
    await fetchJobDetails(jobId);
  };

  const openJobDetails = (application: Job) => {
    if (application.has_blurred_data && !chargedJobs.has(application.id)) {
      toast({
        title: "Reveal first",
        description: "Please reveal this job to view its full details.",
      });
      return;
    }
    setSelectedJob(application);
    setIsDetailsDialogOpen(true);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  // Mobile Card Component with updated hiding logic
  const MobileApplicationCard = ({ application }: { application: Job }) => {
    const isRevealed = revealedJobs.has(application.id);
    const isBlurred = application.has_blurred_data && !isRevealed;
    
    return (
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="space-y-4">
            {/* Job Title and Status */}
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openJobDetails(application)}
                    className="font-semibold text-lg text-blue-600 hover:underline text-left"
                  >
                    {application.job_title}
                    <Link2 className="h-4 w-4 inline ml-1" />
                  </button>
                  {isBlurred && (
                    <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200">
                      Hidden
                    </Badge>
                  )}
                </div>
                {!isBlurred && (
                <div className="flex items-center gap-2 mt-1">
                  {/* <Badge variant="secondary" className={getStatusColor(application.status || "Applied")}>
                    {application.status || "Applied"}
                  </Badge> */}
                  <span className={getMatchScoreColor(application.match_score || 85)}>
                    {application.match_score || 85}% match
                  </span>
                </div>
                )}
              </div>
            </div>

            {/* Company Info */}
            {!isBlurred && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-sm font-medium text-blue-600">
                {isRevealed ? (application.company?.charAt(0) ?? "?") : "?"}
              </div>
              <div className="flex-1">
                <div className="font-medium">
                  {isRevealed ? application.company : "Hidden Company"}
                </div>
                <div className="text-sm text-gray-500">
                  {getSeniorityLevel(application.seniority)} • {application.company_object?.employee_count_range || "Unknown size"}
                </div>
              </div>
            </div>
            )}

            {/* Country, Location, Work Type */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600">
              <div className="flex items-center gap-1">
                {getFlagEmoji(application.country_code)} {getCountryName(application.country_code)}
              </div>
              <span>•</span>
              <div className="flex items-center gap-1">
                {application.location}
              </div>
              {application.remote && (
                <Badge variant="default" className="text-xs">Remote</Badge>
              )}
              {application.hybrid && (
                <Badge variant="outline" className="text-xs">Hybrid</Badge>
              )}
            </div>
            
            {/* Hiring team & Industry */}
            {!isBlurred && application.hiring_team?.length && (
              <div className="text-sm text-gray-600 flex items-center gap-2">
                <span className="font-medium">Hiring:</span>
                {application.hiring_team.map((m) => (
                  <span key={m.first_name}>{m.first_name}</span>
                ))}
              </div>
            )}

            {!isBlurred && application.industry && (
              <div className="text-sm text-gray-600">
                <span className="font-medium">Industry:</span> {application.industry}
              </div>
            )}

            {/* Date and Salary */}
            {!isBlurred && (
            <div className="flex items-center justify-between text-sm text-gray-600">
              <div className="flex items-center gap-1">
                <span>{application.salary_string || "Not disclosed"}</span>
              </div>
              <div className="flex items-center gap-1">
                
                <span>{formatDate(application.date_posted)}</span>
              </div>
            </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-2 border-t">
              {application.has_blurred_data && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => toggleReveal(application.id)}
                className="flex items-center gap-2"
              >
                {isRevealed ? (
                  <>
                    <EyeOff className="h-4 w-4" />
                    Hide Details
                  </>
                ) : (
                  <>
                    <Eye className="h-4 w-4" />
                    Reveal Details
                  </>
                )}
              </Button>
              )}
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuItem onClick={() => openJobDetails(application)}>
                    <Eye className="h-4 w-4 mr-2" />
                    View Details
                  </DropdownMenuItem>
                  {/* <DropdownMenuItem>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Status
                  </DropdownMenuItem> */}
                  {/* {isRevealed && (
                    <DropdownMenuItem>
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Open Job
                    </DropdownMenuItem>
                  )} */}
                  {/* <DropdownMenuItem className="text-red-600">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem> */}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Show filter form if filters haven't been applied yet or user wants to edit
  if (showFilters || !hasSearched) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-bold flex items-center">
            <Filter className="mr-2 h-5 w-5" />
            Job Search Filters
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="job_description">Job Keywords</Label>
              <TagInput
                id="job_description"
                tags={jobKeywords}
                onAddTag={(tag) => setJobKeywords(prev => [...prev, tag])}
                onRemoveTag={(index) => setJobKeywords(prev => prev.filter((_, i) => i !== index))}
                placeholder="Type keywords and press Enter (e.g. Software Developer, React, Python)"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="company_name">Company Name</Label>
              <TagInput
                id="company_name"
                tags={companyNames}
                onAddTag={(tag) => setCompanyNames(prev => [...prev, tag])}
                onRemoveTag={(index) => setCompanyNames(prev => prev.filter((_, i) => i !== index))}
                placeholder="Type company names and press Enter (e.g. Google, Microsoft, Amazon)"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                placeholder="e.g. Bangalore, Karnataka (comma separated, regex supported)"
                value={searchFilters.job_location_pattern_or?.join(", ") || ""}
                onChange={(e) => setSearchFilters(prev => ({
                  ...prev,
                  job_location_pattern_or: e.target.value ? e.target.value.split(",").map(s => s.trim()).filter(Boolean) : undefined
                }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="country">Countries</Label>
              <CountryMultiSelect
                selectedCountries={selectedCountries}
                onSelectionChange={setSelectedCountries}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="seniority">Seniority Level</Label>
              <Select
                value={searchFilters.job_seniority_or?.[0] || "any"}
                onValueChange={(value) => setSearchFilters(prev => ({ ...prev, job_seniority_or: value === "any" ? undefined : [value] }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Any level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any level</SelectItem>
                  <SelectItem value="junior">Junior</SelectItem>
                  <SelectItem value="mid_level">Mid Level</SelectItem>
                  <SelectItem value="senior">Senior</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                  <SelectItem value="c_level">C-Level</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="posted_days">Posted within</Label>
              <Select
                value={searchFilters.posted_at_max_age_days?.toString() || "15"}
                onValueChange={(value) => setSearchFilters(prev => ({ ...prev, posted_at_max_age_days: parseInt(value) }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select timeframe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">Last 24 hours</SelectItem>
                  <SelectItem value="3">Last 3 days</SelectItem>
                  <SelectItem value="7">Last week</SelectItem>
                  <SelectItem value="15">Last 2 weeks</SelectItem>
                  <SelectItem value="30">Last month</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="min_salary">Min Salary (USD) Annual</Label>
              <Input
                id="min_salary"
                type="number"
                placeholder="e.g. 100000"
                value={searchFilters.min_salary_usd || ""}
                onChange={(e) => setSearchFilters(prev => ({ ...prev, min_salary_usd: e.target.value ? parseInt(e.target.value) : undefined }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="max_salary">Max Salary (USD) Annual</Label>
              <Input
                id="max_salary"
                type="number"
                placeholder="e.g. 200000"
                value={searchFilters.max_salary_usd || ""}
                onChange={(e) => setSearchFilters(prev => ({ ...prev, max_salary_usd: e.target.value ? parseInt(e.target.value) : undefined }))}
              />
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="text-sm font-medium">Filters</h3>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remote"
                  checked={searchFilters.remote || false}
                  onCheckedChange={(checked) => setSearchFilters(prev => ({ ...prev, remote: checked === true }))}
                />
                <Label htmlFor="remote">Remote</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hiring_managers"
                  checked={searchFilters.hiring_managers_exists || false}
                  onCheckedChange={(checked) => setSearchFilters(prev => ({ ...prev, hiring_managers_exists: checked === true }))}
                />
                <Label htmlFor="hiring_managers">Has Hiring Manager</Label>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button onClick={handleSearch} className="flex-1" disabled={loading}>
              <Search className="mr-2 h-4 w-4" />
              {loading ? "Searching..." : "Search Jobs"}
            </Button>
            {hasSearched && (
              <Button variant="outline" onClick={() => setShowFilters(false)}>
                Cancel
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">Applications ({filteredApplications.length})</CardTitle>
            <Button variant="outline" size="sm" onClick={handleEditFilters}>
              <Filter className="mr-2 h-4 w-4" />
              Edit Filters
            </Button>
          </div>
          <div className="text-sm text-gray-500 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
            <span>Credits Left: {creditsLeft}/{JOB_SEARCH_LIMIT}</span>
            <span>•</span>
            <span>
              Showing 1-{Math.min(itemsPerPage, filteredApplications.length)} of {filteredApplications.length} results
            </span>
            {loading && (
              <span className="text-blue-600 animate-pulse">Fetching latest jobs…</span>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isMobile ? (
            // Mobile Layout
            <div className="p-4">
              {filteredApplications.map((application) => (
                <MobileApplicationCard key={application.id} application={application} />
              ))}
            </div>
          ) : (
            // Desktop Table Layout with updated hiding logic
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="w-[350px]">Job Details</TableHead>
                    <TableHead className="w-[140px]">Company</TableHead>
                    <TableHead className="w-[100px]">Country</TableHead>
                    <TableHead className="w-[120px]">Location</TableHead>
                    <TableHead className="w-[100px]">Posted</TableHead>
                    <TableHead className="w-[120px]">Salary</TableHead>
                    <TableHead className="w-[100px]">Hiring Team</TableHead>
                    <TableHead className="w-[100px]">Match</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                    <TableHead className="w-[100px]">Industry</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredApplications.map((application) => {
                    const isRevealed = revealedJobs.has(application.id);
                    const isBlurred = application.has_blurred_data && !isRevealed;
                    
                    return (
                      <TableRow key={application.id} className="hover:bg-gray-50">
                        <TableCell>
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => openJobDetails(application)}
                                className="font-semibold text-lg text-blue-600 hover:underline text-left"
                              >
                                {application.job_title}
                                <Link2 className="h-4 w-4 inline ml-1" />
                              </button>
                              {isBlurred && (
                                <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200">
                                  Hidden
                                </Badge>
                              )}
                            </div>
                            {!isBlurred && (
                              <div className="flex items-center gap-3 mt-1">
                                <div className="flex items-center gap-1 text-sm text-gray-500">
                                  <Building className="h-3 w-3" />
                                  {getSeniorityLevel(application.seniority)}
                                </div>
                                <div className="flex items-center gap-1 text-sm text-gray-500">
                                  <span>•</span>
                                  {application.company_object?.employee_count_range || "Unknown size"}
                                </div>
                                {application.easy_apply && (
                                  <Badge variant="secondary" className="text-xs bg-green-50 text-green-700">
                                    Easy Apply
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          {isBlurred ? (
                            <span className="text-sm text-gray-500">Hidden</span>
                          ) : (
                            <div className="flex items-center gap-2">
                              {application.company_object?.logo ? (
                                <img
                                  src={application.company_object.logo}
                                  alt={application.company}
                                  className="w-8 h-8 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-medium text-blue-600">
                                  {application.company?.charAt(0) ?? "?"}
                                </div>
                              )}
                              <div className="flex flex-col">
                                <span className="font-medium text-sm">
                                  {application.company}
                                </span>
                                {(() => {
                                  const hasTeam = application.hiring_team && application.hiring_team.length > 0;
                                  if (hasTeam) {
                                    return (
                                      <span className="text-xs text-gray-500">
                                        {application.hiring_team![0].first_name}
                                      </span>
                                    );
                                  }
                                  return null;
                                })()}
                              </div>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          
                            <span className="text-sm flex items-center gap-1">
                              {getFlagEmoji(application.country_code)}
                              {getCountryName(application.country_code)}
                            </span>
                          
                        </TableCell>
                        <TableCell>
                          
                            <div className="flex flex-col">
                              <div className="flex items-center gap-1 text-sm">
                                
                                {application.location}
                              </div>
                              <div className="flex items-center gap-1 mt-1">
                                {application.remote && (
                                  <Badge variant="default" className="text-xs">
                                    Remote
                                  </Badge>
                                )}
                                {application.hybrid && (
                                  <Badge variant="outline" className="text-xs">
                                    Hybrid
                                  </Badge>
                                )}
                              </div>
                            </div>
                          
                        </TableCell>
                        <TableCell>
                          {application.hiring_team?.map((teamMember) => (
                            <div key={teamMember.first_name} className="flex items-center gap-1 text-sm">
                              <span>{teamMember.first_name}</span>
                            </div>
                          ))}
                        </TableCell>
                        <TableCell>
                          {isBlurred ? "—" : (
                            <div className="flex items-center gap-1 text-sm">
                              {formatDate(application.date_posted)}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {isBlurred ? "—" : (
                            <div className="flex items-center gap-1 text-sm">
                              {application.salary_string || "Not disclosed"}
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          {isBlurred ? "—" : (
                            <span className={getMatchScoreColor(application.match_score || 85)}>
                              {application.match_score || 85}%
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            {application.has_blurred_data && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => toggleReveal(application.id)}
                                className="h-8 px-2"
                              >
                                {isRevealed ? (
                                  <>
                                    <EyeOff className="h-3 w-3 mr-1" />
                                    Hide
                                  </>
                                ) : (
                                  <>
                                    <Eye className="h-3 w-3 mr-1" />
                                    Reveal
                                  </>
                                )}
                              </Button>
                            )}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-40">
                                <DropdownMenuItem onClick={() => openJobDetails(application)}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit Status
                                </DropdownMenuItem>
                                {isRevealed && (
                                  <DropdownMenuItem>
                                    <ExternalLink className="h-4 w-4 mr-2" />
                                    Open Job
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem className="text-red-600">
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                        <TableCell>
                          {application.industry}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
          
          <div className="flex flex-col sm:flex-row items-center justify-between px-4 sm:px-6 py-4 border-t gap-4">
            <div className="text-sm text-gray-500 order-2 sm:order-1">
              Rows per page: 25
            </div>
            <Pagination className="order-1 sm:order-2">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    href="#" 
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
                {[...Array(totalPages)].map((_, i) => (
                  <PaginationItem key={i + 1}>
                    <PaginationLink 
                      href="#" 
                      isActive={currentPage === i + 1}
                      onClick={() => setCurrentPage(i + 1)}
                    >
                      {i + 1}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext 
                    href="#" 
                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </CardContent>
      </Card>

      {/* Job Details Dialog */}
      <JobDetailsDialog
        isOpen={isDetailsDialogOpen}
        onClose={() => setIsDetailsDialogOpen(false)}
        application={selectedJob}
        isRevealed={selectedJob ? (!selectedJob.has_blurred_data || revealedJobs.has(selectedJob.id)) : false}
      />
    </>
  );
};

export default ApplicationsTable;