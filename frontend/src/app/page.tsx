'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MainCard from "~/components/main-card";
import Hero from "~/components/hero";
import Link from "next/link";
import { getFeaturedRepos, type FeaturedRepo, getRepoSummary } from "~/lib/supabase";
import { FaCodeFork } from "react-icons/fa6";

// Function to get color for programming languages
function getLanguageColor(language: string): string {
  const colors: Record<string, string> = {
    JavaScript: "bg-yellow-400",
    TypeScript: "bg-blue-500",
    Python: "bg-blue-600",
    Java: "bg-orange-600",
    "C++": "bg-pink-600",
    C: "bg-blue-900",
    "C#": "bg-green-700",
    PHP: "bg-indigo-600",
    Ruby: "bg-red-600",
    Go: "bg-blue-400",
    Rust: "bg-orange-700",
    Swift: "bg-orange-500",
    Kotlin: "bg-purple-600",
    Dart: "bg-blue-500",
    HTML: "bg-red-500",
    CSS: "bg-blue-600",
    Shell: "bg-green-600"
  };

  return colors[language] || "bg-gray-500";
}

// Fallback repositories if Supabase fetch fails
const fallbackRepos: FeaturedRepo[] = [
  {
    id: "1",
    name: "react",
    username: "facebook",
    description: "A JavaScript library for building user interfaces",
    stars: 209000,
    repo_url: "https://github.com/facebook/react"
  },
  {
    id: "2",
    name: "vue",
    username: "vuejs",
    description: "Progressive JavaScript framework",
    stars: 201000,
    repo_url: "https://github.com/vuejs/vue"
  },
  {
    id: "3",
    name: "angular",
    username: "angular",
    description: "Platform for building mobile and desktop web applications",
    stars: 89000,
    repo_url: "https://github.com/angular/angular"
  },
  {
    id: "4",
    name: "svelte",
    username: "sveltejs",
    description: "Cybernetically enhanced web apps",
    stars: 70000,
    repo_url: "https://github.com/sveltejs/svelte"
  },
  {
    id: "5",
    name: "nextjs",
    username: "vercel",
    description: "The React Framework for the Web",
    stars: 108000,
    repo_url: "https://github.com/vercel/next.js"
  },
  {
    id: "6",
    name: "typescript",
    username: "microsoft",
    description: "TypeScript is a superset of JavaScript",
    stars: 91000,
    repo_url: "https://github.com/microsoft/TypeScript"
  },
];

export default function HomePage() {
  const [featuredRepos, setFeaturedRepos] = useState<FeaturedRepo[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [isNavigating, setIsNavigating] = useState(false);
  const [loadingText, setLoadingText] = useState('Fetching Codebase');
  const [showTagline, setShowTagline] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Fetch featured repositories
  useEffect(() => {
    async function fetchData() {
      try {
        const repos = await getFeaturedRepos();
        // If no repos returned, use fallback
        setFeaturedRepos(repos.length > 0 ? repos : fallbackRepos);
      } catch (error) {
        console.error("Error fetching featured repositories:", error);
        setFeaturedRepos(fallbackRepos);
      } finally {
        setIsDataLoading(false);
      }
    }
    void fetchData();
  }, []);

  // Loading text rotation effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    let taglineTimeout: NodeJS.Timeout;

    if (isNavigating) {
      const texts: string[] = [
        'Understanding Codebase',
        'Extracting Business Logic',
        'Generating Documentation'
      ];
      let currentIndex = 0;

      // Reset tagline visibility when navigation starts
      setShowTagline(false);

      // Show tagline after 15 seconds
      taglineTimeout = setTimeout(() => {
        setShowTagline(true);
      }, 15000);

      // Initial loading text is already set to 'Fetching codebase'
      // After a delay, start cycling through other messages
      const initialDelay = setTimeout(() => {
        interval = setInterval(() => {
          setLoadingText(texts[currentIndex]!);
          currentIndex = (currentIndex + 1) % texts.length;
        }, 1250); // Change text every 1.25 seconds
      }, 1500); // Start rotating after 1.5 seconds

      return () => {
        clearTimeout(initialDelay);
        clearTimeout(taglineTimeout);
        if (interval) clearInterval(interval);
      };
    }

    return () => { };
  }, [isNavigating]);

  // Function to check if repo exists in Supabase
  const checkRepoExists = async (username: string, repo: string): Promise<boolean> => {
    try {
      const repoData = await getRepoSummary(username, repo);
      return !!repoData; // Return true if repoData exists, false otherwise
    } catch (error) {
      console.error("Error checking repo existence:", error);
      return false;
    }
  };

  // Function to call our server-side API to generate documentation
  const generateDocumentation = async (repoUrl: string): Promise<boolean> => {
    try {
      // Check if Gemini key exists in local storage
      let geminiKey = null;
      if (typeof window !== 'undefined') {
        geminiKey = localStorage.getItem('gemini_key');
      }

      // Prepare request body
      const requestBody: { repo_url: string; gemini_key?: string } = {
        repo_url: repoUrl
      };

      // Add Gemini key to the request if available
      if (geminiKey) {
        requestBody.gemini_key = geminiKey;
        console.log('Using custom Gemini key from local storage');
      }

      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody)
      });

      if (response.ok) {
        return true;
      } else {
        const errorData: { error?: string; message?: string } = await response.json().catch(() => ({ message: 'Unknown error' }));
        console.error('Error generating documentation:', errorData);

        // Use the specific error message if available
        if (errorData.error) {
          throw new Error(errorData.error);
        }

        return false;
      }
    } catch (error) {
      console.error('Exception generating documentation:', error);
      // Re-throw the error so we can handle it with a custom message in the UI
      throw error;
    }
  };

  // Handle navigation with loading state
  const handleNavigation = async (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    setIsNavigating(true);
    setLoadingText('Fetching Codebase'); // Reset loading text
    setShowTagline(false); // Reset the tagline visibility
    setError(null);

    try {
      // Extract username and repo from href
      const match = /\/([^\/]+)\/([^\/]+)/.exec(href);

      if (!match?.[1] || !match?.[2]) {
        throw new Error('Invalid repository URL');
      }

      const username = match[1];
      const repo = match[2];

      // Check if repo exists in Supabase
      const exists = await checkRepoExists(username, repo);

      if (exists) {
        // If repo exists, redirect to it
        router.push(href);
      } else {
        // If repo doesn't exist, call the backend API
        const repoUrl = `https://github.com/${username}/${repo}`;

        // Set up timeout for the entire process
        const timeoutPromise = new Promise<boolean>((_, reject) => {
          setTimeout(() => reject(new Error('Request timed out after 4 minutes')), 240000); // 4 minutes timeout
        });

        // Race between API call and timeout
        try {
          const success = await Promise.race([
            generateDocumentation(repoUrl),
            timeoutPromise
          ]);

          if (success) {
            // If successful, redirect to the page
            router.push(href);
          } else {
            throw new Error('Failed to generate documentation');
          }
        } catch (err: unknown) {
          // Show a user-friendly error message
          const errorMessage = err instanceof Error ? err.message : 'Issue generating documentation. Please try again later.';
          setError(errorMessage);
          setIsNavigating(false);
        }
      }
    } catch (err) {
      console.error('Error navigating to repository:', err);
      setError('Error processing repository URL. Please check the format and try again.');
      setIsNavigating(false);
    }
  };

  return (
    <main className="flex-grow px-8 pb-8 md:p-8">
      {/* Loading Modal */}
      {isNavigating && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-zinc-900 rounded-xl p-8 flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500 mb-4"></div>
            <p className="text-white text-lg">{loadingText}</p>
            {showTagline && (
              <div className="flex flex-col items-center">
                <p className="text-zinc-400 text-sm mt-4 max-w-sm text-center">
                  This may take a minute or so, quite an interesting codebase!
                </p>
                <p className="text-zinc-400 text-sm mt-4 max-w-sm text-center">
                  Feel free to come back or explore other repos in a new tab.
                </p>
                <button
                  onClick={() => window.open('https://gitsummarize.com', '_blank')}
                  className="mt-4 px-4 py-2 bg-zinc-700 text-white rounded-md hover:bg-zinc-600 transition-colors text-sm"
                >
                  Open in New Tab
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Error Modal */}
      {error && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-zinc-900 rounded-xl p-8 flex flex-col items-center max-w-md">
            <div className="text-red-500 text-5xl mb-4">⚠️</div>
            <p className="text-white text-lg text-center mb-6">{error}</p>
            <button
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              onClick={() => setError(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}

      <div className="mx-auto mb-4 max-w-4xl lg:my-8">
        <Hero />
        <div className="mt-12"></div>
        <p className="mx-auto mt-8 max-w-2xl text-center text-lg">
          Turn any GitHub repository into a comprehensive AI-powered documentation hub.
        </p>
        <p className="mx-auto mt-10 max-w-2xl text-center text-lg">
          <strong>PRO TIP:</strong> Replace &apos;hub&apos; with &apos;summarize&apos; in any
          GitHub URL
        </p>
      </div>
      <div className="mb-16 flex justify-center lg:mb-0">
        {/* Pass handleNavigation to MainCard if it needs to trigger loading */}
        <MainCard handleNavigation={handleNavigation} />
      </div>

      {/* Explore Section */}
      <div className="mx-auto max-w-6xl pt-24 pb-10">
        <h2 className="mb-8 text-3xl font-bold text-center">Explore Popular Repositories</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
          {isDataLoading ? (
            // Loading skeletons for data fetching - use fallbackRepos.length to match actual data
            [...new Array(fallbackRepos.length)].map((_, index) => (
              <div
                key={`skeleton-${index}`}
                className="flex flex-col h-48 p-6 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#111111] animate-pulse"
              >
                <div className="flex-grow flex items-center justify-center">
                  <div className="h-8 bg-zinc-200 dark:bg-zinc-800 rounded w-3/4"></div>
                </div>
                <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                  <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-full mb-2"></div>
                  <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded w-1/3"></div>
                </div>
              </div>
            ))
          ) : (
            featuredRepos.map((repo) => {
              const href = `/${repo.username}/${repo.name}`;
              return (
                <Link
                  key={`${repo.username}/${repo.name}`}
                  href={href}
                  onClick={(e) => handleNavigation(e, href)}
                  className="flex flex-col h-48 p-6 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#111111] shadow-sm hover:shadow-md hover:border-green-500/50 dark:hover:border-green-500/50 transition-all duration-200 group"
                >
                  <div className="flex-grow flex flex-col items-center justify-center">
                    <h3 className="text-xl font-bold text-center group-hover:text-green-500 transition-colors duration-200">
                      {repo.username}/{repo.name}
                    </h3>
                    {repo.description && (
                      <p className="mt-2 text-sm text-center text-zinc-600 dark:text-zinc-400 line-clamp-2">
                        {repo.description}
                      </p>
                    )}
                  </div>
                  <div className="mt-4 pt-4 border-t border-zinc-200 dark:border-zinc-800">
                    <div className="flex items-center justify-between">
                      {repo.language && (
                        <div className="flex items-center text-xs">
                          <span className={`w-3 h-3 rounded-full mr-1 ${getLanguageColor(repo.language)}`}></span>
                          <span className="text-zinc-600 dark:text-zinc-400">{repo.language}</span>
                        </div>
                      )}
                      <div className="flex items-center space-x-3">
                        {repo.stars !== undefined && repo.stars > 0 && (
                          <p className="text-xs flex items-center text-amber-600 dark:text-amber-400">
                            <svg className="w-4 h-4 mr-1" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                            </svg>
                            {repo.stars.toLocaleString()}
                          </p>
                        )}
                        {repo.forks !== undefined && repo.forks > 0 && (
                          <p className="text-xs flex items-center text-zinc-600 dark:text-zinc-400">
                            <FaCodeFork className="w-3 h-3 mr-1" />
                            {repo.forks?.toLocaleString() ?? '0'}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </div>
    </main>
  );
}
