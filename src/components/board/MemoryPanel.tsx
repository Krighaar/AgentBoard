"use client";

import { useState, useMemo, useCallback } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  useMemoryQuery,
  useCreateMemory,
  useUpdateMemory,
  useDeleteMemory,
} from "@/hooks/useTasksQuery";
import { toast } from "sonner";
import type { Memory } from "@/generated/prisma/client";

interface MemoryPanelProps {
  boardId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function MemoryEntry({
  memory,
  onUpdate,
  onDelete,
}: {
  memory: Memory;
  onUpdate: (id: string, value: string) => void;
  onDelete: (id: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(memory.value);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleSave = () => {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== memory.value) {
      onUpdate(memory.id, trimmed);
    }
    setEditing(false);
  };

  const handleDelete = () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    onDelete(memory.id);
    setConfirmDelete(false);
  };

  return (
    <div className="rounded-md border border-border p-3 space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-sm font-medium truncate">{memory.key}</span>
        <div className="flex items-center gap-1.5 shrink-0">
          <Badge
            variant="outline"
            className={`text-[10px] ${memory.source === "agent" ? "border-blue-500/30 bg-blue-500/10 text-blue-400" : "border-zinc-500/30 bg-zinc-500/10 text-zinc-400"}`}
          >
            {memory.source}
          </Badge>
          {memory.sourceTaskId && (
            <span className="text-[10px] text-muted-foreground truncate max-w-[80px]" title={memory.sourceTaskId}>
              {memory.sourceTaskId.slice(0, 8)}
            </span>
          )}
        </div>
      </div>

      {editing ? (
        <div className="flex gap-2">
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSave();
              if (e.key === "Escape") {
                setDraft(memory.value);
                setEditing(false);
              }
            }}
            className="text-sm"
            autoFocus
          />
          <Button size="sm" variant="outline" onClick={handleSave}>
            Save
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setDraft(memory.value);
              setEditing(false);
            }}
          >
            Cancel
          </Button>
        </div>
      ) : (
        <div
          className="text-sm text-muted-foreground cursor-pointer rounded px-1.5 py-0.5 hover:bg-muted/50"
          onClick={() => setEditing(true)}
          title="Click to edit"
        >
          {memory.value}
        </div>
      )}

      <div className="flex justify-end">
        <Button
          size="sm"
          variant="ghost"
          className={confirmDelete ? "text-destructive" : "text-muted-foreground"}
          onClick={handleDelete}
          onBlur={() => setConfirmDelete(false)}
        >
          {confirmDelete ? "Confirm Delete" : "Delete"}
        </Button>
      </div>
    </div>
  );
}

export function MemoryPanel({ boardId, open, onOpenChange }: MemoryPanelProps) {
  const { data: memories = [], isLoading } = useMemoryQuery(boardId);
  const createMemory = useCreateMemory();
  const updateMemory = useUpdateMemory();
  const deleteMemory = useDeleteMemory();

  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");
  const [search, setSearch] = useState("");

  const filteredMemories = useMemo(() => {
    if (!search) return memories;
    const q = search.toLowerCase();
    return memories.filter(
      (m) =>
        m.key.toLowerCase().includes(q) || m.value.toLowerCase().includes(q)
    );
  }, [memories, search]);

  const handleCreate = useCallback(() => {
    const key = newKey.trim();
    const value = newValue.trim();
    if (!key || !value) {
      toast.error("Both key and value are required");
      return;
    }
    createMemory.mutate(
      { boardId, key, value },
      {
        onSuccess: () => {
          toast.success("Memory created");
          setNewKey("");
          setNewValue("");
        },
        onError: () => toast.error("Failed to create memory"),
      }
    );
  }, [boardId, newKey, newValue, createMemory]);

  const handleUpdate = useCallback(
    (id: string, value: string) => {
      updateMemory.mutate(
        { id, value },
        {
          onSuccess: () => toast.success("Memory updated"),
          onError: () => toast.error("Failed to update memory"),
        }
      );
    },
    [updateMemory]
  );

  const handleDelete = useCallback(
    (id: string) => {
      deleteMemory.mutate(id, {
        onSuccess: () => toast.success("Memory deleted"),
        onError: () => toast.error("Failed to delete memory"),
      });
    },
    [deleteMemory]
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Project Knowledge Base</SheetTitle>
        </SheetHeader>

        <div className="flex flex-1 flex-col gap-4 overflow-y-auto">
          {/* Search */}
          <Input
            placeholder="Filter by key or value..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="text-sm"
          />

          {/* Add new memory */}
          <div className="space-y-2 rounded-md border border-dashed border-border p-3">
            <div className="text-xs font-medium text-muted-foreground">Add New Memory</div>
            <Input
              placeholder="Key (e.g., db-orm)"
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
              className="text-sm"
            />
            <Input
              placeholder="Value (e.g., Using Prisma 7 with SQLite)"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreate();
              }}
              className="text-sm"
            />
            <Button
              size="sm"
              onClick={handleCreate}
              disabled={createMemory.isPending}
            >
              {createMemory.isPending ? "Saving..." : "Add Memory"}
            </Button>
          </div>

          {/* Memory list */}
          {isLoading ? (
            <div className="text-sm text-muted-foreground text-center py-4">
              Loading memories...
            </div>
          ) : filteredMemories.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-4">
              {search ? "No memories match your filter." : "No memories yet. Add one above or let agents discover knowledge automatically."}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredMemories.map((memory) => (
                <MemoryEntry
                  key={memory.id}
                  memory={memory}
                  onUpdate={handleUpdate}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}

          <div className="text-xs text-muted-foreground text-center pb-2">
            {memories.length} {memories.length === 1 ? "memory" : "memories"} total
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
