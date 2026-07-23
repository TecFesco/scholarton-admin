import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2, BadgeCheck, BadgeAlert } from "lucide-react";
import { toast } from "sonner";

import { SearchInput } from "@/components/SearchInput";
import { PersonCell } from "@/components/PersonCell";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { queryKeys, useMentors, useProjects } from "@/hooks/useAdminData";
import { MentorService } from "@/Services/mentor.service";
import { apiErrorMessage } from "@/Api/error-handling";
import { fullName } from "@/Utils/format";
import type { Mentor } from "@/Types";

export default function Mentors() {
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useMentors();
  const projects = useProjects();
  const [search, setSearch] = useState("");
  const [pendingDelete, setPendingDelete] = useState<Mentor | null>(null);

  // How many projects each mentor owns — cheaper than a per-mentor request to
  // GET /project/mentor/:id, since the projects list is already in cache.
  const projectCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const project of projects.data ?? []) {
      if (!project.mentor_id) continue;
      counts.set(project.mentor_id, (counts.get(project.mentor_id) ?? 0) + 1);
    }
    return counts;
  }, [projects.data]);

  const remove = useMutation({
    mutationFn: (id: string) => MentorService.remove(id),
    onSuccess: () => {
      toast.success("Mentor deleted.");
      queryClient.invalidateQueries({ queryKey: queryKeys.mentors });
      setPendingDelete(null);
    },
    onError: (err) => {
      toast.error(apiErrorMessage(err, "Could not delete this mentor."));
    },
  });

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    const list = data ?? [];
    if (!term) return list;
    return list.filter((mentor) =>
      [fullName(mentor), mentor.email, mentor.title, ...(mentor.expertise ?? [])]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(term))
    );
  }, [data, search]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Mentors
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Everyone guiding students through projects.
          </p>
        </div>
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search mentors…"
        />
      </div>

      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {apiErrorMessage(error, "Could not load mentors.")}
        </div>
      )}

      <div className="rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Expertise</TableHead>
              <TableHead>Projects</TableHead>
              <TableHead>Email status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell colSpan={6}>
                    <Skeleton className="h-10 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-12 text-center text-sm text-muted-foreground"
                >
                  {search ? "No mentors match your search." : "No mentors yet."}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((mentor) => (
                <TableRow key={mentor.mentor_id}>
                  <TableCell>
                    <PersonCell person={mentor} />
                  </TableCell>
                  <TableCell className="text-sm">
                    {mentor.title || (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {(mentor.expertise ?? []).slice(0, 2).map((skill) => (
                        <Badge
                          key={skill}
                          variant="secondary"
                          className="text-xs"
                        >
                          {skill}
                        </Badge>
                      ))}
                      {(mentor.expertise?.length ?? 0) > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{(mentor.expertise?.length ?? 0) - 2}
                        </Badge>
                      )}
                      {!mentor.expertise?.length && (
                        <span className="text-sm text-muted-foreground">—</span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="tabular-nums">
                    {projectCounts.get(mentor.mentor_id) ?? 0}
                  </TableCell>
                  <TableCell>
                    {mentor.email_verified ? (
                      <span className="inline-flex items-center gap-1.5 text-sm text-success">
                        <BadgeCheck className="h-4 w-4" />
                        Verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                        <BadgeAlert className="h-4 w-4" />
                        Unverified
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Delete ${fullName(mentor)}`}
                      onClick={() => setPendingDelete(mentor)}
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title="Delete mentor?"
        description={`This permanently removes ${
          pendingDelete ? fullName(pendingDelete) : "this mentor"
        } from Scholarton. Projects they own are not deleted and will show as unassigned.`}
        confirmLabel="Delete"
        destructive
        pending={remove.isPending}
        onConfirm={() => pendingDelete && remove.mutate(pendingDelete.mentor_id)}
      />
    </div>
  );
}
