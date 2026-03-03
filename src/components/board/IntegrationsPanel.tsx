"use client";

import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  useIntegrationsQuery,
  useCreateIntegration,
  useUpdateIntegration,
  useDeleteIntegration,
  useTestIntegration,
} from "@/hooks/useTasksQuery";
import type { Integration } from "@/generated/prisma/client";
import { toast } from "sonner";

const EVENTS = ["task:done", "task:failed", "task:review"] as const;

interface IntegrationsPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function IntegrationsPanel({ open, onOpenChange }: IntegrationsPanelProps) {
  const { data: integrations = [] } = useIntegrationsQuery();
  const createIntegration = useCreateIntegration();
  const updateIntegration = useUpdateIntegration();
  const deleteIntegration = useDeleteIntegration();
  const testIntegration = useTestIntegration();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [formType, setFormType] = useState<"webhook" | "slack">("webhook");
  const [formName, setFormName] = useState("");
  const [formUrl, setFormUrl] = useState("");
  const [formSecret, setFormSecret] = useState("");
  const [formHeaders, setFormHeaders] = useState("");
  const [formSlackUrl, setFormSlackUrl] = useState("");
  const [formChannel, setFormChannel] = useState("");
  const [formEvents, setFormEvents] = useState<string[]>(["task:done", "task:failed"]);
  const [formBoardId, setFormBoardId] = useState("");

  function resetForm() {
    setFormType("webhook");
    setFormName("");
    setFormUrl("");
    setFormSecret("");
    setFormHeaders("");
    setFormSlackUrl("");
    setFormChannel("");
    setFormEvents(["task:done", "task:failed"]);
    setFormBoardId("");
    setEditingId(null);
    setShowForm(false);
  }

  function startEdit(integration: Integration) {
    setEditingId(integration.id);
    setFormType(integration.type as "webhook" | "slack");
    setFormName(integration.name);
    setFormEvents(integration.events.split(",").map((e) => e.trim()).filter(Boolean));
    setFormBoardId(integration.boardId);

    const config = JSON.parse(integration.config || "{}");
    if (integration.type === "webhook") {
      setFormUrl(config.url || "");
      setFormSecret(config.secret || "");
      setFormHeaders(
        config.headers ? JSON.stringify(config.headers) : ""
      );
      setFormSlackUrl("");
      setFormChannel("");
    } else {
      setFormSlackUrl(config.webhookUrl || "");
      setFormChannel(config.channel || "");
      setFormUrl("");
      setFormSecret("");
      setFormHeaders("");
    }
    setShowForm(true);
  }

  function toggleEvent(event: string) {
    setFormEvents((prev) =>
      prev.includes(event)
        ? prev.filter((e) => e !== event)
        : [...prev, event]
    );
  }

  async function handleSubmit() {
    if (!formName.trim()) {
      toast.error("Name is required");
      return;
    }

    let config: string;
    if (formType === "webhook") {
      if (!formUrl.trim()) {
        toast.error("URL is required for webhook");
        return;
      }
      let headers: Record<string, string> | undefined;
      if (formHeaders.trim()) {
        try {
          headers = JSON.parse(formHeaders);
        } catch {
          toast.error("Headers must be valid JSON");
          return;
        }
      }
      config = JSON.stringify({
        url: formUrl.trim(),
        ...(formSecret.trim() && { secret: formSecret.trim() }),
        ...(headers && { headers }),
      });
    } else {
      if (!formSlackUrl.trim()) {
        toast.error("Webhook URL is required for Slack");
        return;
      }
      config = JSON.stringify({
        webhookUrl: formSlackUrl.trim(),
        ...(formChannel.trim() && { channel: formChannel.trim() }),
      });
    }

    const events = formEvents.join(",");

    try {
      if (editingId) {
        await updateIntegration.mutateAsync({
          id: editingId,
          name: formName.trim(),
          config,
          events,
          boardId: formBoardId,
        });
        toast.success("Integration updated");
      } else {
        await createIntegration.mutateAsync({
          type: formType,
          name: formName.trim(),
          config,
          events,
          boardId: formBoardId,
        });
        toast.success("Integration created");
      }
      resetForm();
    } catch {
      toast.error("Failed to save integration");
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteIntegration.mutateAsync(id);
      toast.success("Integration deleted");
      if (editingId === id) resetForm();
    } catch {
      toast.error("Failed to delete integration");
    }
  }

  async function handleTest(id: string) {
    try {
      await testIntegration.mutateAsync(id);
      toast.success("Test notification sent");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Test failed");
    }
  }

  async function handleToggle(integration: Integration) {
    try {
      await updateIntegration.mutateAsync({
        id: integration.id,
        enabled: !integration.enabled,
      });
    } catch {
      toast.error("Failed to toggle integration");
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Integrations</SheetTitle>
          <SheetDescription>
            Configure webhooks and Slack notifications for task events.
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 px-4">
          {/* Integration list */}
          {integrations.length > 0 && (
            <div className="space-y-3 mb-4">
              {integrations.map((integration) => (
                <div
                  key={integration.id}
                  className="rounded-lg border border-border p-3 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">
                        {integration.name}
                      </span>
                      <Badge variant="outline" className="text-xs">
                        {integration.type}
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={
                        integration.enabled
                          ? "text-green-500 hover:text-green-600"
                          : "text-muted-foreground"
                      }
                      onClick={() => handleToggle(integration)}
                    >
                      {integration.enabled ? "Enabled" : "Disabled"}
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {integration.events
                      .split(",")
                      .map((e) => e.trim())
                      .filter(Boolean)
                      .map((event) => (
                        <Badge
                          key={event}
                          variant="secondary"
                          className="text-xs"
                        >
                          {event}
                        </Badge>
                      ))}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => startEdit(integration)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleTest(integration.id)}
                      disabled={testIntegration.isPending}
                    >
                      Test
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => handleDelete(integration.id)}
                      disabled={deleteIntegration.isPending}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {integrations.length === 0 && !showForm && (
            <p className="text-sm text-muted-foreground mb-4">
              No integrations configured yet.
            </p>
          )}

          {!showForm && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                resetForm();
                setShowForm(true);
              }}
            >
              Add Integration
            </Button>
          )}

          {showForm && (
            <>
              <Separator className="my-4" />
              <div className="space-y-4">
                <h3 className="text-sm font-medium">
                  {editingId ? "Edit Integration" : "New Integration"}
                </h3>

                {/* Type selector */}
                <div className="space-y-1.5">
                  <label className="text-sm text-muted-foreground">Type</label>
                  <Select
                    value={formType}
                    onValueChange={(v) => setFormType(v as "webhook" | "slack")}
                    disabled={!!editingId}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="webhook">Webhook</SelectItem>
                      <SelectItem value="slack">Slack</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Name */}
                <div className="space-y-1.5">
                  <label className="text-sm text-muted-foreground">Name</label>
                  <Input
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="My Webhook"
                  />
                </div>

                {/* Webhook-specific fields */}
                {formType === "webhook" && (
                  <>
                    <div className="space-y-1.5">
                      <label className="text-sm text-muted-foreground">
                        URL
                      </label>
                      <Input
                        value={formUrl}
                        onChange={(e) => setFormUrl(e.target.value)}
                        placeholder="https://example.com/webhook"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm text-muted-foreground">
                        Secret (optional)
                      </label>
                      <Input
                        value={formSecret}
                        onChange={(e) => setFormSecret(e.target.value)}
                        placeholder="HMAC-SHA256 signing secret"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm text-muted-foreground">
                        Custom Headers (optional, JSON)
                      </label>
                      <Input
                        value={formHeaders}
                        onChange={(e) => setFormHeaders(e.target.value)}
                        placeholder='{"Authorization": "Bearer ..."}'
                      />
                    </div>
                  </>
                )}

                {/* Slack-specific fields */}
                {formType === "slack" && (
                  <>
                    <div className="space-y-1.5">
                      <label className="text-sm text-muted-foreground">
                        Webhook URL
                      </label>
                      <Input
                        value={formSlackUrl}
                        onChange={(e) => setFormSlackUrl(e.target.value)}
                        placeholder="https://hooks.slack.com/services/..."
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm text-muted-foreground">
                        Channel (display only)
                      </label>
                      <Input
                        value={formChannel}
                        onChange={(e) => setFormChannel(e.target.value)}
                        placeholder="#general"
                      />
                    </div>
                  </>
                )}

                {/* Events */}
                <div className="space-y-1.5">
                  <label className="text-sm text-muted-foreground">
                    Events
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {EVENTS.map((event) => (
                      <button
                        key={event}
                        type="button"
                        onClick={() => toggleEvent(event)}
                        className={`rounded-md border px-3 py-1 text-xs transition-colors ${
                          formEvents.includes(event)
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border text-muted-foreground hover:border-primary/50"
                        }`}
                      >
                        {event}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Board scope */}
                <div className="space-y-1.5">
                  <label className="text-sm text-muted-foreground">
                    Board Scope
                  </label>
                  <Input
                    value={formBoardId}
                    onChange={(e) => setFormBoardId(e.target.value)}
                    placeholder="Leave empty for all boards"
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSubmit}>
                    {editingId ? "Update" : "Create"}
                  </Button>
                  <Button variant="outline" size="sm" onClick={resetForm}>
                    Cancel
                  </Button>
                </div>
              </div>
            </>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
