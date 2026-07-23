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
import { queryKeys, useStudents } from "@/hooks/useAdminData";
import { StudentService } from "@/Services/student.service";
import { apiErrorMessage } from "@/Api/error-handling";
import { formatDate, fullName } from "@/Utils/format";
import type { Student } from "@/Types";

export default function Students() {
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useStudents();
  const [search, setSearch] = useState("");
  const [pendingDelete, setPendingDelete] = useState<Student | null>(null);

  const remove = useMutation({
    mutationFn: (id: string) => StudentService.remove(id),
    onSuccess: () => {
      toast.success("Student deleted.");
      queryClient.invalidateQueries({ queryKey: queryKeys.students });
      setPendingDelete(null);
    },
    onError: (err) => {
      toast.error(apiErrorMessage(err, "Could not delete this student."));
    },
  });

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    const list = data ?? [];
    if (!term) return list;
    return list.filter((student) =>
      [fullName(student), student.email, student.class_level]
        .filter(Boolean)
        .some((field) => String(field).toLowerCase().includes(term))
    );
  }, [data, search]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Students
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            All enrolled learners and their current projects.
          </p>
        </div>
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search students…"
        />
      </div>

      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {apiErrorMessage(error, "Could not load students.")}
        </div>
      )}

      <div className="rounded-xl border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Grade</TableHead>
              <TableHead>Projects</TableHead>
              <TableHead>Email status</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 5 }).map((_, index) => (
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
                  {search ? "No students match your search." : "No students yet."}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((student) => {
                const projectCount = student.student_Project?.length ?? 0;
                return (
                  <TableRow key={student.student_id}>
                    <TableCell>
                      <PersonCell person={student} />
                    </TableCell>
                    <TableCell>
                      {student.class_level ? (
                        <Badge variant="secondary">{student.class_level}</Badge>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="tabular-nums">
                      {projectCount}
                    </TableCell>
                    <TableCell>
                      {student.email_verified ? (
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
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(student.created_at)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label={`Delete ${fullName(student)}`}
                        onClick={() => setPendingDelete(student)}
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => !open && setPendingDelete(null)}
        title="Delete student?"
        description={`This permanently removes ${
          pendingDelete ? fullName(pendingDelete) : "this student"
        } from Scholarton. Their Firebase Auth account is not affected.`}
        confirmLabel="Delete"
        destructive
        pending={remove.isPending}
        onConfirm={() =>
          pendingDelete && remove.mutate(pendingDelete.student_id)
        }
      />
    </div>
  );
}
