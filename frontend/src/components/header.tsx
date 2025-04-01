"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { FaGithub } from "react-icons/fa";
import { getStarCount } from "~/app/_actions/github";
import { ApiKeyDialog } from "./api-key-dialog";

export function Header() {
  const [isApiKeyDialogOpen, setIsApiKeyDialogOpen] = useState(false);
  const [starCount, setStarCount] = useState<number | null>(null);

  useEffect(() => {
    void getStarCount().then(setStarCount);
  }, []);

  const formatStarCount = (count: number | null) => {
    if (!count) return "";
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toString();
  };

  const handleApiKeySubmit = (apiKey: string) => {
    localStorage.setItem("gemini_key", apiKey);
    setIsApiKeyDialogOpen(false);
  };

  return (
    <header className="border-b-[3px] border-black">
      <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4 sm:px-8">
        <Link href="/" className="flex items-center">
          <span className="text-lg font-semibold sm:text-xl">
            <span className="text-black transition-colors duration-200 hover:text-gray-600">
              Git
            </span>
            <span className="text-green-600 transition-colors duration-200 hover:text-green-500">
              Summarize
            </span>
          </span>
        </Link>
        <nav className="flex items-center gap-3 sm:gap-6">
          <span
            onClick={() => setIsApiKeyDialogOpen(true)}
            className="cursor-pointer text-sm font-medium text-black transition-transform hover:translate-y-[-2px] hover:text-green-600"
          >
            <span className="flex items-center sm:hidden">
              <span>API Key</span>
            </span>
            <span className="hidden items-center gap-1 sm:flex">
              <span>API Key</span>
            </span>
          </span>
          <Link
            href="https://discord.gg/FNVhqrgEej"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-sm font-medium text-black transition-transform hover:translate-y-[-2px] hover:text-green-600 sm:gap-2"
          >
            <span className="hidden sm:inline">Discord</span>
          </Link>
          <Link
            href="https://github.com/antarixxx/gitsummarize"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-sm font-medium text-black transition-transform hover:translate-y-[-2px] hover:text-green-600 sm:gap-2"
          >
            <FaGithub className="h-5 w-5" />
            <span className="hidden sm:inline">GitHub</span>
          </Link>
          {starCount && starCount > 100 ? (
            <span className="flex items-center gap-1 text-sm font-medium text-black">
              <span className="text-amber-400">★</span>
              {formatStarCount(starCount)}
            </span>
          ) : null}
        </nav>

        {/* <PrivateReposDialog
          isOpen={isPrivateReposDialogOpen}
          onClose={() => setIsPrivateReposDialogOpen(false)}
          onSubmit={handlePrivateReposSubmit}
        /> */}
        <ApiKeyDialog
          isOpen={isApiKeyDialogOpen}
          onClose={() => setIsApiKeyDialogOpen(false)}
          onSubmit={handleApiKeySubmit}
        />
      </div>
    </header>
  );
}
