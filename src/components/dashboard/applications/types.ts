export type Job = {
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
  description?: string;
  company_object?: {
    name?: string;
    domain?: string;
    logo?: string;
    industry?: string;
    annual_revenue_usd_readable?: string;
    founded_year?: string;
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
  already_revealed?: boolean;
};

export const JOB_STATUSES = {
  revealed: "Revealed",
  applied: "Applied", 
  scheduled: "Scheduled",
  interview: "Interview",
  rejected: "Rejected",
  offered: "Offered",
  accepted: "Accepted",
  withdrawn: "Withdrawn"
} as const;

export type JobStatus = keyof typeof JOB_STATUSES;

export type Filters = {
  search?: string;
  status?: string;
  remote?: boolean;
  seniority?: string;
  location?: string;
};
