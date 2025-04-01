import React from "react";
import Link from "next/link";
import { FaGithub, FaDiscord } from "react-icons/fa";

export function Footer() {
  return (
    <footer className="mt-auto border-t-[3px] border-black py-4 lg:px-8">
      <div className="container mx-auto flex h-8 max-w-4xl items-center justify-between">
        <Link 
          href="https://github.com/antarixxx/gitsummarize/issues/new?labels=enhancement&template=feature_request.md"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-sm font-medium text-black hover:text-green-600"
        >
          <FaGithub className="h-4 w-4" />
          <span>Suggest a Feature</span>
        </Link>
        
        <span className="text-sm font-medium text-black">
          Made by{" "}
          <Link
            href="https://discord.gg/FNVhqrgEej"
            target="_blank"
            rel="noopener noreferrer"
            className="text-green-600 hover:underline"
          >
            @schrodinger
          </Link>
          {" & "}
          <Link
            href="https://x.com/theantarix"
            target="_blank"
            rel="noopener noreferrer"
            className="text-green-600 hover:underline"
          >
            @antarixx
          </Link>
        </span>
        
        <Link
          href="https://discord.gg/FNVhqrgEej"  
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-sm font-medium text-black hover:text-green-600"
        >
          <FaDiscord className="h-4 w-4" />
          <span>Discord</span>
        </Link>
      </div>
    </footer>
  );
}
