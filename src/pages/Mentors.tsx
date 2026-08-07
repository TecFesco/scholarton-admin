import { useEffect, useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2, BadgeCheck, BadgeAlert, Plus, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

import { SearchInput } from "@/components/SearchInput";
import { PersonCell } from "@/components/PersonCell";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { AddUserDialog } from "@/components/AddUserDialog";
import { Pagination } from "@/components/Pagination";
import { usePagination } from "@/hooks/usePagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
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
  const [addOpen, setAddOpen] = useState(false);
  const [approvalFilter, setApprovalFilter] = useState<
    "all" | "approved" | "pending"
  >("all");

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

  const approve = useMutation({
    mutationFn: ({ id, approved }: { id: string; approved: boolean }) =>
      MentorService.setApproved(id, approved),
    onSuccess: (_result, vars) => {
      toast.success(
        vars.approved ? "Mentor approved." : "Mentor approval revoked."
      );
      queryClient.invalidateQueries({ queryKey: queryKeys.mentors });
    },
    onError: (err) => {
      toast.error(apiErrorMessage(err, "Could not update approval."));
    },
  });

  const remove = useMutation({
    mutationFn: (id: string) => MentorService.remove(id),
    onSuccess: (result) => {
      toast.success(
        result.orphaned_projects
          ? `Mentor deleted. ${result.orphaned_projects} project${
              result.orphaned_projects === 1 ? " is" : "s are"
            } now unassigned.`
          : "Mentor deleted."
      );
      queryClient.invalidateQueries({ queryKey: queryKeys.mentors });
      setPendingDelete(null);
    },
    onError: (err) => {
      toast.error(apiErrorMessage(err, "Could not delete this mentor."));
    },
  });

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    let list = data ?? [];

    if (approvalFilter !== "all") {
      const wantApproved = approvalFilter === "approved";
      list = list.filter((m) => (m.approved === true) === wantApproved);
    }

    if (!term) return list;
    return list.filter((mentor) =>
      [fullName(mentor), mentor.email, mentor.title, ...(mentor.expertise ?? [])]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(term))
    );
  }, [data, search, approvalFilter]);

  const pagination = usePagination(filtered, 10);
  const { setPage } = pagination;
  useEffect(() => {
    setPage(1);
  }, [search, approvalFilter, setPage]);

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
        <div className="flex items-center gap-3">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search mentors…"
          />
          <Select
            value={approvalFilter}
            onValueChange={(value) =>
              setApprovalFilter(value as "all" | "approved" | "pending")
            }
          >
            <SelectTrigger className="w-[150px]" aria-label="Filter by approval">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All mentors</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => setAddOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add
          </Button>
        </div>
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
              <TableHead>Approval</TableHead>
              <TableHead>Email status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 4 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell colSpan={7}>
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
              pagination.pageItems.map((mentor) => (
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
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px] font-medium",
                        mentor.approved
                          ? "border-success/20 bg-success/10 text-success"
                          : "border-warning/20 bg-warning/10 text-warning"
                      )}
                    >
                      {mentor.approved ? "Approved" : "Pending"}
                    </Badge>
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
                    <div className="flex items-center justify-end gap-1">
                      {mentor.approved ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            approve.mutate({
                              id: mentor.mentor_id,
                              approved: false,
                            })
                          }
                          disabled={approve.isPending}
                          className="text-muted-foreground"
                        >
                          Revoke
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            approve.mutate({
                              id: mentor.mentor_id,
                              approved: true,
                            })
                          }
                          disabled={approve.isPending}
                          className="text-success hover:text-success"
                        >
                          <ShieldCheck className="mr-1 h-4 w-4" />
                          Approve
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Delete ${fullName(mentor)}`}
                        onClick={() => setPendingDelete(mentor)}
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {!isLoading && filtered.length > 0 && (
        <Pagination
          page={pagination.page}
          pageCount={pagination.pageCount}
          onPageChange={pagination.setPage}
          from={pagination.from}
          to={pagination.to}
          total={pagination.total}
          noun="mentor"
        />
      )}

      <AddUserDialog role="mentor" open={addOpen} onOpenChange={setAddOpen} />

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title="Delete mentor?"
        description={`This permanently deletes ${
          pendingDelete ? fullName(pendingDelete) : "this mentor"
        } and their sign-in account. They will no longer be able to log in. Projects they own are kept — students stay enrolled — but will show as unassigned. This cannot be undone.`}
        confirmLabel="Delete"
        destructive
        pending={remove.isPending}
        onConfirm={() => pendingDelete && remove.mutate(pendingDelete.mentor_id)}
      />
    </div>
  );
}
