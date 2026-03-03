"use client";

import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useBoardsQuery,
  useCreateBoard,
  useDeleteBoard,
} from "@/hooks/useTasksQuery";
import { toast } from "sonner";

interface BoardSelectorProps {
  boardId: string;
  onBoardChange: (id: string) => void;
}

export function BoardSelector({ boardId, onBoardChange }: BoardSelectorProps) {
  const { data: boards = [] } = useBoardsQuery();
  const createBoard = useCreateBoard();
  const deleteBoard = useDeleteBoard();
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const currentBoard = boards.find((b) => b.id === boardId);
  const displayName = currentBoard?.name || "Default Board";

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    createBoard.mutate(
      { name: newName.trim() },
      {
        onSuccess: (board) => {
          toast.success(`Board "${board.name}" created`);
          onBoardChange(board.id);
          setNewName("");
          setCreateOpen(false);
        },
        onError: () => toast.error("Failed to create board"),
      }
    );
  };

  const handleDelete = (id: string) => {
    deleteBoard.mutate(id, {
      onSuccess: () => {
        toast.success("Board deleted");
        if (boardId === id) onBoardChange("default");
        setDeleteConfirm(null);
      },
      onError: (err) => {
        toast.error(err.message);
        setDeleteConfirm(null);
      },
    });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-1">
            {displayName}
            <span className="text-xs text-muted-foreground">&#x25BC;</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          {boards.map((board) => (
            <DropdownMenuItem
              key={board.id}
              className="flex items-center justify-between"
              onSelect={() => onBoardChange(board.id)}
            >
              <span className={board.id === boardId ? "font-semibold" : ""}>
                {board.name}
              </span>
              {board.id !== "default" && (
                <button
                  className="ml-2 text-xs text-muted-foreground hover:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteConfirm(board.id);
                  }}
                >
                  x
                </button>
              )}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => setCreateOpen(true)}>
            + New Board
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Create board dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Board</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Board name"
              autoFocus
            />
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setCreateOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createBoard.isPending}>
                {createBoard.isPending ? "Creating..." : "Create"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete confirm dialog */}
      <Dialog
        open={deleteConfirm !== null}
        onOpenChange={() => setDeleteConfirm(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Board</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete this board? It must have no tasks.
          </p>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setDeleteConfirm(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
              disabled={deleteBoard.isPending}
            >
              {deleteBoard.isPending ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
