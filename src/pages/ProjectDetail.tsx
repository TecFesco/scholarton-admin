import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ProjectMentorView } from "@/components/ProjectMentorView";
import { ProjectStudentView } from "@/components/ProjectStudentView";
import { mentorLookup, queryKeys, useMentors, useStudents } from "@/hooks/useAdminData";
import { ProjectService } from "@/Services/project.service";
import { apiErrorMessage } from "@/Api/error-handling";
import { fullName } from "@/Utils/format";
import { useViewMode } from "@/hooks/useViewMode";
import { cn } from "@/lib/utils";

export default function ProjectDetail() {
  const { id = "" } = useParams();
  const mentors = useMentors();
  const students = useStudents();
  // Reuse the persistent view-mode hook for the POV toggle: "card" = mentor,
  // "list" = student. (Two stored values, same machinery — no new primitive.)
  const [pov, setPov] = useViewMode("project-pov", "card");

  const {
    data: project,
    isLoading,
    error,
  } = useQuery({
    queryKey: [...queryKeys.projects, id],
    queryFn: () => ProjectService.fetchById(id),
    enabled: !!id,
  });

  const mentorsById = useMemo(() => mentorLookup(mentors.data), [mentors.data]);

  const mentorName = useMemo(() => {
    if (!project) return null;
    if (project.mentor) return fullName(project.mentor);
    const m = project.mentor_id
      ? mentorsById.get(project.mentor_id)
      : undefined;
    return m ? fullName(m) : null;
  }, [project, mentorsById]);

  // Students enrolled in this project — the picker source for the student POV,
  // and a client-side enrolment count fallback.
  const enrolledStudents = useMemo(
    () =>
      (students.data ?? []).filter((s) =>
        (s.student_Project ?? []).some((e) => e?.project_id === id)
      ),
    [students.data, id]
  );

  const enrolledCount = project?.enrolled_count ?? enrolledStudents.length;

  return (
    <div className="space-y-6">
      <Link to="/projects">
        <Button variant="ghost" size="sm" className="text-muted-foreground">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to projects
        </Button>
      </Link>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-40 w-full rounded-xl" />
        </div>
      ) : error ? (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {apiErrorMessage(error, "Could not load this project.")}
        </div>
      ) : !project ? (
        <div className="rounded-xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
          Project not found.
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
                {project.title}
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Viewing this project from each side.
              </p>
            </div>

            {/* POV toggle */}
            <div
              className="inline-flex rounded-lg border border-border p-0.5"
              role="group"
              aria-label="Point of view"
            >
              {(
                [
                  { key: "card", label: "Mentor POV" },
                  { key: "list", label: "Student POV" },
                ] as const
              ).map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setPov(key)}
                  aria-pressed={pov === key}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                    pov === key
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {pov === "card" ? (
            <ProjectMentorView
              project={project}
              mentorName={mentorName}
              enrolled={enrolledCount}
            />
          ) : (
            <ProjectStudentView project={project} students={enrolledStudents} />
          )}
        </>
      )}
    </div>
  );
}
