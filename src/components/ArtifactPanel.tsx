import React, { useState, useEffect } from 'react';
import {
  X,
  Play,
  Code2,
  FileText,
  Download,
  Copy,
  Check,
  Maximize2,
  Minimize2,
  RefreshCw,
  Eye,
} from 'lucide-react';
import { Artifact } from '../types';

interface ArtifactPanelProps {
  artifact: Artifact | null;
  onClose: () => void;
}

export const ArtifactPanel: React.FC<ArtifactPanelProps> = ({ artifact, onClose }) => {
  if (!artifact) return null;

  const [activeTab, setActiveTab] = useState<'preview' | 'code'>(
    artifact.type === 'html' || artifact.language === 'html' ? 'preview' : 'code'
  );
  const [editableCode, setEditableCode] = useState(artifact.content);
  const [isCopied, setIsCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    setEditableCode(artifact.content);
    if (artifact.type === 'html' || artifact.language === 'html') {
      setActiveTab('preview');
    } else {
      setActiveTab('code');
    }
  }, [artifact]);

  const handleCopy = () => {
    navigator.clipboard.writeText(editableCode);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleDownload = () => {
    const ext =
      artifact.language === 'python'
        ? 'py'
        : artifact.language === 'html'
        ? 'html'
        : artifact.language === 'javascript' || artifact.language === 'js'
        ? 'js'
        : artifact.language === 'typescript' || artifact.language === 'ts' || artifact.language === 'tsx'
        ? 'tsx'
        : 'txt';
    const blob = new Blob([editableCode], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ultimate-ai-artifact.${ext}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Safe iframe srcDoc for preview
  const previewHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; margin: 0; padding: 16px; background: #ffffff; color: #1e293b; }
    @media (prefers-color-scheme: dark) {
      body { background: #0f172a; color: #f8fafc; }
    }
  </style>
</head>
<body>
  ${editableCode}
</body>
</html>
`;

  return (
    <div
      className={`flex flex-col bg-slate-900 border-l border-slate-800 transition-all duration-200 z-20 ${
        isFullscreen
          ? 'fixed inset-0 z-50 w-full h-full'
          : 'w-full md:w-[480px] lg:w-[540px] xl:w-[620px] h-full shrink-0'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-850 border-b border-slate-800">
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
            <Code2 className="w-4 h-4" />
          </div>
          <div className="truncate">
            <h3 className="text-xs font-semibold text-slate-100 truncate">{artifact.title}</h3>
            <p className="text-[11px] text-slate-400 uppercase tracking-wider font-mono">
              {artifact.language || 'Code Artifact'}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1">
          {/* Preview / Code Tabs */}
          <div className="flex items-center bg-slate-800 p-0.5 rounded-lg mr-2 border border-slate-700/60">
            {(artifact.type === 'html' || artifact.language === 'html') && (
              <button
                onClick={() => setActiveTab('preview')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  activeTab === 'preview'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Preview</span>
              </button>
            )}
            <button
              onClick={() => setActiveTab('code')}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                activeTab === 'code'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Source</span>
            </button>
          </div>

          {activeTab === 'preview' && (
            <button
              onClick={() => setRefreshKey((k) => k + 1)}
              title="Refresh Preview"
              aria-label="Refresh preview sandbox"
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}

          <button
            onClick={handleCopy}
            title="Copy to clipboard"
            aria-label="Copy code to clipboard"
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            {isCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>

          <button
            onClick={handleDownload}
            title="Download file"
            aria-label="Download artifact file"
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <Download className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            title={isFullscreen ? 'Restore' : 'Maximize'}
            aria-label={isFullscreen ? 'Restore panel' : 'Maximize panel'}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          <button
            onClick={onClose}
            title="Close panel"
            aria-label="Close artifact panel"
            className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Body */}
      <div className="flex-1 overflow-hidden relative bg-slate-950">
        {activeTab === 'preview' ? (
          <iframe
            key={refreshKey}
            srcDoc={previewHtml}
            title="Artifact Preview Sandbox"
            sandbox="allow-scripts allow-modals"
            className="w-full h-full border-0 bg-white"
          />
        ) : (
          <div className="h-full flex flex-col">
            <textarea
              value={editableCode}
              onChange={(e) => setEditableCode(e.target.value)}
              aria-label="Artifact code editor"
              className="w-full h-full p-4 font-mono text-xs bg-[#0b0f19] text-slate-200 resize-none outline-none focus:ring-1 focus:ring-indigo-500/50 leading-relaxed"
              spellCheck={false}
            />
          </div>
        )}
      </div>

      {/* Footer Info */}
      <div className="px-4 py-2 bg-slate-900 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
        <span>Live Interactive Sandbox</span>
        <span>{editableCode.split('\n').length} lines • {editableCode.length} characters</span>
      </div>
    </div>
  );
};
