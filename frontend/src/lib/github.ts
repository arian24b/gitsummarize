import { Octokit } from "@octokit/rest";

// Create Octokit instance with GitHub token if available
const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN ?? undefined,
});

/**
 * Type definition for GitHub repository data
 */
export type GitHubRepoData = {
  name: string;
  full_name: string;
  description: string | null;
  stars: number;
  forks: number;
  language: string | null;
  created_at: string;
  updated_at: string;
  homepage: string | null;
  default_branch: string;
};

/**
 * Fetches repository data from GitHub API
 * @param owner Repository owner (username or organization)
 * @param repo Repository name
 * @returns Repository data or null if not found
 */
export async function getRepoData(owner: string, repo: string): Promise<GitHubRepoData | null> {
  try {
    if (!owner || !repo) {
      console.error('Invalid owner or repo name');
      return null;
    }

    const response = await octokit.repos.get({
      owner,
      repo,
    });

    if (response.status !== 200) {
      console.error(`Error fetching repo data: ${String(response.status)}`);
      return null;
    }

    const data = response.data;
    
    return {
      name: data.name,
      full_name: data.full_name,
      description: data.description,
      stars: data.stargazers_count,
      forks: data.forks_count,
      language: data.language,
      created_at: data.created_at,
      updated_at: data.updated_at,
      homepage: data.homepage,
      default_branch: data.default_branch,
    };
  } catch (error) {
    console.error(`Error fetching repo data for ${owner}/${repo}:`, error);
    return null;
  }
}

/**
 * Extracts owner and repo name from a GitHub URL
 * @param url GitHub repository URL
 * @returns Object containing owner and repo, or null if invalid URL
 */
export function extractRepoInfo(url: string): { owner: string; repo: string } | null {
  try {
    if (!url || typeof url !== 'string') {
      return null;
    }
    
    // Decode URL to handle URL-encoded characters like %0A (newline)
    const decodedUrl = decodeURIComponent(url.trim());
    
    // Remove protocol and domain parts
    const urlPath = decodedUrl.replace(/https?:\/\/github\.com\//, '');
    const parts = urlPath.split('/').filter(Boolean);
    
    if (parts.length < 2 || !parts[0] || !parts[1]) {
      return null;
    }
    
    const owner = parts[0];
    const repo = parts[1].replace(/\.git$/, ''); // Remove .git suffix if present
    
    return { owner, repo };
  } catch (error) {
    console.error('Error extracting repo info:', error);
    return null;
  }
} 