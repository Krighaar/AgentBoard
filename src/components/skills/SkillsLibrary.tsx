"use client";

import { useState, useMemo } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSkillsQuery, useDeleteSkill } from "@/hooks/useTasksQuery";
import { SkillCard } from "./SkillCard";
import { SkillForm } from "./SkillForm";
import { toast } from "sonner";
import type { Skill } from "@/generated/prisma/client";

interface SkillsLibraryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUseSkill?: (skill: Skill) => void;
}

export function SkillsLibrary({ open, onOpenChange, onUseSkill }: SkillsLibraryProps) {
  const { data: skills = [] } = useSkillsQuery();
  const deleteSkill = useDeleteSkill();
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editSkill, setEditSkill] = useState<Skill | null>(null);

  const filteredSkills = useMemo(() => {
    if (!search.trim()) return skills;
    const q = search.toLowerCase();
    return skills.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.tags.toLowerCase().includes(q)
    );
  }, [skills, search]);

  const handleUse = (skill: Skill) => {
    onUseSkill?.(skill);
    onOpenChange(false);
  };

  const handleEdit = (skill: Skill) => {
    setEditSkill(skill);
    setFormOpen(true);
  };

  const handleDelete = (skill: Skill) => {
    deleteSkill.mutate(skill.id, {
      onSuccess: () => toast.success(`Deleted "${skill.name}"`),
      onError: () => toast.error("Failed to delete skill"),
    });
  };

  const handleExport = async () => {
    try {
      const res = await fetch("/api/skills/export");
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `agentboard-skills-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Skills exported");
    } catch {
      toast.error("Failed to export skills");
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const res = await fetch("/api/skills/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Import failed");
      }
      const result = await res.json();
      toast.success(`Imported ${result.imported} skills`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to import skills");
    }
    e.target.value = "";
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Skills Library</SheetTitle>
            <SheetDescription>
              Reusable task templates for your agents
            </SheetDescription>
          </SheetHeader>

          <div className="flex flex-col gap-3 overflow-hidden px-4 pb-4">
            <div className="flex items-center gap-2">
              <Input
                placeholder="Search skills..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8"
              />
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                className="h-7 text-xs"
                onClick={() => {
                  setEditSkill(null);
                  setFormOpen(true);
                }}
              >
                + New Skill
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs"
                onClick={handleExport}
              >
                Export
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs"
                asChild
              >
                <label className="cursor-pointer">
                  Import
                  <input
                    type="file"
                    accept=".json"
                    className="hidden"
                    onChange={handleImport}
                  />
                </label>
              </Button>
            </div>

            <div className="flex flex-1 flex-col gap-2 overflow-y-auto">
              {filteredSkills.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  {search ? "No skills match your search" : "No skills yet"}
                </div>
              ) : (
                filteredSkills.map((skill) => (
                  <SkillCard
                    key={skill.id}
                    skill={skill}
                    onUse={handleUse}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <SkillForm
        open={formOpen}
        onOpenChange={setFormOpen}
        editSkill={editSkill}
      />
    </>
  );
}
