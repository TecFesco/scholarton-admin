import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProjectService } from "@/Services/project.service";
import { fullName } from "@/Utils/format";
import { cn } from "@/lib/utils";
import type { Project, Student } from "@/Types";

/** Loose status → colour, tolerant of the main app's status vocabulary. */
function statusStyle(status?: string): string {
  const s = (status ?? "").toLowerCase();
  if (s.includes("complete")) return "border-success/20 bg-success/10 text-success";
  if (s.includes("progress") || s.includes("started"))
    return "border-warning/20 bg-warning/10 text-warning";
  return "text-muted-foreground";
}

function statusLabel(status?: string): string {
  if (!status) return "Not started";
  return status
    .replace(/[-_]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * The admin's student-POV of a project: pick one enrolled student and see their
 * live progress through the phases (status + percent), read-only. The admin is
 * not the student, so there are no submit/mark-complete actions — just a window
 * into where that student is.
 */
export function ProjectStudentView({
  project,
  students,
}: {
  project: Project;
  students: Student[];
}) {
  const [studentId, setStudentId] = useState<string>(
    students[0]?.student_id ?? ""
  );

  const enrollmentQuery = useQuery({
    queryKey: ["enrolled-by-student", studentId],
    queryFn: () => ProjectService.fetchEnrolledByStudent(studentId),
    enabled: !!studentId,
  });

  // The student's enrolment for THIS project, out of all their enrolments.
  const enrollment = useMemo(
    () =>
      (enrollmentQuery.data ?? []).find(
        (e) => e.project_id === project.project_id
      ),
    [enrollmentQuery.data, project.project_id]
  );

  // Prefer the phases carried on the enrolment (they match phase_states), fall
  // back to the project's own phases.
  const phases = enrollment?.project?.phases ?? project.phases ?? [];
  const phaseStates = enrollment?.phase_states ?? {};

  if (students.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
        No students are enrolled in this project yet.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end gap-4">
        <div className="space-y-2">
          <Label>Viewing as</Label>
          <Select value={studentId} onValueChange={setStudentId}>
            <SelectTrigger className="w-[260px]">
              <SelectValue placeholder="Select a student" />
            </SelectTrigger>
            <SelectContent>
              {students.map((s) => (
                <SelectItem key={s.student_id} value={s.student_id}>
                  {fullName(s)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {enrollment && typeof enrollment.progress === "number" && (
          <div className="text-sm text-muted-foreground">
            Overall progress:{" "}
            <span className="font-semibold text-foreground tabular-nums">
              {Math.round(enrollment.progress)}%
            </span>
          </div>
        )}
      </div>

      {enrollmentQuery.isLoading ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading progress…
        </div>
      ) : !enrollment ? (
        <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          This student has no enrolment record for this project.
        </div>
      ) : (
        <div className="space-y-3">
          {phases.map((phase, index) => {
            const state = phaseStates[phase.id];
            return (
              <div
                key={phase.id ?? index}
                className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-4"
              >
                <div className="min-w-0">
                  <p className="font-medium text-foreground">
                    {index + 1}. {phase.title}
                  </p>
                  {typeof state?.progress === "number" && (
                    <p className="text-xs text-muted-foreground tabular-nums">
                      {Math.round(state.progress)}% complete
                    </p>
                  )}
                </div>
                <Badge
                  variant="outline"
                  className={cn("text-[10px] font-medium", statusStyle(state?.status))}
                >
                  {statusLabel(state?.status)}
                </Badge>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
