"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

interface GitDiffViewerProps {
  taskId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface DiffFile {
  header: string;
  hunks: string[];
}

function parseDiffFiles(diff: string): DiffFile[] {
  const files: DiffFile[] = [];
  const lines = diff.split("\n");
  let currentFile: DiffFile | null = null;
  let currentHunk: string[] = [];

  for (const line of lines) {
    if (line.startsWith("diff --git")) {
      if (currentFile) {
        if (currentHunk.length > 0) {
          currentFile.hunks.push(currentHunk.join("\n"));
        }
        files.push(currentFile);
      }
      currentFile = { header: line, hunks: [] };
      currentHunk = [];
    } else if (line.startsWith("@@")) {
      if (currentFile && currentHunk.length > 0) {
        currentFile.hunks.push(currentHunk.join("\n"));
      }
      currentHunk = [line];
    } else if (
      currentFile &&
      !currentFile.hunks.length &&
      currentHunk.length === 0 &&
      (line.startsWith("---") ||
        line.startsWith("+++") ||
        line.startsWith("index ") ||
        line.startsWith("new file") ||
        line.startsWith("deleted file") ||
        line.startsWith("old mode") ||
        line.startsWith("new mode") ||
        line.startsWith("similarity index") ||
        line.startsWith("rename from") ||
        line.startsWith("rename to") ||
        line.startsWith("Binary files"))
    ) {
      currentFile.header += "\n" + line;
    } else {
      currentHunk.push(line);
    }
  }

  if (currentFile) {
    if (currentHunk.length > 0) {
      currentFile.hunks.push(currentHunk.join("\n"));
    }
    files.push(currentFile);
  }

  return files;
}

function DiffLine({ line }: { line: string }) {
  let className = "whitespace-pre font-mono text-xs leading-5 px-2";
  if (line.startsWith("+")) {
    className += " bg-green-500/15 text-green-300";
  } else if (line.startsWith("-")) {
    className += " bg-red-500/15 text-red-300";
  } else if (line.startsWith("@@")) {
    className += " bg-cyan-500/10 text-cyan-400";
  } else if (
    line.startsWith("diff --git") ||
    line.startsWith("---") ||
    line.startsWith("+++") ||
    line.startsWith("index ")
  ) {
    className += " font-bold text-foreground";
  } else {
    className += " text-muted-foreground";
  }
  return <div className={className}>{line || " "}</div>;
}

function FileSection({ file }: { file: DiffFile }) {
  const [collapsed, setCollapsed] = useState(false);

  // Extract filename from header
  const match = file.header.match(/diff --git a\/(.+?) b\//);
  const filename = match ? match[1] : file.header;

  return (
    <div className="mb-4 overflow-hidden rounded-md border border-border">
      <button
        className="flex w-full items-center gap-2 bg-muted/50 px-3 py-2 text-left text-xs font-medium hover:bg-muted"
        onClick={() => setCollapsed(!collapsed)}
      >
        <span className="text-muted-foreground">
          {collapsed ? "+" : "-"}
        </span>
        <span className="font-mono">{filename}</span>
      </button>
      {!collapsed && (
        <div className="overflow-x-auto">
          {file.header.split("\n").slice(1).map((line, i) => (
            <DiffLine key={`h-${i}`} line={line} />
          ))}
          {file.hunks.map((hunk, i) =>
            hunk.split("\n").map((line, j) => (
              <DiffLine key={`${i}-${j}`} line={line} />
            ))
          )}
        </div>
      )}
    </div>
  );
}

export function GitDiffViewer({
  taskId,
  open,
  onOpenChange,
}: GitDiffViewerProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["diff", taskId],
    queryFn: async () => {
      const res = await fetch(`/api/tasks/${taskId}/diff`);
      if (!res.ok) throw new Error("Failed to fetch diff");
      return res.json() as Promise<{ diff: string; error?: string }>;
    },
    enabled: open,
  });

  const files = useMemo(() => {
    if (!data?.diff) return [];
    return parseDiffFiles(data.diff);
  }, [data?.diff]);

  const handleCopy = () => {
    if (data?.diff) {
      navigator.clipboard.writeText(data.diff);
      toast.success("Diff copied to clipboard");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Git Diff</span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              disabled={!data?.diff}
            >
              Copy
            </Button>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          {isLoading && (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Loading diff...
            </div>
          )}

          {error && (
            <div className="py-8 text-center text-sm text-red-400">
              {error instanceof Error ? error.message : "Failed to load diff"}
            </div>
          )}

          {data?.error && (
            <div className="py-4 text-center text-sm text-yellow-400">
              {data.error}
            </div>
          )}

          {!isLoading && !error && files.length === 0 && !data?.error && (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No diff available
            </div>
          )}

          {files.map((file, i) => (
            <FileSection key={i} file={file} />
          ))}

          {/* Show raw diff if parsing produced no files but diff text exists */}
          {data?.diff && files.length === 0 && !data.error && (
            <div className="overflow-x-auto">
              {data.diff.split("\n").map((line, i) => (
                <DiffLine key={i} line={line} />
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
