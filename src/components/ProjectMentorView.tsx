import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowDown,
  ArrowUp,
  Clock,
  GraduationCap,
  Layers,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { queryKeys } from "@/hooks/useAdminData";
import { ProjectService } from "@/Services/project.service";
import { apiErrorMessage } from "@/Api/error-handling";
import { difficultyStyles } from "@/Utils/projectDisplay";
import { cn } from "@/lib/utils";
import type {
  Phase,
  PhaseResource,
  Project,
  ProjectDifficulty,
} from "@/Types";

const RESOURCE_TYPES: PhaseResource["type"][] = ["Video", "Document", "Link"];

/** Short client-side id, matching how the mentor's own editor mints them. */
function newId(): string {
  return Math.random().toString(36).slice(2, 11);
}

/**
 * The admin's mentor-POV of a project: the same information the owning mentor
 * sees on their edit screen, with the admin's cross-mentor powers — edit the
 * core fields, publish/unpublish, or delete. Deep phase editing (adding/
 * reordering phases and resources) stays on the mentor's own screen for now;
 * here phases are shown read-only.
 */
export function ProjectMentorView({
  project,
  mentorName,
  enrolled,
}: {
  project: Project;
  mentorName: string | null;
  enrolled: number;
}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const difficulty = project.difficulty ?? project.project_level;
  // Read-only view reads straight from the project; the editable copy lives in
  // `phases` state below.
  const viewPhases = project.phases ?? [];

  const [form, setForm] = useState({
    title: project.title ?? "",
    subtitle: project.subtitle ?? "",
    description: project.description ?? "",
    category: project.category ?? "",
    difficulty: (difficulty ?? "Beginner") as ProjectDifficulty,
    duration: project.duration ?? "",
    tags: (project.tags ?? []).join(", "),
  });
  const [phases, setPhases] = useState<Phase[]>(project.phases ?? []);

  // Re-seed the form from the current project whenever we ENTER edit mode, so a
  // second edit after a save starts from the freshly-saved values rather than
  // the stale mount-time snapshot.
  const startEditing = () => {
    setForm({
      title: project.title ?? "",
      subtitle: project.subtitle ?? "",
      description: project.description ?? "",
      category: project.category ?? "",
      difficulty: (difficulty ?? "Beginner") as ProjectDifficulty,
      duration: project.duration ?? "",
      tags: (project.tags ?? []).join(", "),
    });
    setPhases(project.phases ?? []);
    setEditing(true);
  };

  const addPhase = () =>
    setPhases((prev) => [
      ...prev,
      {
        id: newId(),
        title: "New Phase",
        description: "",
        status: "locked",
        progress: 0,
        resources: [],
        isLocked: true,
      },
    ]);

  const updatePhase = (id: string, updates: Partial<Phase>) =>
    setPhases((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates } : p))
    );

  const removePhase = (id: string) =>
    setPhases((prev) => prev.filter((p) => p.id !== id));

  const movePhase = (index: number, dir: -1 | 1) =>
    setPhases((prev) => {
      const j = index + dir;
      if (j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[j]] = [next[j], next[index]];
      return next;
    });

  const addResource = (phaseId: string) =>
    setPhases((prev) =>
      prev.map((p) =>
        p.id === phaseId
          ? {
              ...p,
              resources: [
                ...p.resources,
                { id: newId(), title: "New Resource", type: "Link", link: "" },
              ],
            }
          : p
      )
    );

  const updateResource = (
    phaseId: string,
    resourceId: string,
    updates: Partial<PhaseResource>
  ) =>
    setPhases((prev) =>
      prev.map((p) =>
        p.id === phaseId
          ? {
              ...p,
              resources: p.resources.map((r) =>
                r.id === resourceId ? { ...r, ...updates } : r
              ),
            }
          : p
      )
    );

  const removeResource = (phaseId: string, resourceId: string) =>
    setPhases((prev) =>
      prev.map((p) =>
        p.id === phaseId
          ? { ...p, resources: p.resources.filter((r) => r.id !== resourceId) }
          : p
      )
    );

  const invalidate = () => {
    queryClient.invalidateQueries({
      queryKey: [...queryKeys.projects, project.project_id],
    });
    queryClient.invalidateQueries({ queryKey: queryKeys.projects });
  };

  const save = useMutation({
    mutationFn: () =>
      ProjectService.update(project.project_id, {
        title: form.title.trim(),
        subtitle: form.subtitle.trim(),
        description: form.description.trim(),
        category: form.category.trim(),
        difficulty: form.difficulty,
        duration: form.duration.trim(),
        tags: form.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
        phases,
      }),
    onSuccess: () => {
      toast.success("Project updated.");
      invalidate();
      setEditing(false);
    },
    onError: (err) => toast.error(apiErrorMessage(err, "Could not save.")),
  });

  const togglePublish = useMutation({
    mutationFn: () =>
      ProjectService.setPublish(project.project_id, !project.publish),
    onSuccess: () => {
      toast.success(project.publish ? "Project unpublished." : "Project published.");
      invalidate();
    },
    onError: (err) =>
      toast.error(apiErrorMessage(err, "Could not change publish state.")),
  });

  const remove = useMutation({
    mutationFn: () => ProjectService.remove(project.project_id),
    onSuccess: () => {
      toast.success("Project deleted.");
      queryClient.invalidateQueries({ queryKey: queryKeys.projects });
      navigate("/projects");
    },
    onError: (err) => toast.error(apiErrorMessage(err, "Could not delete.")),
  });

  return (
    <div className="space-y-6">
      {/* Actions */}
      <div className="flex flex-wrap items-center gap-2">
        {editing ? (
          <>
            <Button onClick={() => save.mutate()} disabled={save.isPending}>
              Save changes
            </Button>
            <Button
              variant="outline"
              onClick={() => setEditing(false)}
              disabled={save.isPending}
            >
              Cancel
            </Button>
          </>
        ) : (
          <>
            <Button variant="outline" onClick={startEditing}>
              <Pencil className="mr-2 h-4 w-4" />
              Edit project
            </Button>
            <Button
              variant="outline"
              onClick={() => togglePublish.mutate()}
              disabled={togglePublish.isPending}
            >
              {project.publish ? "Unpublish" : "Publish"}
            </Button>
            <Button
              variant="outline"
              onClick={() => setConfirmDelete(true)}
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </>
        )}
      </div>

      {editing ? (
        <div className="space-y-6">
          <div className="space-y-4 rounded-xl border border-border bg-card p-6">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="subtitle">Subtitle</Label>
            <Input
              id="subtitle"
              value={form.subtitle}
              onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Difficulty</Label>
              <Select
                value={form.difficulty}
                onValueChange={(v) =>
                  setForm({ ...form, difficulty: v as ProjectDifficulty })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Beginner">Beginner</SelectItem>
                  <SelectItem value="Intermediate">Intermediate</SelectItem>
                  <SelectItem value="Advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration">Duration</Label>
              <Input
                id="duration"
                placeholder="e.g. 4 weeks"
                value={form.duration}
                onChange={(e) => setForm({ ...form, duration: e.target.value })}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="tags">Tags</Label>
            <Input
              id="tags"
              placeholder="Comma-separated"
              value={form.tags}
              onChange={(e) => setForm({ ...form, tags: e.target.value })}
            />
          </div>
          </div>

          {/* Phase editor */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">Phases</h3>
              <Button variant="outline" size="sm" onClick={addPhase}>
                <Plus className="mr-2 h-4 w-4" />
                Add phase
              </Button>
            </div>
            {phases.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                No phases yet. Add one to structure the project.
              </p>
            ) : (
              phases.map((phase, index) => (
                <div
                  key={phase.id}
                  className="space-y-3 rounded-xl border border-border bg-card p-4"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-muted-foreground">
                      Phase {index + 1}
                    </span>
                    <div className="ml-auto flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        disabled={index === 0}
                        onClick={() => movePhase(index, -1)}
                        aria-label="Move phase up"
                      >
                        <ArrowUp className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        disabled={index === phases.length - 1}
                        onClick={() => movePhase(index, 1)}
                        aria-label="Move phase down"
                      >
                        <ArrowDown className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => removePhase(phase.id)}
                        aria-label="Remove phase"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <Input
                    value={phase.title}
                    placeholder="Phase title"
                    onChange={(e) =>
                      updatePhase(phase.id, { title: e.target.value })
                    }
                  />
                  <textarea
                    value={phase.description ?? ""}
                    placeholder="Description"
                    onChange={(e) =>
                      updatePhase(phase.id, { description: e.target.value })
                    }
                    className="flex min-h-[70px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                  <div className="flex items-center gap-2">
                    <Label className="text-xs text-muted-foreground">
                      Duration (days)
                    </Label>
                    <Input
                      type="number"
                      min={0}
                      className="w-28"
                      value={phase.duration_days ?? ""}
                      onChange={(e) =>
                        updatePhase(phase.id, {
                          duration_days:
                            e.target.value === ""
                              ? undefined
                              : Number(e.target.value),
                        })
                      }
                    />
                  </div>

                  {/* Resources */}
                  <div className="space-y-2 border-t border-border pt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">
                        Resources
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => addResource(phase.id)}
                      >
                        <Plus className="mr-1 h-3.5 w-3.5" />
                        Add
                      </Button>
                    </div>
                    {phase.resources.length === 0 ? (
                      <p className="text-xs text-muted-foreground">
                        No resources.
                      </p>
                    ) : (
                      phase.resources.map((r) => (
                        <div
                          key={r.id}
                          className="flex flex-wrap items-center gap-2"
                        >
                          <Input
                            className="min-w-[140px] flex-1"
                            placeholder="Title"
                            value={r.title}
                            onChange={(e) =>
                              updateResource(phase.id, r.id, {
                                title: e.target.value,
                              })
                            }
                          />
                          <Select
                            value={r.type}
                            onValueChange={(v) =>
                              updateResource(phase.id, r.id, {
                                type: v as PhaseResource["type"],
                              })
                            }
                          >
                            <SelectTrigger className="w-[130px]">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {RESOURCE_TYPES.map((t) => (
                                <SelectItem key={t} value={t}>
                                  {t}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Input
                            className="min-w-[160px] flex-1"
                            placeholder="URL"
                            value={r.link}
                            onChange={(e) =>
                              updateResource(phase.id, r.id, {
                                link: e.target.value,
                              })
                            }
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => removeResource(phase.id, r.id)}
                            aria-label="Remove resource"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ))
            )}
            <p className="text-xs text-muted-foreground">
              Document resources take a URL here — file upload lives on the
              mentor&apos;s own editor.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Meta */}
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              {difficulty && (
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[10px] font-bold uppercase tracking-wider",
                    difficultyStyles[difficulty]
                  )}
                >
                  {difficulty}
                </Badge>
              )}
              {project.category && (
                <Badge variant="secondary" className="text-[10px]">
                  {project.category}
                </Badge>
              )}
              <Badge
                variant="outline"
                className={cn(
                  "text-[10px] font-medium",
                  project.publish
                    ? "border-success/20 bg-success/10 text-success"
                    : "text-muted-foreground"
                )}
              >
                {project.publish ? "Published" : "Draft"}
              </Badge>
            </div>

            {project.subtitle && (
              <p className="mb-3 text-sm text-muted-foreground">
                {project.subtitle}
              </p>
            )}
            {project.description && (
              <p className="mb-4 whitespace-pre-wrap text-sm text-foreground">
                {project.description}
              </p>
            )}

            <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-muted-foreground">
              <span>Mentor: {mentorName ?? "Unassigned"}</span>
              {project.duration && (
                <span className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  {project.duration}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5" />
                {viewPhases.length}{" "}
                {viewPhases.length === 1 ? "phase" : "phases"}
              </span>
              <span className="flex items-center gap-1.5">
                <GraduationCap className="h-3.5 w-3.5" />
                {enrolled} enrolled
              </span>
            </div>
          </div>

          {/* Phases (read-only) */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Phases</h3>
            {viewPhases.length === 0 ? (
              <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                No phases yet.
              </p>
            ) : (
              viewPhases.map((phase, index) => (
                <div
                  key={phase.id ?? index}
                  className="rounded-xl border border-border bg-card p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-medium text-foreground">
                      {index + 1}. {phase.title}
                    </p>
                    {phase.duration_days ? (
                      <span className="text-xs text-muted-foreground">
                        {phase.duration_days} days
                      </span>
                    ) : null}
                  </div>
                  {phase.description && (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {phase.description}
                    </p>
                  )}
                  {(phase.resources ?? []).length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {phase.resources.map((r) => (
                        <li
                          key={r.id}
                          className="text-xs text-muted-foreground"
                        >
                          <span className="font-medium">{r.type}:</span>{" "}
                          {r.title}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <ConfirmDialog
        open={confirmDelete}
        onOpenChange={setConfirmDelete}
        title="Delete project?"
        description={`This permanently removes “${project.title}” and every student enrolment attached to it. This cannot be undone.`}
        confirmLabel="Delete"
        destructive
        pending={remove.isPending}
        onConfirm={() => remove.mutate()}
      />
    </div>
  );
}
