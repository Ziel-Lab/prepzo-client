import { createClient } from "@/utils/supabase/client";

export interface FilterData {
  search?: string;
  status?: string;
  location?: string;
  seniority?: string;
  [key: string]: string | number | boolean | undefined;
}

export interface SavedFilter {
  id: string;
  user_id: string;
  filters: FilterData;
  created_at: string;
}

export async function saveJobSearchFilter(userId: string, filters: FilterData) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("job_search_filter")
    .insert([{ user_id: userId, filters }])
    .select();
  return { data, error };
}

export async function getSavedFilters(userId: string): Promise<{ data: SavedFilter[] | null; error: unknown }> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("job_search_filter")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  return { data, error };
}

export async function deleteSavedFilter(filterId: string) {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("job_search_filter")
    .delete()
    .eq("id", filterId);
  return { data, error };
}