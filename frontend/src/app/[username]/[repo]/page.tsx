'use client';

import Link from 'next/link';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import mermaid from 'mermaid';
import {
  DocumentTextIcon,
  BookOpenIcon,
  PuzzlePieceIcon,
  ChevronRightIcon,
  SunIcon,
  MoonIcon
} from '@heroicons/react/24/outline';
import Image from 'next/image';
// Add Google Fonts import
import { Playwrite_HU } from 'next/font/google';
import { CodeBlock, dracula } from 'react-code-blocks';
import ReactDOM from 'react-dom';
import { getRepoSummary, type FeaturedRepo } from '~/lib/supabase';

// Initialize mermaid with dark theme
let mermaidInitialized = false;

const initializeMermaid = () => {
  if (typeof window !== 'undefined' && !mermaidInitialized) {
    mermaidInitialized = true;
    mermaid.initialize({
      startOnLoad: false,
      theme: 'dark',
      securityLevel: 'loose',
      themeVariables: {
        primaryColor: '#22c55e', // green-500 
        primaryTextColor: '#f9fafb', // gray-50
        primaryBorderColor: '#16a34a', // green-600
        lineColor: '#94a3b8', // slate-400
        secondaryColor: '#334155', // slate-700
        tertiaryColor: '#1e293b', // slate-800
        background: '#18181b', // zinc-900
        mainBkg: '#27272a', // zinc-800
        secondaryBorderColor: '#475569', // slate-600
        textColor: '#e2e8f0', // slate-200
      }
    });
    console.log('Mermaid initialized with dark theme');
  }
};

// New components for rendering code blocks and mermaid diagrams
type CodeBlockProps = {
  code: string;
  language: string;
  fileName?: string;
};

const CodeBlockRenderer = ({ code, language }: CodeBlockProps) => {
  return (
    <div className="relative my-6 rounded-lg overflow-hidden bg-[#282A36] border border-[#44475A]">
      <div className="flex items-center justify-between px-4 py-2 border-b border-[#44475A] bg-[#21222C]">
        <span className="text-[#F8F8F2] text-sm font-medium">{language}</span>
      </div>
      <div className="p-4">
        <CodeBlock
          text={code}
          language={language}
          theme={dracula}
          showLineNumbers={true}
          customStyle={{
            margin: '0',
            borderRadius: '0',
            fontSize: '14px',
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
          }}
        />
      </div>
    </div>
  );
};

const MermaidDiagramRenderer = ({ code }: { code: string }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    initializeMermaid();

    const renderDiagram = async () => {
      try {
        const diagramId = `mermaid-diagram-${Math.random().toString(36).substring(2, 9)}`;
        const { svg } = await mermaid.render(diagramId, code);

        if (containerRef.current) {
          containerRef.current.innerHTML = svg;
        }
      } catch (error) {
        if (containerRef.current) {
          containerRef.current.innerHTML = `
            <div class="p-4 border border-red-500 bg-red-900/20 rounded-md text-red-400">
              <p class="font-mono text-sm">Error rendering diagram: ${(error as Error).message || 'Unknown error'}</p>
            </div>
          `;
        }
      }
    };

    void renderDiagram();
  }, [code]);

  return (
    <div className="my-6 rounded-lg overflow-hidden border border-zinc-700 bg-zinc-900">
      <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-700 bg-zinc-800">
        <span className="text-zinc-200 text-sm font-medium">mermaid</span>
      </div>
      <div ref={containerRef} className="p-4 flex justify-center" />
    </div>
  );
};

// Types needed for the sidebar
type RegularSidebarItem = {
  name: string;
  path: string;
  param: string; // The URL parameter value for this item
  active?: boolean; // Make this optional
  highlight?: boolean;
  icon?: undefined;
};

type IconSidebarItem = {
  name: string;
  path: string;
  param: string; // The URL parameter value for this item
  active?: boolean; // Make this optional
  highlight?: boolean;
  icon: string;
};

type SidebarItem = RegularSidebarItem | IconSidebarItem;

type SidebarSection = {
  title: string;
  items: SidebarItem[];
};

// Markdown parser component that extracts and renders code blocks and mermaid diagrams
const MarkdownRenderer = ({ content, isDarkMode }: { content: string, isDarkMode: boolean }) => {
  const [markdownParts, setMarkdownParts] = useState<Array<{ type: 'text' | 'code' | 'mermaid', content: string, language?: string }>>([]);

  useEffect(() => {
    if (!content) {
      setMarkdownParts([]);
      return;
    }

    const parts: Array<{ type: 'text' | 'code' | 'mermaid', content: string, language?: string }> = [];
    let lastIndex = 0;
    // Updated regex to better handle language identifier
    const regex = /```(mermaid|[a-zA-Z0-9_\-+#]+)?\n([\s\S]*?)```/g;
    let match;

    while ((match = regex.exec(content)) !== null) {
      // Add text before this match
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          content: content.substring(lastIndex, match.index)
        });
      }

      // Add the code block or mermaid diagram
      if (match[1] === 'mermaid') {
        parts.push({
          type: 'mermaid',
          content: match[2] || '',
        });
      } else {
        // Use the language from the code block declaration if available
        const language = match[1] || 'text';
        parts.push({
          type: 'code',
          content: match[2] ? match[2].trim() : '',
          language,
        });
      }

      lastIndex = match.index + match[0].length;
    }

    // Add any remaining text
    if (lastIndex < content.length) {
      parts.push({
        type: 'text',
        content: content.substring(lastIndex)
      });
    }

    setMarkdownParts(parts);
  }, [content]);

  if (!content) {
    return <p className={`${isDarkMode ? 'text-zinc-400' : 'text-gray-500'}`}>No content available.</p>;
  }

  return (
    <div className="space-y-4">
      {markdownParts.map((part, index) => {
        if (part.type === 'text') {
          return (
            <div
              key={index}
              dangerouslySetInnerHTML={{
                __html: formatMarkdownText(part.content, isDarkMode)
              }}
            />
          );
        } else if (part.type === 'code') {
          return (
            <CodeBlockRenderer
              key={index}
              code={part.content}
              language={part.language || 'text'}
            />
          );
        } else if (part.type === 'mermaid') {
          return <MermaidDiagramRenderer key={index} code={part.content} />;
        }
        return null;
      })}
    </div>
  );
};

// Helper function to format text-only markdown without code blocks
function formatMarkdownText(markdown: string, isDarkMode: boolean): string {
  if (!markdown) return '';

  let formatted = markdown;

  // Process headings for proper IDs and styling
  formatted = formatted.replace(/^(#{1,6})\s+(.+)$/gm, (match, hashes, title) => {
    const level = hashes.length;
    const cleanTitle = String(title).trim();
    const id = cleanTitle
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    return `<h${level} id="${id}" class="text-${level === 1 ? '3xl' : level === 2 ? '2xl' : 'xl'} font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} ${level <= 2 ? 'mt-8 mb-4' : 'mt-6 mb-3'}">${title}</h${level}>`;
  });

  // Process lists
  // Unordered lists
  formatted = formatted.replace(/^\s*[-*+]\s+(.+)$/gm, (match, content) => {
    return `<div class="flex items-start mb-2 ml-4">
      <span class="text-green-500 mr-2">•</span>
      <div class="${isDarkMode ? 'text-zinc-300' : 'text-gray-700'}">${content}</div>
    </div>`;
  });

  // Ordered lists
  formatted = formatted.replace(/^\s*(\d+)\.\s+(.+)$/gm, (match, number, content) => {
    return `<div class="flex items-start mb-2 ml-4">
      <span class="text-green-500 font-bold mr-2 min-w-[1.5rem]">${number}.</span>
      <div class="${isDarkMode ? 'text-zinc-300' : 'text-gray-700'}">${content}</div>
    </div>`;
  });

  // Process inline formatting
  // Bold
  formatted = formatted.replace(/\*\*([^*]+)\*\*/g, `<strong class="font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}">$1</strong>`);

  // Italic
  formatted = formatted.replace(/\*([^*]+)\*/g, '<em class="italic">$1</em>');

  // Inline code
  formatted = formatted.replace(/`([^`]+)`/g, (match, code) => {
    // Check for React-specific terms
    if (/^(useMemoCache|useState|c\(N\)|useRenderCounter|makeReadOnly|\$\[index\]|useMemoCache\(N\))$/.test(code)) {
      return `<code class="bg-green-900/20 text-green-400 px-1 rounded text-sm font-mono">${code}</code>`;
    }
    return `<code class="${isDarkMode ? 'bg-zinc-800 text-zinc-200' : 'bg-gray-100 text-gray-800'} px-1 rounded text-sm font-mono">${code}</code>`;
  });

  // Links
  formatted = formatted.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-green-500 hover:text-green-400">$1</a>');

  // Images
  formatted = formatted.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="max-w-full my-2 rounded">');

  // Paragraphs (convert regular text lines to paragraphs)
  formatted = formatted.replace(/^(?!<[a-z])(.+)$/gm, (match, content) => {
    if (content.trim() === '' || content.includes('<h') || content.includes('<div') ||
      content.includes('<p') || content.includes('<ul') || content.includes('<ol')) {
      return match;
    }
    return `<p class="${isDarkMode ? 'text-zinc-300' : 'text-gray-700'} mb-4">${content}</p>`;
  });

  return formatted;
}

// Dynamic Content Component
const DynamicContent = ({ content, isDarkMode, contentType }: {
  content: string | null,
  isDarkMode: boolean,
  contentType?: 'business_summary' | 'technical_documentation' | 'readme'
}) => {
  if (!content) {
    return <p className={`${isDarkMode ? 'text-zinc-400' : 'text-gray-500'}`}>No content available.</p>;
  }

  // For business_summary, maintain the original rendering approach
  if (contentType === 'business_summary') {
    const containerClass = 'prose prose-invert max-w-none business-summary-container';
    return (
      <div className={containerClass}>
        <div dangerouslySetInnerHTML={{ __html: applyBasicFormatting(content, isDarkMode) }} />
      </div>
    );
  }

  // Apply the appropriate container class based on content type
  const containerClass = 'prose prose-invert max-w-none';

  return (
    <div className={containerClass}>
      <MarkdownRenderer content={content} isDarkMode={isDarkMode} />
    </div>
  );
};

// New helper function for basic business summary formatting
function applyBasicFormatting(markdown: string, isDarkMode: boolean): string {
  // Process headings for proper IDs and styling
  let formatted = markdown.replace(/^## (.*$)/gm, (match, title) => {
    const cleanTitle = String(title).trim();
    const id = cleanTitle
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    return `<h2 id="${id}" class="text-2xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'} mt-10 pb-1 border-b border-zinc-800">${title}</h2>`;
  });

  // Process code blocks - Do this early to avoid conflicts with inline formatting
  const codeBlocks: Array<{ id: string, language: string, code: string }> = [];

  formatted = formatted.replace(/```([\s\S]*?)```/g, (match) => {
    // Simple approach to extract language and code
    const firstLineEnd = match.indexOf('\n');
    const firstLine = match.substring(0, firstLineEnd).trim();
    const language = firstLine.replace('```', '').trim() || 'text';

    // Get code content (everything after first line until closing ```)
    const code = match.substring(firstLineEnd + 1, match.lastIndexOf('```')).trim();

    // Generate a unique ID for this code block
    const id = `code-${Math.random().toString(36).substring(2, 9)}`;

    // Store code block info for later processing
    codeBlocks.push({ id, language, code });

    // Return a placeholder that won't be affected by other regex
    return `<div id="CODE_BLOCK_${id}"></div>`;
  });

  // Process basic inline formatting - bold, italic, links
  formatted = formatted
    .replace(/\*\*([^*]+)\*\*/g, `<strong class="font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}">$1</strong>`)
    .replace(/\*([^*]+)\*/g, '<em class="italic">$1</em>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-green-500 hover:text-green-400">$1</a>');

  // Special handling for inline code with React-specific syntax highlighting
  formatted = formatted.replace(/`([^`]+)`/g, (match, codeContent) => {
    // Check for common React and compiler-related terms
    if (codeContent && /^(useMemoCache|useState|c\(N\)|useRenderCounter|makeReadOnly|\$\[index\]|useMemoCache\(N\))$/.test(codeContent)) {
      return `<code class="bg-green-900/20 text-green-400 px-1 rounded text-sm font-mono">${codeContent}</code>`;
    }
    return `<code class="${isDarkMode ? 'bg-zinc-800 text-zinc-200' : 'bg-gray-100 text-gray-800'} px-1 rounded text-sm font-mono">${codeContent || ""}</code>`;
  });

  // Process lists and paragraphs line by line
  const lines = formatted.split('\n');
  const result: string[] = [];
  let inList = false;
  let inSteps = false;
  let listIndentLevel = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] || '';

    // Skip already processed HTML
    if (line.startsWith('<') && !line.startsWith('<code')) {
      result.push(line);
      continue;
    }

    // Handle "Steps:" or other labeled sections that might contain lists
    if (line.trim().match(/^(Steps|Trigger|Outcome):/)) {
      inSteps = true;
      result.push(`<div class="font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'} mt-4 mb-2">${line}</div>`);
      continue;
    }

    // Numbered list item - capture the full expression to handle multi-digit numbers
    const numberedMatch = line.match(/^(\s*)(\d+)\.[ \t]+(.+)$/);
    if (numberedMatch && numberedMatch[3]) {
      const indent = numberedMatch[1] || '';
      const number = numberedMatch[2] || '';
      const content = numberedMatch[3];
      const indentLevel = Math.floor(indent.length / 2);
      const marginLeft = indentLevel * 1.5;

      // If this is a top-level numbered item (no indent), render it as h2 with the number in green
      if (indentLevel === 0) {
        // Create ID for anchor linking
        const id = content
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');

        // Handle inline code in the heading
        let processedContent = content.replace(/`([^`]+)`/g, (match, code) => {
          if (code && /^(useMemoCache|useState|c\(N\)|useRenderCounter|makeReadOnly|\$\[index\])$/.test(code)) {
            return `<code class="bg-green-900/20 text-green-400 px-1 rounded text-sm font-mono">${code}</code>`;
          }
          return `<code class="${isDarkMode ? 'bg-zinc-800 text-zinc-200' : 'bg-gray-100 text-gray-800'} px-1 rounded text-sm font-mono">${code || ''}</code>`;
        });

        // Special case for eslint-plugin-react-compiler
        if (content.includes('eslint-plugin-react-compiler')) {
          processedContent = processedContent.replace(
            /eslint-plugin-react-compiler/g,
            `<code class="bg-green-900/20 text-green-400 px-1 rounded text-sm font-mono">eslint-plugin-react-compiler</code>`
          );
        }

        result.push(`<h2 id="${id}" class="pt-6 text-2xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}">
          <span class="text-green-500 mr-2">${number}.</span>
          <span>${processedContent}</span>
        </h2>`);
        inList = false;
        continue;
      }

      // Process inline code within list items (for non-top-level items)
      let processedContent = content.replace(/`([^`]+)`/g, (match, code) => {
        // Check for common React and compiler-related terms
        if (code && /^(useMemoCache|useState|c\(N\)|useRenderCounter|makeReadOnly|\$\[index\]|eslint-plugin-react-compiler)$/.test(code)) {
          return `<code class="bg-green-900/20 text-green-400 px-1 rounded text-sm font-mono">${code}</code>`;
        }
        return `<code class="${isDarkMode ? 'bg-zinc-800 text-zinc-200' : 'bg-gray-100 text-gray-800'} px-1 rounded text-sm font-mono">${code || ''}</code>`;
      });

      // Special case for eslint-plugin-react-compiler
      if (content.includes('eslint-plugin-react-compiler')) {
        processedContent = processedContent.replace(
          /eslint-plugin-react-compiler/g,
          `<code class="bg-green-900/20 text-green-400 px-1 rounded text-sm font-mono">eslint-plugin-react-compiler</code>`
        );
      }

      result.push(`<div class="flex items-start mb-3" style="margin-left: ${marginLeft}rem">
        <span class="text-green-500 font-bold mr-2 mt-0.5 min-w-[1.5rem] text-right">${number}.</span>
        <div class="${isDarkMode ? 'text-zinc-300' : 'text-gray-700'} flex-1">${processedContent}</div>
      </div>`);
      inList = true;
      listIndentLevel = indentLevel;
      continue;
    }

    // Check if this line is likely a continuation of a previous list item
    // (indented and not starting a new list item)
    if (inList && !line.match(/^(\s*)(\d+)\./) && !line.match(/^(\s*)[-*+]/) && line.trim() !== '') {
      const indentMatch = line.match(/^(\s+)/);
      const lineIndent = indentMatch && indentMatch[1] ? indentMatch[1].length : 0;

      // If line has some indentation and doesn't start another pattern, treat as continuation
      if ((lineIndent > 0 || result.length > 0) && result.length > 0) {
        // Get the last element we added
        const lastElement = result[result.length - 1];
        // Only process if it's a div (likely a list item)
        if (lastElement && lastElement.includes('<div class="flex items-start')) {
          // Extract the content div from the last element
          const contentMatch = lastElement.match(/<div class="[^"]+flex-1">(.+?)<\/div>\s*<\/div>$/);
          if (contentMatch && contentMatch[1]) {
            const existingContent = contentMatch[1];
            // Replace with updated content that includes this line
            const processedLine = line.trim().replace(/`([^`]+)`/g, (match, code) => {
              // Style inline code in continuation lines
              if (code && /^(useMemoCache|useState|c\(N\)|useRenderCounter|makeReadOnly|\$\[index\])$/.test(code)) {
                return `<code class="bg-green-900/20 text-green-400 px-1 rounded text-sm font-mono">${code}</code>`;
              }
              return `<code class="${isDarkMode ? 'bg-zinc-800 text-zinc-200' : 'bg-gray-100 text-gray-800'} px-1 rounded text-sm font-mono">${code || ''}</code>`;
            });

            // Replace the content portion with new content that includes this line
            const updatedElement = lastElement.replace(
              /<div class="[^"]+flex-1">(.+?)<\/div>\s*<\/div>$/,
              `<div class="${isDarkMode ? 'text-zinc-300' : 'text-gray-700'} flex-1">${existingContent} ${processedLine}</div></div>`
            );

            // Update the last element with the new content
            result[result.length - 1] = updatedElement;
            continue;
          }
        }
      }
    }

    // Bullet list item (with indentation support)
    const bulletMatch = line.match(/^(\s*)[-*+][ \t]+(.+)$/);
    if (bulletMatch && bulletMatch[2]) {
      const indent = bulletMatch[1] || '';
      const content = bulletMatch[2];
      const indentLevel = Math.floor(indent.length / 2);
      const marginLeft = indentLevel * 1.5;
      const bulletSymbol = indentLevel === 0 ? '•' : '◦';
      const bulletClass = indentLevel === 0 ? 'text-green-500' : 'text-green-400';

      // Process inline code within bullet points
      const processedContent = content.replace(/`([^`]+)`/g, (match, code) => {
        if (code && /^(useMemoCache|useState|c\(N\)|useRenderCounter|makeReadOnly|\$\[index\])$/.test(code)) {
          return `<code class="bg-green-900/20 text-green-400 px-1 rounded text-sm font-mono">${code}</code>`;
        }
        return `<code class="${isDarkMode ? 'bg-zinc-800 text-zinc-200' : 'bg-gray-100 text-gray-800'} px-1 rounded text-sm font-mono">${code || ''}</code>`;
      });

      result.push(`<div class="flex items-start mb-2" style="margin-left: ${marginLeft}rem">
        <span class="${bulletClass} mr-2 mt-0.5 min-w-[1rem] text-center">${bulletSymbol}</span>
        <div class="${isDarkMode ? 'text-zinc-300' : 'text-gray-700'} flex-1">${processedContent}</div>
      </div>`);
      inList = true;
      continue;
    }

    // Empty line
    if (line.trim() === '') {
      result.push('');
      inList = false;
      inSteps = false;
      continue;
    }

    // Regular paragraph (not a list item or heading)
    if (!inList && !line.startsWith('#')) {
      // For line after "Steps:" that isn't a list item, format it specially
      if (inSteps) {
        // Process any inline code in the line
        const processedLine = line.replace(/`([^`]+)`/g, (match, code) => {
          if (code && /^(useMemoCache|useState|c\(N\)|useRenderCounter|makeReadOnly|\$\[index\]|eslint-plugin-react-compiler)$/.test(code)) {
            return `<code class="bg-green-900/20 text-green-400 px-1 rounded text-sm font-mono">${code}</code>`;
          }
          return `<code class="${isDarkMode ? 'bg-zinc-800 text-zinc-200' : 'bg-gray-100 text-gray-800'} px-1 rounded text-sm font-mono">${code || ''}</code>`;
        });

        result.push(`<div class="${isDarkMode ? 'text-zinc-300' : 'text-gray-700'} mb-2">${processedLine}</div>`);
      } else {
        result.push(`<p class="${isDarkMode ? 'text-zinc-300' : 'text-gray-700'} mb-4">${line}</p>`);
      }
    } else {
      result.push(line);
    }
  }

  // Combine the processed lines
  let html = result.join('\n');

  // Finally, replace code block placeholders with actual code blocks
  for (const { id, language, code } of codeBlocks) {
    const codeBlockId = `code-block-${id}`;
    const placeholder = `<div id="CODE_BLOCK_${id}"></div>`;

    // Create the HTML for the CodeBlockRenderer component
    const codeBlockHtml = `
      <div class="relative my-6 rounded-lg overflow-hidden bg-[#282A36] border border-[#44475A]">
        <div class="flex items-center justify-between px-4 py-2 border-b border-[#44475A] bg-[#21222C]">
          <span class="text-[#F8F8F2] text-sm font-medium">${language}</span>
        </div>
        <div class="p-4">
          <pre class="font-mono text-[#F8F8F2] whitespace-pre-wrap">${code.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
        </div>
      </div>
    `;

    // Replace placeholder with actual code block
    html = html.replace(placeholder, codeBlockHtml);
  }

  return html;
}

// Add new type for component documentation
type ComponentDoc = {
  title: string;
  content: string;
  param: string;
};

// Helper function to clean title text for URL params
function cleanTitleForParam(title: string): string {
  return title
    .replace(/!\[(.*?)\]\(.*?\)/g, '') // Remove images
    .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Extract link text
    .replace(/&[^;]+;/g, '') // Remove HTML entities
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// Add function to parse MDX content
function parseComponentDocs(mdxContent: string): ComponentDoc[] {
  const sections: ComponentDoc[] = [];

  // Match all ## heading sections
  const h2Regex = /^##\s+(.+)$/gm;
  let match;

  while ((match = h2Regex.exec(mdxContent)) !== null) {
    if (match[1]) {
      const title = match[1].trim();

      // Create URL-friendly parameter using the cleanup helper
      const param = cleanTitleForParam(title);

      // Get content section (from this ## header to the next ## or end of file)
      const startPos = match.index;
      const nextMatch = h2Regex.exec(mdxContent);
      const endPos = nextMatch ? nextMatch.index : mdxContent.length;

      // Reset regex to not miss any headers
      h2Regex.lastIndex = startPos + 1;

      const content = mdxContent.substring(startPos, nextMatch ? nextMatch.index : mdxContent.length).trim();

      sections.push({
        title,
        content,
        param
      });
    }
  }

  return sections;
}

// Add a new type for business logic docs
type BusinessLogicDoc = {
  title: string;
  content: string;
  param: string;
};

// Add function to parse business logic docs from MDX content
function parseBusinessLogicDocs(mdxContent: string): BusinessLogicDoc[] {
  const sections: BusinessLogicDoc[] = [];

  // Split content by ## headers
  const headerSplit = mdxContent.split(/^##\s+/m);

  // First part is content before any ## headers, skip it if empty
  const beforeFirstHeader = headerSplit.shift();

  // Process each header section
  for (const section of headerSplit) {
    // The section now starts with the header text
    // Find the end of the first line to extract the header
    const endOfFirstLine = section.indexOf('\n');
    if (endOfFirstLine === -1) continue; // Skip if no newline found

    const title = section.substring(0, endOfFirstLine).trim();
    const param = cleanTitleForParam(title);

    // Reconstruct the section with the ## prefix
    const content = "## " + section.trim();

    sections.push({
      title,
      content,
      param
    });
  }

  return sections;
}

// Add a new TableOfContents component
const TableOfContents = ({ content, isDarkMode, contentType }: { content: string | null, isDarkMode: boolean, contentType?: 'business_summary' | 'technical_documentation' | 'readme' }) => {
  // Extract headings from content
  const extractHeadings = (): { id: string, text: string, level: number }[] => {
    if (!content) return [];

    const headings: { id: string, text: string, level: number }[] = [];

    // For business_summary, extract both ## headers and top-level numbered items
    if (contentType === 'business_summary') {
      // First, extract all ## headings
      const h2HeadersRegex = /^##\s+(.+)$/gm;
      let match;

      while ((match = h2HeadersRegex.exec(content)) !== null) {
        if (match[1]) {
          // Remove markdown formatting such as ** characters
          const text = match[1].trim()
            .replace(/\*\*([^*]+)\*\*/g, '$1'); // Remove ** from text

          // Create a consistent ID
          const id = text
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');

          headings.push({ id, text, level: 2 }); // These are already H2 level headings
        }
      }

      // Then extract the numbered items that we've converted to h2 elements (1., 2., etc.)
      const numberedItemsRegex = /^(\d+)\.\s+(.+)$/gm;
      let numberedMatch;

      while ((numberedMatch = numberedItemsRegex.exec(content)) !== null) {
        if (numberedMatch[2]) {
          // Remove markdown formatting such as ** characters
          const text = numberedMatch[2].trim()
            .replace(/\*\*([^*]+)\*\*/g, '$1'); // Remove ** from text

          // Create a consistent ID
          const id = text
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');

          // Check if this heading is already in the list (from the h2 extraction)
          const exists = headings.some(h => h.id === id);
          if (!exists) {
            headings.push({ id, text, level: 2 });
          }
        }
      }
    } else {
      // For other content types, also extract numbered list items (if present)
      const businessHeadingsRegex = /^(\d+)\.\s+(?:\*\*)?([^*\n]+)(?:\*\*)?$/gm;
      let match;

      while ((match = businessHeadingsRegex.exec(content)) !== null) {
        if (match[2]) {
          const text = match[2].trim();
          // Create a consistent ID
          const id = text
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');

          headings.push({ id, text, level: 2 }); // Treat them as H2 level headings
        }
      }
    }

    // Also match standard markdown headers
    const regex = /^(#{1,4})\s+(.+)$/gm;
    let match;

    while ((match = regex.exec(content)) !== null) {
      if (match[1] && match[2]) {
        const level = match[1].length; // Number of # symbols
        let text = match[2];

        // Skip h2 headings in business_summary that we've already processed
        if (contentType === 'business_summary' && level === 2) {
          continue;
        }

        // Strip out image markdown from heading text to avoid badges in sidebar
        text = text.replace(/!\[(.*?)\]\(.*?\)/g, '');
        // Also strip out any remaining markdown links
        text = text.replace(/\[(.*?)\]\(.*?\)/g, '$1');
        // Remove any HTML entities like &middot;
        text = text.replace(/&[^;]+;/g, '');
        // Remove markdown formatting such as ** characters
        text = text.replace(/\*\*([^*]+)\*\*/g, '$1');
        // Trim any extra whitespace that might be left
        text = text.trim();

        const id = text
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');

        // Only include h1, h2, h3 headings
        if (level <= 3) {
          headings.push({ id, text, level });
        }
      }
    }

    return headings;
  };

  const headings = extractHeadings();

  if (headings.length === 0) {
    return null;
  }

  return (
    <div className="sticky top-4 self-start">
      <div className={`w-64 p-4 rounded-lg ${isDarkMode ? 'bg-zinc-900/30 border border-zinc-800' : 'bg-white border border-gray-200'}`}>
        <div className="flex items-center mb-4">
          <ChevronRightIcon className={`w-4 h-4 mr-2 ${isDarkMode ? 'text-zinc-400' : 'text-gray-500'}`} />
          <span className={`text-sm font-medium ${isDarkMode ? 'text-zinc-200' : 'text-gray-700'}`}>On this page</span>
        </div>
        <nav className="space-y-2">
          {headings.map((heading, index) => (
            <a
              key={index}
              href={`#${heading.id}`}
              className={`
                block text-sm 
                ${heading.level === 1 ? 'font-semibold' : 'font-normal'} 
                ${heading.level === 3 ? 'pl-4' : heading.level === 2 ? 'pl-2' : ''}
                ${heading.text === 'Titles' ? `${isDarkMode ? 'text-indigo-500' : 'text-indigo-600'}` : isDarkMode ? 'text-zinc-400 hover:text-zinc-200' : 'text-gray-600 hover:text-gray-900'}
              `}
              onClick={(e) => {
                e.preventDefault();
                const element = document.getElementById(heading.id);
                if (element) {
                  element.scrollIntoView({ behavior: 'smooth' });
                }
              }}
            >
              {heading.text}
            </a>
          ))}
        </nav>
      </div>
    </div>
  );
};

export default function DocsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [docContent, setDocContent] = useState<string | null>(null);
  const [contentType, setContentType] = useState<'business_summary' | 'technical_documentation' | 'readme' | undefined>(undefined);
  const [componentDocs, setComponentDocs] = useState<ComponentDoc[]>([]);
  const [businessLogicDocs, setBusinessLogicDocs] = useState<BusinessLogicDoc[]>([]);
  const [currentDocParam, setCurrentDocParam] = useState<string>('overview');
  const [darkMode, setDarkMode] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingText, setLoadingText] = useState('Fetching Codebase');
  const [showTagline, setShowTagline] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [repoExists, setRepoExists] = useState<boolean | null>(null);
  const router = useRouter();
  const params = useParams<{ username: string, repo: string }>();
  const searchParams = useSearchParams();
  const { username, repo } = params;

  // Check for repository parameter in the URL
  useEffect(() => {
    if (repo) {
      document.title = `${repo} | GitSummarize`;
    }
  }, [repo]);

  // Loading text rotation effect
  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;
    let taglineTimeout: NodeJS.Timeout | undefined;

    if (isGenerating) {
      const texts: string[] = [
        'Understanding Codebase',
        'Extracting Business Logic',
        'Generating Documentation'
      ];
      let currentIndex = 0;

      // Reset tagline visibility when generation starts
      setShowTagline(false);

      // Show tagline after 15 seconds
      taglineTimeout = setTimeout(() => {
        setShowTagline(true);
      }, 15000);

      // Initial loading text is already set to 'Fetching codebase'
      // After a delay, start cycling through other messages
      const initialDelay = setTimeout(() => {
        interval = setInterval(() => {
          setLoadingText(texts[currentIndex] ?? 'Processing');
          currentIndex = (currentIndex + 1) % texts.length;
        }, 1250); // Change text every 1.25 seconds
      }, 1500); // Start rotating after 1.5 seconds

      return () => {
        clearTimeout(initialDelay);
        clearTimeout(taglineTimeout);
        if (interval) clearInterval(interval);
      };
    }

    // Explicit empty return for the case when isGenerating is false
    return () => { /* cleanup not needed */ };
  }, [isGenerating]);

  // Function to call our server-side API to generate documentation
  const generateDocumentation = async (): Promise<boolean> => {
    try {
      const repoUrl = `https://github.com/${username}/${repo}`;

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

  // Add useEffect to load data from Supabase
  useEffect(() => {
    const loadDocs = async () => {
      try {
        if (!username || !repo) return;

        // Fetch repository data from Supabase
        const repoData = await getRepoSummary(username as string, repo as string);

        if (repoData) {
          // Store the full repo summary data
          // setRepoSummary(repoData); - Removing as it's unused
          setRepoExists(true);

          // Parse technical documentation
          if (repoData.technical_documentation) {
            const techDocs = parseComponentDocs(repoData.technical_documentation);
            setComponentDocs(techDocs);
          }

          // Parse business summary
          if (repoData.business_summary) {
            const businessDocs = parseBusinessLogicDocs(repoData.business_summary);
            setBusinessLogicDocs(businessDocs);
          }
        } else {
          console.log('Repository data not found, will need to generate');
          setRepoExists(false);
        }
      } catch (err) {
        console.error('Error loading documentation:', err);
        setRepoExists(false);
      }
    };

    void loadDocs();
  }, [username, repo]);

  // Effect to handle repo generation if it doesn't exist
  useEffect(() => {
    const handleRepoGeneration = async () => {
      if (repoExists === false && !isGenerating && !error) {
        setIsGenerating(true);
        setLoadingText('Fetching Codebase');

        try {
          // Set up timeout for the entire process
          const timeoutPromise = new Promise<boolean>((_, reject) => {
            setTimeout(() => reject(new Error('Request timed out after 4 minutes')), 240000); // 4 minutes timeout
          });

          // Race between API call and timeout
          const success = await Promise.race([
            generateDocumentation(),
            timeoutPromise
          ]);

          if (success) {
            // Reload the page to show the generated documentation
            window.location.reload();
          } else {
            throw new Error('Failed to generate documentation');
          }
        } catch (err) {
          console.error('Error generating repository documentation:', err);
          // Show a user-friendly error message
          const errorMessage = err instanceof Error ? err.message : 'Issue generating documentation. Please try again later.';
          setError(errorMessage);
          setIsGenerating(false);
        }
      }
    };

    void handleRepoGeneration();
  }, [repoExists, isGenerating, error, username, repo, generateDocumentation]);

  // Update the loadDocContent function to fetch README for overview
  const loadDocContent = useCallback(async (param: string) => {
    setIsLoading(true);
    try {
      // First check if it's a component doc
      const componentDoc = componentDocs.find(doc => doc.param === param);
      if (componentDoc) {
        setDocContent(componentDoc.content);
        setContentType('technical_documentation');
        setIsLoading(false);
        return;
      }

      // Then check if it's a business logic doc
      const businessLogicDoc = businessLogicDocs.find(doc => doc.param === param);
      if (businessLogicDoc) {
        setDocContent(businessLogicDoc.content);
        setContentType('business_summary');
        setIsLoading(false);
        return;
      }

      // If param is 'overview' or 'readme', create a default overview page with README
      if (param === 'overview' || param === 'readme') {
        // Try to fetch the README from GitHub
        try {
          // Check if the repo might contain a path (e.g., facebook/react/packages/next)
          let repoPath = '';
          // Extract any potential subdirectory path from the URL
          if (repo) {
            const pathMatch = /(.+)\/.+/.exec(repo);
            if (pathMatch?.[1]) {
              repoPath = pathMatch[1] + '/';
              console.log("Detected path in repo:", repoPath);
            }
          }

          // Try to fetch README from both main and master branches
          const branchNames = ['main', 'master'];
          let readmeContent = null;

          // Try each branch name until we find a README
          for (const branch of branchNames) {
            if (readmeContent) break; // Skip if we already found a README

            // Check all common README filename variants
            const readmeVariants = [
              'README.md',
              'readme.md',
              'Readme.md',
              'README',
              'readme'
            ];

            // Try each README filename variant
            for (const variant of readmeVariants) {
              if (readmeContent) break; // Skip if we already found a README

              // Try with and without the path prefix
              const urlsToTry = [
                // Try with direct path if one exists
                `https://raw.githubusercontent.com/${username}/${repo}/${branch}/${variant}`,
                // Try with path if extracted from repo
                repoPath && repo ? `https://raw.githubusercontent.com/${username}/${repo.replace(/(.+)\/.+/, '')}/${branch}/${repoPath}${variant}` : ''
              ].filter(Boolean);

              for (const url of urlsToTry) {
                if (!url) continue;

                console.log("Trying URL:", url);
                try {
                  const readmeResponse = await fetch(url);

                  if (readmeResponse.ok) {
                    readmeContent = await readmeResponse.text();
                    break;
                  }
                } catch (err) {
                  console.error("Error fetching from URL:", url, err);
                }
              }
            }
          }

          // Set the content based on whether we found a README or not
          if (readmeContent) {
            // Use the README content directly without the introduction text
            setDocContent(readmeContent);
          } else {
            // If no README found in any branch, show the default overview
            setDocContent(`# Repository Overview\n\nWelcome to the documentation for \`${username}/${repo}\`. Use the sidebar navigation to explore the AI generated documentation.`);
          }
        } catch (err) {
          console.error("Error fetching README:", err);
          setDocContent(`# Repository Overview\n\nWelcome to the documentation for \`${username}/${repo}\`. Use the sidebar navigation to explore the AI generated documentation.`);
        }

        setContentType('readme');
        setIsLoading(false);
        return;
      }

      // If param is 'readme', fetch and display the original README
      if (param === 'readme') {
        // Try to fetch the README from GitHub
        try {
          // Try to fetch README from both main and master branches
          const branchNames = ['main', 'master'];
          let readmeContent = null;

          // Try each branch name until we find a README
          for (const branch of branchNames) {
            if (readmeContent) break; // Skip if we already found a README

            // First try for README.md (most common)
            const readmeUrl = `https://raw.githubusercontent.com/${username}/${repo}/${branch}/README.md`;
            const readmeResponse = await fetch(readmeUrl);

            if (readmeResponse.ok) {
              readmeContent = await readmeResponse.text();
              break;
            } else {
              // If README.md not found, try README (without extension)
              const altReadmeUrl = `https://raw.githubusercontent.com/${username}/${repo}/${branch}/README`;
              const altReadmeResponse = await fetch(altReadmeUrl);

              if (altReadmeResponse.ok) {
                readmeContent = await altReadmeResponse.text();
                break;
              }
            }
          }

          if (readmeContent) {
            setDocContent(readmeContent);
          } else {
            setDocContent("# README Not Found\n\nNo README file was found in this repository.");
          }
        } catch (err) {
          console.error("Error fetching README:", err);
          setDocContent("# Error Loading README\n\nThere was an error loading the README file.");
        }

        setContentType('readme');
        setIsLoading(false);
        return;
      }

      // If no content found
      setDocContent(`# Document Not Found\n\nThe requested document '${param}' could not be found.`);
      setContentType(undefined);
    } catch (err) {
      console.error("Error loading documentation:", err);
      setDocContent(`# Error Loading Document\n\nThere was an error loading the requested document.`);
      setContentType(undefined);
    } finally {
      setIsLoading(false);
    }
  }, [componentDocs, businessLogicDocs, username, repo]);

  // Get the current doc parameter from the URL query or default to 'overview'
  useEffect(() => {
    const param = searchParams.get('doc') ?? 'overview';
    setCurrentDocParam(param);
    void loadDocContent(param);
  }, [searchParams, loadDocContent]);

  // Handle sidebar item click to preserve username and repo in the URL
  const handleSidebarItemClick = (param: string) => {
    router.push(`/${username}/${repo}?doc=${param}`);
  };

  // Top level navigation items
  const topNavItems = [
    { name: 'Overview', param: 'overview', icon: DocumentTextIcon },
    { name: 'README', param: 'readme', icon: DocumentTextIcon },
  ];


  // Update sidebar structure with params
  const sidebarItems: SidebarSection[] = [
    {
      title: 'High Level Documentation',
      items: [
        ...componentDocs.map(doc => ({
          name: doc.title,
          path: '#',
          param: doc.param,
          active: currentDocParam === doc.param,
        }))
      ]
    },
    {
      title: 'Business Logic',
      items: [
        ...businessLogicDocs.map(doc => ({
          name: doc.title,
          path: '#',
          param: doc.param,
          active: currentDocParam === doc.param,
        }))
      ]
    }
  ];

  // Feature cards with dark theme colors
  const featureCards = [
    {
      title: 'Creating content',
      description: 'Edit pages, content and more in GitBook.',
      icon: DocumentTextIcon,
      iconBg: 'bg-green-900/20',
      iconColor: 'text-green-500',
      border: 'border-green-500/20',
    },
    {
      title: 'Publishing documentation',
      description: 'Publish your docs site to share with others.',
      icon: BookOpenIcon,
      iconBg: 'bg-blue-900/20',
      iconColor: 'text-blue-500',
      border: 'border-blue-500/20',
    },
    {
      title: 'Collaboration',
      description: 'Invite your team and collaborate in GitBook.',
      icon: PuzzlePieceIcon,
      iconBg: 'bg-purple-900/20',
      iconColor: 'text-purple-500',
      border: 'border-purple-500/20',
    }
  ];

  // Add theme toggle function
  const toggleTheme = () => {
    setDarkMode(!darkMode);
  };

  return (
    <div className={`min-h-screen flex flex-col ${darkMode ? 'bg-[#111111] text-white' : 'bg-white text-gray-900'}`}>
      {/* Loading/Generation Modal */}
      {isGenerating && (
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

      {/* Repository Not Found Modal - shown briefly before generation starts */}
      {repoExists === false && !isGenerating && !error && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-zinc-900 rounded-xl p-8 flex flex-col items-center max-w-md">
            <div className="text-amber-500 text-5xl mb-4">🔍</div>
            <h3 className="text-white text-xl font-bold mb-2">Repository Not Cached</h3>
            <p className="text-zinc-300 text-center mb-6">
              This repository hasn&apos;t been analyzed yet. Starting documentation generation...
            </p>
          </div>
        </div>
      )}

      {/* Top Navigation */}
      <nav className={`${darkMode ? 'bg-[#111111] border-zinc-800' : 'bg-white border-gray-200'}`}>
        <div className="flex justify-between items-center h-16 px-6 mx-auto max-w-[75%] space-x-10">
          <div className="flex items-center space-x-10">
            <div className="flex items-center">
              <div className="mr-4 w-8 h-8 overflow-hidden rounded-full">
                <Image
                  src={`https://github.com/${username}.png`}
                  alt={`${username}'s avatar`}
                  className="w-full h-full object-cover"
                  width={40}
                  height={40}
                />
              </div>
              <span className={`text-2xl font-bold ${darkMode ? 'text-zinc-100' : 'text-gray-900'}`}>
                {username}/{repo}
              </span>
            </div>
          </div>

          <div className="flex space-x-6 text-sm">
            {/* Dark mode toggle in the top nav */}
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-md ${darkMode ? 'hover:bg-zinc-800' : 'hover:bg-gray-200'} flex items-center justify-center`}
              aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {darkMode ? (
                <SunIcon className="w-5 h-5 text-zinc-400 hover:text-zinc-200" />
              ) : (
                <MoonIcon className="w-5 h-5 text-gray-500 hover:text-gray-700" />
              )}
            </button>
            <Link href="/" className={`${darkMode ? 'text-zinc-400 hover:text-zinc-200' : 'text-gray-600 hover:text-gray-900'} pt-2`}>
              Home
            </Link>
            <div className="flex items-center space-x-1.5 pt-0">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className={`text-sm ${darkMode ? 'text-zinc-300' : 'text-gray-600'}`}>Live</span>
            </div>
            <Link
              href={`https://github.com/${username}/${repo}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 pt-2 text-white bg-green-600/90 hover:bg-green-600 rounded-md font-medium"
            >
              View Codebase
            </Link>
          </div>
        </div>
      </nav>

      <div className="flex flex-1 w-full">
        <div className="flex flex-1 w-full max-w-[75%] mx-auto">
          {/* Sidebar */}
          <aside className={`w-64 overflow-y-auto ${darkMode ? 'bg-[#111111]' : 'bg-white'}`}>
            <div className="py-8 px-5 sticky top-0">
              <div className="space-y-1 mb-10">
                {topNavItems.map((item, idx) => {
                  const Icon = item.icon;
                  const isActive = currentDocParam === item.param;
                  return (
                    <a
                      key={idx}
                      href={`/${username}/${repo}?doc=${item.param}`}
                      onClick={(e) => {
                        e.preventDefault();
                        handleSidebarItemClick(item.param);
                      }}
                      className={`flex items-center ${isActive ? 'text-green-500' : darkMode ? 'text-zinc-400 hover:text-zinc-200' : 'text-gray-600 hover:text-gray-900'} py-2`}
                    >
                      <div className={`rounded-md border ${darkMode ? 'border-zinc-800' : 'border-gray-200'} ${isActive ? 'bg-green-900/20' : darkMode ? 'bg-zinc-900/30' : 'bg-gray-100'} p-1.5 mr-3`}>
                        <Icon className={`w-5 h-5 ${isActive ? 'text-green-500' : darkMode ? 'text-zinc-400' : 'text-gray-600'}`} />
                      </div>
                      <span className="text-sm font-medium">{item.name}</span>
                    </a>
                  );
                })}
              </div>

              {sidebarItems.map((section, idx) => (
                <div key={idx} className="mb-12">
                  <h3 className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4`}>
                    {section.title}
                  </h3>
                  <ul className="space-y-3.5">
                    {section.items.map((item: SidebarItem, itemIdx: number) => {
                      const isActive = currentDocParam === item.param;

                      return (
                        <li key={itemIdx}>
                          <a
                            href={`/${username}/${repo}?doc=${item.param}`}
                            onClick={(e) => {
                              e.preventDefault();
                              handleSidebarItemClick(item.param);
                            }}
                            className={`flex items-center text-sm py-0.5 ${isActive ? 'rounded-md bg-green-900/20 font-medium text-green-500 -mx-4 px-4 py-2.5' : darkMode ? 'text-zinc-400 hover:text-zinc-200' : 'text-gray-600 hover:text-gray-900'}`}
                          >
                            {item.name}
                          </a>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          </aside>

          {/* Dynamic Main Content */}
          <main className={`flex-1 overflow-y-auto p-8 pl-20 ${darkMode ? '' : 'bg-gray-0'}`}>
            <div className="max-w-3xl pb-20">
              {/* Header Section */}
              <div className="mb-8">
                <div className="flex justify-between items-start">
                  <div className="w-full">
                    {/* Show loading state */}
                    {isLoading ? (
                      <div className="animate-pulse">
                        <div className={`h-4 ${darkMode ? 'bg-zinc-800' : 'bg-gray-300'} rounded w-3/4 mb-2.5`}></div>
                        <div className={`h-4 ${darkMode ? 'bg-zinc-800' : 'bg-gray-300'} rounded w-1/2 mb-2.5`}></div>
                        <div className={`h-4 ${darkMode ? 'bg-zinc-800' : 'bg-gray-300'} rounded w-5/6 mb-2.5`}></div>
                        <div className={`h-4 ${darkMode ? 'bg-zinc-800' : 'bg-gray-300'} rounded w-2/3 mb-2.5`}></div>
                      </div>
                    ) : (
                      <DynamicContent
                        content={docContent}
                        isDarkMode={darkMode}
                        contentType={contentType}
                      />
                    )}
                  </div>
                </div>

              </div>



              <div className={`flex items-center justify-between border-t ${darkMode ? 'border-zinc-800' : 'border-gray-200'} pt-4 mt-8`}>

              </div>
            </div>
          </main>

          {/* Table of Contents / Outline - now outside of main */}
          {!isLoading && docContent && (
            <div className="w-64 p-4 shrink-0">
              <TableOfContents content={docContent} isDarkMode={darkMode} contentType={contentType} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}