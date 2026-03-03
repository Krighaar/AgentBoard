"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { useCreateSkill, useUpdateSkill } from "@/hooks/useTasksQuery";
import { toast } from "sonner";
import type { Skill } from "@/generated/prisma/client";

interface SkillFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editSkill?: Skill | null;
}

export function SkillForm({ open, onOpenChange, editSkill }: SkillFormProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [prompt, setPrompt] = useState("");
  const [criteria, setCriteria] = useState("");
  const [model, setModel] = useState("");
  const [tags, setTags] = useState("");

  const createSkill = useCreateSkill();
  const updateSkill = useUpdateSkill();

  useEffect(() => {
    if (editSkill) {
      setName(editSkill.name);
      setDescription(editSkill.description);
      setPrompt(editSkill.prompt);
      setCriteria(editSkill.criteria);
      setModel(editSkill.model);
      setTags(editSkill.tags);
    } else {
      setName("");
      setDescription("");
      setPrompt("");
      setCriteria("");
      setModel("");
      setTags("");
    }
  }, [editSkill, open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const data = {
      name: name.trim(),
      description: description.trim(),
      prompt: prompt.trim(),
      criteria: criteria.trim(),
      model: model === "default" ? "" : model,
      tags: tags.trim(),
    };

    if (editSkill) {
      updateSkill.mutate(
        { id: editSkill.id, ...data },
        {
          onSuccess: () => {
            toast.success("Skill updated");
            onOpenChange(false);
          },
          onError: () => toast.error("Failed to update skill"),
        }
      );
    } else {
      createSkill.mutate(data, {
        onSuccess: () => {
          toast.success("Skill created");
          onOpenChange(false);
        },
        onError: () => toast.error("Failed to create skill"),
      });
    }
  };

  const isPending = createSkill.isPending || updateSkill.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{editSkill ? "Edit Skill" : "New Skill"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Skill name"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Description</label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Short description of what this skill does"
              rows={2}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">
              Prompt Template
            </label>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Task description template for the agent..."
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
              placeholder="Default acceptance criteria..."
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium">Model</label>
              <Select value={model || "default"} onValueChange={setModel}>
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

            <div>
              <label className="mb-1 block text-sm font-medium">Tags</label>
              <Input
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="Comma-separated"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : editSkill ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
