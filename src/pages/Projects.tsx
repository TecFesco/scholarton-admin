import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";

import { SearchInput } from "@/components/SearchInput";
import { ProjectCard } from "@/components/ProjectCard";
import { ProjectsTable } from "@/components/ProjectsTable";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Pagination } from "@/components/Pagination";
import { ViewToggle } from "@/components/ViewToggle";
import { useViewMode } from "@/hooks/useViewMode";
import { usePagination } from "@/hooks/usePagination";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  mentorLookup,
  queryKeys,
  useMentors,
  useProjects,
  useStudents,
} from "@/hooks/useAdminData";
import { ProjectService } from "@/Services/project.service";
import { apiErrorMessage } from "@/Api/error-handling";
import { enrolmentCounts, fullName } from "@/Utils/format";
import type { Project } from "@/Types";

type StatusFilter = "all" | "published" | "draft";

export default function Projects() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useProjects();
  const mentors = useMentors();
  const students = useStudents();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<StatusFilter>("all");
  const [pendingDelete, setPendingDelete] = useState<Project | null>(null);
  const [view, setView] = useViewMode("projects-view");

  const mentorsById = useMemo(() => mentorLookup(mentors.data), [mentors.data]);

  const enrolments = useMemo(
    () => enrolmentCounts(students.data),
    [students.data]
  );

  const remove = useMutation({
    mutationFn: (id: string) => ProjectService.remove(id),
    onSuccess: () => {
      toast.success("Project deleted.");
      queryClient.invalidateQueries({ queryKey: queryKeys.projects });
      setPendingDelete(null);
    },
    onError: (err) => {
      toast.error(apiErrorMessage(err, "Could not delete this project."));
    },
  });

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    let list = data ?? [];

    if (status !== "all") {
      const wantPublished = status === "published";
      list = list.filter((project) => Boolean(project.publish) === wantPublished);
    }

    if (!term) return list;

    return list.filter((project) => {
      const mentor = project.mentor_id
        ? mentorsById.get(project.mentor_id)
        : undefined;
      return [
        project.title,
        project.category,
        project.subtitle,
        mentor ? fullName(mentor) : "",
        ...(project.tags ?? []),
      ]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(term));
    });
  }, [data, search, status, mentorsById]);

  // Cards tile 3-up, so a multiple of 3 fills rows cleanly; the denser list
  // can show a few more per page.
  const pageSize = view === "card" ? 9 : 12;
  const pagination = usePagination(filtered, pageSize);
  const { setPage } = pagination;

  // Jump back to the first page whenever the result set is re-scoped, so a
  // narrowing search doesn't leave the user staring at a stale later page.
  useEffect(() => {
    setPage(1);
  }, [search, status, view, setPage]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Projects
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Every project posted, with the mentor running it.
        </p>
      </div>

      {/* One filter row above everything it scopes, not per-card controls. */}
      <div className="flex flex-wrap items-center gap-3">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search projects or mentors…"
        />
        <Select
          value={status}
          onValueChange={(value) => setStatus(value as StatusFilter)}
        >
          <SelectTrigger className="w-[160px]" aria-label="Filter by status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
          </SelectContent>
        </Select>
        {!isLoading && (
          <span className="text-sm text-muted-foreground">
            {filtered.length} {filtered.length === 1 ? "project" : "projects"}
          </span>
        )}
        <div className="ml-auto">
          <ViewToggle value={view} onChange={setView} />
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {apiErrorMessage(error, "Could not load projects.")}
        </div>
      )}

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-64 w-full rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
          {search || status !== "all"
            ? "No projects match these filters."
            : "No projects yet."}
        </div>
      ) : (
        <div className="space-y-6">
          {view === "card" ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {pagination.pageItems.map((project) => (
                <ProjectCard
                  key={project.project_id}
                  project={project}
                  onOpen={() => navigate(`/projects/${project.project_id}`)}
                  mentor={
                    project.mentor_id
                      ? mentorsById.get(project.mentor_id)
                      : undefined
                  }
                  enrolled={enrolments.get(project.project_id) ?? 0}
                  actions={
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPendingDelete(project)}
                      // On dark the outlined chip reads as a harsh red slab
                      // against the card, so it drops to bare icon + label
                      // there and leans on a colour shift for hover feedback
                      // instead of a fill.
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive dark:border-transparent dark:bg-transparent dark:px-0 dark:hover:bg-transparent dark:hover:text-destructive/75"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </Button>
                  }
                />
              ))}
            </div>
          ) : (
            <ProjectsTable
              projects={pagination.pageItems}
              mentorsById={mentorsById}
              enrolments={enrolments}
              onDelete={setPendingDelete}
              onOpen={(project) => navigate(`/projects/${project.project_id}`)}
            />
          )}

          <Pagination
            page={pagination.page}
            pageCount={pagination.pageCount}
            onPageChange={pagination.setPage}
            from={pagination.from}
            to={pagination.to}
            total={pagination.total}
            noun="project"
          />
        </div>
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title="Delete project?"
        description={`This permanently removes “${
          pendingDelete?.title ?? "this project"
        }” and every student enrolment attached to it.`}
        confirmLabel="Delete"
        destructive
        pending={remove.isPending}
        onConfirm={() =>
          pendingDelete && remove.mutate(pendingDelete.project_id)
        }
      />
    </div>
  );
}
