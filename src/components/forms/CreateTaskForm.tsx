"use client";

import { useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateTask } from "@/hooks/useTasksQuery";
import { toast } from "sonner";
import { TASK_TEMPLATES } from "@/lib/templates";

interface CreateTaskFormProps {
  boardId?: string;
  externalOpen?: boolean;
  onExternalOpenChange?: (open: boolean) => void;
}

export function CreateTaskForm({ boardId, externalOpen, onExternalOpenChange }: CreateTaskFormProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = externalOpen ?? internalOpen;
  const setOpen = useCallback(
    (v: boolean) => {
      if (onExternalOpenChange) onExternalOpenChange(v);
      else setInternalOpen(v);
    },
    [onExternalOpenChange]
  );
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [criteria, setCriteria] = useState("");
  const [repoUrl, setRepoUrl] = useState("");
  const [priority, setPriority] = useState("2");
  const [tags, setTags] = useState("");
  const [dependsOn, setDependsOn] = useState("");
  const [model, setModel] = useState("");
  const [requireApproval, setRequireApproval] = useState(false);

  const createTask = useCreateTask();

  const handleTemplateSelect = (templateName: string) => {
    if (templateName === "none") return;
    const template = TASK_TEMPLATES.find((t) => t.name === templateName);
    if (!template) return;
    if (!description.trim()) setDescription(template.description);
    if (!criteria.trim()) setCriteria(template.criteria);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    // Build dependsOn as JSON array string from comma-separated IDs
    const depIds = dependsOn
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const dependsOnJson = depIds.length > 0 ? JSON.stringify(depIds) : "";

    // Append approval:required tag if checkbox is set
    let finalTags = tags.trim();
    if (requireApproval) {
      const tagList = finalTags ? finalTags.split(",").map((t) => t.trim()) : [];
      if (!tagList.includes("approval:required")) {
        tagList.push("approval:required");
      }
      finalTags = tagList.join(", ");
    }

    createTask.mutate(
      {
        title: title.trim(),
        description: description.trim(),
        criteria: criteria.trim(),
        repoUrl: repoUrl.trim(),
        priority: parseInt(priority),
        tags: finalTags,
        dependsOn: dependsOnJson,
        model: model === "default" ? "" : model,
        boardId,
      },
      {
        onSuccess: () => {
          toast.success("Task created");
          setTitle("");
          setDescription("");
          setCriteria("");
          setRepoUrl("");
          setPriority("2");
          setTags("");
          setDependsOn("");
          setModel("");
          setRequireApproval(false);
          setOpen(false);
        },
        onError: () => {
          toast.error("Failed to create task");
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">+ New Task</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Task</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Template</label>
            <Select onValueChange={handleTemplateSelect}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a template..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No template</SelectItem>
                {TASK_TEMPLATES.map((t) => (
                  <SelectItem key={t.name} value={t.name}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Title</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What should the agent do?"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Description
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detailed instructions for the agent..."
              rows={3}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Acceptance Criteria
            </label>
            <Textarea
              value={criteria}
              onChange={(e) => setCriteria(e.target.value)}
              placeholder="How to verify the task is complete..."
              rows={2}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Working Directory
            </label>
            <Input
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              placeholder="Defaults to workspaces/<taskId> if empty"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Tags</label>
            <Input
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="Comma-separated: bug, frontend, urgent"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Depends On
            </label>
            <Input
              value={dependsOn}
              onChange={(e) => setDependsOn(e.target.value)}
              placeholder="Comma-separated task IDs"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Priority</label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">High</SelectItem>
                  <SelectItem value="2">Medium</SelectItem>
                  <SelectItem value="3">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">Model</label>
              <Select value={model} onValueChange={setModel}>
                <SelectTrigger>
                  <SelectValue placeholder="Default" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Default</SelectItem>
                  <SelectItem value="opus">Opus</SelectItem>
                  <SelectItem value="sonnet">Sonnet</SelectItem>
                  <SelectItem value="haiku">Haiku</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="require-approval"
              checked={requireApproval}
              onChange={(e) => setRequireApproval(e.target.checked)}
              className="h-4 w-4 rounded border-border"
            />
            <label htmlFor="require-approval" className="text-sm font-medium">
              Require Approval
            </label>
            <span className="text-xs text-muted-foreground">
              (task goes to Review before Done)
            </span>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={createTask.isPending}>
              {createTask.isPending ? "Creating..." : "Create Task"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
