import React, { useState, useEffect } from 'react';
import { ChevronRight, ChevronDown, File, FileCode } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface DiffFile {
  sha: string;
  filename: string;
  status: 'added' | 'removed' | 'modified' | 'renamed';
  additions: number;
  deletions: number;
  changes: number;
  patch?: string;
  blob_url: string;
  raw_url: string;
}

interface DiffViewerProps {
  owner: string;
  repo: string;
  pullNumber: number;
}

export function DiffViewer({ owner, repo, pullNumber }: DiffViewerProps) {
  const [files, setFiles] = useState<DiffFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'unified' | 'split'>('unified');

  useEffect(() => {
    fetchDiffs();
  }, [owner, repo, pullNumber]);

  const fetchDiffs = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/pulls/${pullNumber}/files`,
        {
          headers: {
            'Accept': 'application/vnd.github+json',
            'X-GitHub-Api-Version': '2022-11-28',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch diffs: ${response.statusText}`);
      }

      const data = await response.json();
      setFiles(data);
      
      // Auto-select first file
      if (data.length > 0) {
        setSelectedFile(data[0].filename);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load diffs');
    } finally {
      setLoading(false);
    }
  };

  const getFileTree = () => {
    const tree: { [key: string]: DiffFile[] } = {};
    
    files.forEach(file => {
      const parts = file.filename.split('/');
      const folder = parts.length > 1 ? parts.slice(0, -1).join('/') : 'root';
      
      if (!tree[folder]) {
        tree[folder] = [];
      }
      tree[folder].push(file);
    });

    return tree;
  };

  const toggleFolder = (folder: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(folder)) {
      newExpanded.delete(folder);
    } else {
      newExpanded.add(folder);
    }
    setExpandedFolders(newExpanded);
  };

  const parsePatch = (patch: string) => {
    const lines = patch.split('\n');
    const chunks: Array<{
      oldStart: number;
      oldLines: number;
      newStart: number;
      newLines: number;
      lines: Array<{ type: 'add' | 'remove' | 'context'; content: string; oldLine?: number; newLine?: number }>;
    }> = [];

    let currentChunk: typeof chunks[0] | null = null;
    let oldLine = 0;
    let newLine = 0;

    lines.forEach(line => {
      // Parse chunk header
      const chunkMatch = line.match(/^@@ -(\d+),?(\d*) \+(\d+),?(\d*) @@/);
      if (chunkMatch) {
        if (currentChunk) {
          chunks.push(currentChunk);
        }
        oldLine = parseInt(chunkMatch[1]);
        newLine = parseInt(chunkMatch[3]);
        currentChunk = {
          oldStart: oldLine,
          oldLines: parseInt(chunkMatch[2] || '1'),
          newStart: newLine,
          newLines: parseInt(chunkMatch[4] || '1'),
          lines: [],
        };
        return;
      }

      if (!currentChunk) return;

      if (line.startsWith('+')) {
        currentChunk.lines.push({ type: 'add', content: line.slice(1), newLine: newLine++ });
      } else if (line.startsWith('-')) {
        currentChunk.lines.push({ type: 'remove', content: line.slice(1), oldLine: oldLine++ });
      } else if (line.startsWith(' ')) {
        currentChunk.lines.push({ 
          type: 'context', 
          content: line.slice(1), 
          oldLine: oldLine++, 
          newLine: newLine++ 
        });
      }
    });

    if (currentChunk) {
      chunks.push(currentChunk);
    }

    return chunks;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'added': return 'text-green-400';
      case 'removed': return 'text-red-400';
      case 'modified': return 'text-yellow-400';
      case 'renamed': return 'text-blue-400';
      default: return 'text-white/60';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'added': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'removed': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'modified': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'renamed': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default: return 'bg-white/10 text-white/60 border-white/20';
    }
  };

  if (loading) {
    return (
      <Card className="bg-black/80 border-white/10 backdrop-blur-md">
        <CardContent className="p-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            <span className="ml-3 text-white/60">Loading diffs...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="bg-black/80 border-white/10 backdrop-blur-md">
        <CardContent className="p-6">
          <div className="text-red-400">{error}</div>
        </CardContent>
      </Card>
    );
  }

  const fileTree = getFileTree();
  const selectedFileData = files.find(f => f.filename === selectedFile);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
      {/* File Tree */}
      <Card className="lg:col-span-1 bg-black/80 border-white/10 backdrop-blur-md max-h-[600px] overflow-y-auto">
        <CardHeader className="pb-3">
          <CardTitle className="text-white text-sm flex items-center gap-2">
            <FileCode className="h-4 w-4" />
            Files Changed ({files.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-0">
          <div className="space-y-1">
            {Object.entries(fileTree).map(([folder, folderFiles]) => (
              <div key={folder}>
                {folder !== 'root' && (
                  <button
                    onClick={() => toggleFolder(folder)}
                    className="flex items-center gap-1 text-white/60 hover:text-white text-xs w-full py-1 px-2 rounded hover:bg-white/5 transition-colors"
                  >
                    {expandedFolders.has(folder) ? (
                      <ChevronDown className="h-3 w-3" />
                    ) : (
                      <ChevronRight className="h-3 w-3" />
                    )}
                    <span className="truncate">{folder}</span>
                  </button>
                )}
                {(folder === 'root' || expandedFolders.has(folder)) && (
                  <div className={folder !== 'root' ? 'ml-4 space-y-1' : 'space-y-1'}>
                    {folderFiles.map(file => (
                      <button
                        key={file.filename}
                        onClick={() => setSelectedFile(file.filename)}
                        className={`flex items-center gap-2 text-xs w-full py-1.5 px-2 rounded transition-colors ${
                          selectedFile === file.filename
                            ? 'bg-white/10 text-white'
                            : 'text-white/60 hover:text-white hover:bg-white/5'
                        }`}
                      >
                        <File className="h-3 w-3 shrink-0" />
                        <span className={`truncate flex-1 text-left ${getStatusColor(file.status)}`}>
                          {file.filename.split('/').pop()}
                        </span>
                        <span className="text-[10px] text-green-400">+{file.additions}</span>
                        <span className="text-[10px] text-red-400">-{file.deletions}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Diff Display */}
      <Card className="lg:col-span-3 bg-black/80 border-white/10 backdrop-blur-md">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <CardTitle className="text-white text-sm truncate max-w-md">
                {selectedFileData?.filename}
              </CardTitle>
              {selectedFileData && (
                <span className={`text-xs px-2 py-0.5 rounded border ${getStatusBadge(selectedFileData.status)}`}>
                  {selectedFileData.status}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-white/60">
                +{selectedFileData?.additions} -{selectedFileData?.deletions}
              </span>
              <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)} className="w-auto">
                <TabsList className="bg-white/5 border border-white/10 h-7">
                  <TabsTrigger value="unified" className="text-xs h-6 data-[state=active]:bg-white/10">
                    Unified
                  </TabsTrigger>
                  <TabsTrigger value="split" className="text-xs h-6 data-[state=active]:bg-white/10">
                    Split
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {selectedFileData?.patch ? (
            <div className="max-h-[500px] overflow-auto bg-black/40">
              {parsePatch(selectedFileData.patch).map((chunk, chunkIdx) => (
                <div key={chunkIdx} className="border-t border-white/5 first:border-t-0">
                  <div className="bg-blue-500/10 px-4 py-1 text-xs text-blue-400 font-mono border-b border-white/5">
                    @@ -{chunk.oldStart},{chunk.oldLines} +{chunk.newStart},{chunk.newLines} @@
                  </div>
                  {chunk.lines.map((line, lineIdx) => (
                    <div
                      key={lineIdx}
                      className={`flex font-mono text-xs ${
                        line.type === 'add'
                          ? 'bg-green-500/10 text-green-300'
                          : line.type === 'remove'
                          ? 'bg-red-500/10 text-red-300'
                          : 'text-white/70'
                      }`}
                    >
                      {viewMode === 'unified' ? (
                        <>
                          <span className="px-3 py-1 text-white/40 select-none min-w-[60px] text-right border-r border-white/5">
                            {line.oldLine || ''} {line.newLine || ''}
                          </span>
                          <span className={`px-3 py-1 select-none ${
                            line.type === 'add' ? 'text-green-400' : line.type === 'remove' ? 'text-red-400' : 'text-white/40'
                          }`}>
                            {line.type === 'add' ? '+' : line.type === 'remove' ? '-' : ' '}
                          </span>
                          <span className="px-2 py-1 flex-1">{line.content}</span>
                        </>
                      ) : (
                        <div className="w-full grid grid-cols-2 divide-x divide-white/5">
                          <div className="flex">
                            <span className="px-3 py-1 text-white/40 select-none min-w-[50px] text-right border-r border-white/5">
                              {line.oldLine || ''}
                            </span>
                            {line.type !== 'add' && (
                              <span className="px-2 py-1 flex-1">{line.content}</span>
                            )}
                          </div>
                          <div className="flex">
                            <span className="px-3 py-1 text-white/40 select-none min-w-[50px] text-right border-r border-white/5">
                              {line.newLine || ''}
                            </span>
                            {line.type !== 'remove' && (
                              <span className="px-2 py-1 flex-1">{line.content}</span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-white/60">
              {selectedFileData?.status === 'added' || selectedFileData?.status === 'removed'
                ? `File ${selectedFileData.status} - no diff available`
                : 'No diff available for this file'}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
