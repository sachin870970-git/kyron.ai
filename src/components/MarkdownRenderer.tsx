import React, { useState, useMemo } from 'react';
import { Copy, Check, Terminal, ExternalLink, ChevronDown, ChevronRight, Sparkles } from 'lucide-react';
import { marked } from 'marked';
import { Artifact } from '../types';

interface MarkdownRendererProps {
  content: string;
  onOpenArtifact?: (artifact: Artifact) => void;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = React.memo(({ content, onOpenArtifact }) => {
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);
  const [thinkingExpanded, setThinkingExpanded] = useState(false);

  // Memoize parsing of thinking blocks and markdown content so completed messages never re-parse
  const { thinkingContent, parts, htmlMap, hasMainContent } = useMemo(() => {
    let thinking = '';
    let main = content;

    const thinkingMatch = content.match(/<thinking>([\s\S]*?)<\/thinking>/i);
    if (thinkingMatch) {
      thinking = thinkingMatch[1].trim();
      main = content.replace(/<thinking>[\s\S]*?<\/thinking>/i, '').trim();
    } else {
      const openThinkingMatch = content.match(/<thinking>([\s\S]*)$/i);
      if (openThinkingMatch) {
        thinking = openThinkingMatch[1].trim();
        main = content.replace(/<thinking>[\s\S]*$/i, '').trim();
      }
    }

    const splitParts = splitCodeBlocks(main);
    const htmlObj: Record<number, string> = {};

    splitParts.forEach((p, idx) => {
      if (p.type === 'text') {
        try {
          htmlObj[idx] = marked.parse(p.text, { async: false }) as string;
        } catch (err) {
          console.warn('Markdown parsing error on chunk:', err);
          htmlObj[idx] = `<p>${p.text.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>`;
        }
      }
    });

    return {
      thinkingContent: thinking,
      parts: splitParts,
      htmlMap: htmlObj,
      hasMainContent: Boolean(main.trim()),
    };
  }, [content]);

  // When reasoning is active and final answer is not yet ready, keep expanded so user sees real-time progress
  const isExpanded = thinkingExpanded || (!hasMainContent && Boolean(thinkingContent));

  const handleCopy = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  return (
    <div className="text-slate-100 leading-relaxed space-y-3 font-sans break-words overflow-hidden text-[15px]">
      {/* Reasoning / Thinking Process Disclosure */}
      {thinkingContent && (
        <div className="mb-4 rounded-xl border border-violet-500/20 bg-violet-950/20 backdrop-blur-sm overflow-hidden transition-all">
          <button
            onClick={() => setThinkingExpanded(!isExpanded)}
            className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-medium text-violet-300 hover:bg-violet-900/30 transition-colors"
            aria-expanded={isExpanded}
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-violet-400 animate-pulse" />
              <span>Thought Process & Reasoning Breakdown</span>
            </div>
            <div className="flex items-center gap-1 text-violet-400/80">
              <span>{isExpanded ? 'Collapse' : 'Expand'}</span>
              {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
            </div>
          </button>
          {isExpanded && (
            <div className="p-4 pt-1 text-xs text-violet-200/90 border-t border-violet-500/10 font-mono whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto">
              {thinkingContent}
            </div>
          )}
        </div>
      )}

      {/* Main Content Parsed */}
      {parts.map((part, idx) => {
        if (part.type === 'code') {
          const artifactId = `code-block-${idx}`;
          const isCopied = copiedCodeId === artifactId;
          const isInteractive = ['html', 'svg', 'jsx', 'tsx', 'javascript', 'js'].includes(part.lang.toLowerCase());

          return (
            <div
              key={idx}
              className="my-3 rounded-xl overflow-hidden border border-slate-700/60 bg-slate-900 shadow-md"
            >
              <div className="flex items-center justify-between px-3.5 py-1.5 bg-slate-800/80 border-b border-slate-700/60 text-xs text-slate-300">
                <div className="flex items-center gap-2 font-mono uppercase tracking-wider text-[11px] text-indigo-300">
                  <Terminal className="w-3.5 h-3.5" />
                  <span>{part.lang || 'code'}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {onOpenArtifact && isInteractive && (
                    <button
                      onClick={() =>
                        onOpenArtifact({
                          id: artifactId,
                          type: part.lang.toLowerCase() === 'html' || part.lang.toLowerCase() === 'svg' ? 'html' : 'code',
                          title: `${part.lang.toUpperCase()} Interactive Studio`,
                          language: part.lang,
                          content: part.code,
                        })
                      }
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium bg-indigo-600/30 text-indigo-200 hover:bg-indigo-600/50 transition-colors"
                      title="Open in Sandbox / Artifact Panel"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Preview & Run</span>
                    </button>
                  )}
                  <button
                    onClick={() => handleCopy(part.code, artifactId)}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] text-slate-300 hover:text-white hover:bg-slate-700/60 transition-colors"
                    aria-label="Copy code to clipboard"
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
              <pre className="p-3.5 text-xs text-slate-200 font-mono overflow-x-auto leading-relaxed bg-[#0d1117]">
                <code>{part.code}</code>
              </pre>
            </div>
          );
        }

        // Render Markdown HTML from precomputed memoized map
        const html = htmlMap[idx] || '';
        return (
          <div
            key={idx}
            className="prose prose-invert prose-slate max-w-none prose-p:my-2 prose-headings:font-semibold prose-headings:text-slate-100 prose-headings:my-2.5 prose-h1:text-xl prose-h2:text-lg prose-h3:text-base prose-ul:my-2 prose-li:my-0.5 prose-table:border prose-table:border-slate-700 prose-th:bg-slate-800 prose-th:p-2 prose-td:p-2 prose-td:border prose-td:border-slate-700/70"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        );
      })}
    </div>
  );
});

interface CodeChunk {
  type: 'code';
  lang: string;
  code: string;
}

interface TextChunk {
  type: 'text';
  text: string;
}

function splitCodeBlocks(content: string): (CodeChunk | TextChunk)[] {
  const chunks: (CodeChunk | TextChunk)[] = [];
  const regex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      chunks.push({
        type: 'text',
        text: content.slice(lastIndex, match.index),
      });
    }

    chunks.push({
      type: 'code',
      lang: match[1] || 'text',
      code: match[2].trimEnd(),
    });

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < content.length) {
    chunks.push({
      type: 'text',
      text: content.slice(lastIndex),
    });
  }

  return chunks;
}
