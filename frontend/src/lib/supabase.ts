import { createClient } from '@supabase/supabase-js';
import { getRepoData, extractRepoInfo } from './github';

// Initialize the Supabase client
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
);

// Type definition for repository data based on the actual schema
export type FeaturedRepo = {
  id: string; // UUID in the database
  name: string;
  username: string;
  description: string;
  stars?: number;
  created_at?: string;
  repo_url?: string;
  business_summary?: string;
  technical_documentation?: string;
  language?: string;
  forks?: number;
};

interface SupabaseRepoData {
  id: string;
  repo_url?: string;
  name?: string;
  username?: string;
  owner?: string;
  description?: string;
  stars?: number;
  created_at?: string;
  business_summary?: string;
  technical_documentation?: string;
}

// Function to fetch featured repositories
export async function getFeaturedRepos(): Promise<FeaturedRepo[]> {
  try {
    const { data, error } = await supabase
      .from('repo_summaries')
      .select('*');
    
    if (error) {
      console.error('Error fetching featured repositories:', error);
      return [];
    }
    
    // Transform the data and fetch additional details from GitHub API
    const transformedData: FeaturedRepo[] = await Promise.all(
      (data || []).map(async (item: SupabaseRepoData) => {
        // Extract username and name from repo_url if available
        let username = '';
        let name = '';
        let githubData = null;
        
        if (item.repo_url) {
          const repoInfo = extractRepoInfo(item.repo_url);
          
          if (repoInfo) {
            username = repoInfo.owner;
            name = repoInfo.repo;
            
            // Fetch additional repository data from GitHub if description or stars are missing
            if (!item.description || !item.stars) {
              githubData = await getRepoData(repoInfo.owner, repoInfo.repo);
            }
          }
        }
        
        return {
          id: item.id,
          repo_url: item.repo_url ?? '',
          // Extract repo information from URL or use defaults
          name: (name || item.name) ?? '',
          username: (username || item.username || item.owner) ?? '',
          // Use GitHub description if available, fallback to the database or business summary
          description: item.description ?? (githubData?.description ?? '') ?? (item.business_summary?.substring(0, 150) ?? ''),
          // Use GitHub stars if available, fallback to the database
          stars: item.stars ?? githubData?.stars,
          created_at: item.created_at ?? githubData?.created_at,
          // Additional GitHub data if available
          language: githubData?.language ?? undefined,
          forks: githubData?.forks
        };
      })
    );
    
    return transformedData;
  } catch (error) {
    console.error('Exception fetching featured repositories:', error);
    return [];
  }
}

// Function to fetch a single repository by username and repo name
export async function getRepoSummary(username: string, repo: string): Promise<FeaturedRepo | null> {
  try {
    // First try to find by username and repo name directly from the repo_url
    const { data, error } = await supabase
      .from('repo_summaries')
      .select('*')
      .or(`repo_url.ilike.%${username}/${repo}%,repo_url.ilike.%${username}/${repo}.git%`);
    
    if (error) {
      console.error('Error fetching repository:', error);
      return null;
    }
    
    if (data && data.length > 0) {
      const item = data[0] as SupabaseRepoData;
      
      // Extract username and name from repo_url if needed
      let extractedUsername = username;
      let extractedRepo = repo;
      let githubData = null;
      
      if (item.repo_url) {
        const repoInfo = extractRepoInfo(item.repo_url);
        
        if (repoInfo) {
          extractedUsername = repoInfo.owner;
          extractedRepo = repoInfo.repo;
          
          // Fetch additional repository data from GitHub if needed
          if (!item.description || !item.stars) {
            githubData = await getRepoData(repoInfo.owner, repoInfo.repo);
          }
        }
      }
      
      return {
        id: item.id,
        repo_url: item.repo_url ?? '',
        business_summary: item.business_summary ?? '',
        technical_documentation: item.technical_documentation ?? '',
        name: (extractedRepo || item.name) ?? '',
        username: (extractedUsername || item.username || item.owner) ?? '',
        description: item.description ?? (githubData?.description ?? '') ?? (item.business_summary?.substring(0, 150) ?? ''),
        stars: item.stars ?? githubData?.stars,
        created_at: item.created_at ?? githubData?.created_at,
        language: githubData?.language ?? undefined,
        forks: githubData?.forks
      };
    }
    
    return null;
  } catch (error) {
    console.error('Exception fetching repository:', error);
    return null;
  }
} 