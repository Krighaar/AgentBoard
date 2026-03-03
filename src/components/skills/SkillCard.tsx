"use client";

import type { Skill } from "@/generated/prisma/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface SkillCardProps {
  skill: Skill;
  onUse: (skill: Skill) => void;
  onEdit: (skill: Skill) => void;
  onDelete: (skill: Skill) => void;
}

export function SkillCard({ skill, onUse, onEdit, onDelete }: SkillCardProps) {
  const tags = skill.tags
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-border bg-card p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate font-medium text-sm">{skill.name}</span>
            {skill.isBuiltIn && (
              <Badge variant="secondary" className="shrink-0 text-[10px]">
                Built-in
              </Badge>
            )}
          </div>
          {skill.description && (
            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
              {skill.description}
            </p>
          )}
        </div>
      </div>

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {tags.map((tag) => (
            <Badge key={tag} variant="outline" className="text-[10px]">
              {tag}
            </Badge>
          ))}
        </div>
      )}

      {skill.model && (
        <div className="text-xs text-muted-foreground">
          Model: {skill.model}
        </div>
      )}

      <div className="flex items-center gap-1 pt-1">
        <Button size="sm" variant="default" className="h-7 text-xs" onClick={() => onUse(skill)}>
          Use
        </Button>
        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => onEdit(skill)}>
          Edit
        </Button>
        {!skill.isBuiltIn && (
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-xs text-destructive hover:text-destructive"
            onClick={() => onDelete(skill)}
          >
            Delete
          </Button>
        )}
      </div>
    </div>
  );
}
