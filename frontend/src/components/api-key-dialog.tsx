"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { useState, useEffect } from "react";
import Link from "next/link";

interface ApiKeyDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (apiKey: string) => void;
}

export function ApiKeyDialog({ isOpen, onClose, onSubmit }: ApiKeyDialogProps) {
  const [apiKey, setApiKey] = useState<string>("");

  useEffect(() => {
    const storedKey = localStorage.getItem("gemini_key");
    if (storedKey) {
      setApiKey(storedKey);
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(apiKey);
    setApiKey("");
  };

  const handleClear = () => {
    localStorage.removeItem("gemini_key");
    setApiKey("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="border-[3px] border-black bg-green-200 p-6 shadow-[8px_8px_0_0_#000000] sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-black">
            Enter Gemini API Key
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="text-sm">
            GitSummarize offers infinite free documentation generations! You can also
            provide an Gemini API key to generate documentation if we hit our rate limits. The
            key will be stored locally in your browser. We use the Gemini 2.5 Pro API.
            <br />
            <br />
            <span className="font-medium">Get your Gemini API key </span>
            <Link
              href="https://ai.google.dev/gemini-api/docs"
              className="font-medium text-green-600 transition-colors duration-200 hover:text-green-500"
              target="_blank"
              rel="noopener noreferrer"
            >
              here
            </Link>
            .
          </div>
          <details className="group text-sm [&>summary:focus-visible]:outline-none">
            <summary className="cursor-pointer font-medium text-green-700 hover:text-green-600">
              Data storage disclaimer
            </summary>
            <div className="animate-accordion-down mt-2 space-y-2 overflow-hidden pl-2">
              <p>
                Your API key will be stored locally in your browser and used
                only for generating documentation. You can also self-host this app by
                following the instructions in the{" "}
                <Link
                  href="https://github.com/antarixxx/gitsummarize"
                  className="text-green-600 transition-colors duration-200 hover:text-green-500"
                >
                  README
                </Link>
                .
              </p>
            </div>
          </details>
          <Input
            type="password"
            placeholder=""
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="flex-1 rounded-md border-[3px] border-black px-3 py-2 text-base font-bold shadow-[4px_4px_0_0_#000000] placeholder:text-base placeholder:font-normal placeholder:text-gray-700"
            required
          />
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={handleClear}
              className="text-sm text-green-600 hover:text-green-500"
            >
              Clear
            </button>
            <div className="flex gap-3">
              <Button
                type="button"
                onClick={onClose}
                className="border-[3px] border-black bg-gray-200 px-4 py-2 text-black shadow-[4px_4px_0_0_#000000] transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-gray-300"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!apiKey.startsWith("AI")}
                className="border-[3px] border-black bg-green-400 px-4 py-2 text-black shadow-[4px_4px_0_0_#000000] transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 hover:bg-green-300 disabled:opacity-50"
              >
                Save Key
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
