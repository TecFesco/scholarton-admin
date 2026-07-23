import { Clock, GraduationCap, Layers, Star, UserRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { fullName } from "@/Utils/format";
import type { Mentor, Project } from "@/Types";

interface ProjectCardProps {
  project: Project;
  mentor?: Mentor;
  /** Enrolled students, counted client-side — see Utils/format.enrolmentCounts. */
  enrolled?: number;
  actions?: React.ReactNode;
}

// Same three-tier vocabulary as the main app's ChooseProjectCard, restated
// with our tokens so it tracks dark mode.
const difficultyStyles: Record<string, string> = {
  Beginner:
    "bg-success/10 text-success border-success/20 dark:bg-success/15",
  Intermediate:
    "bg-warning/10 text-warning border-warning/20 dark:bg-warning/15",
  Advanced:
    "bg-destructive/10 text-destructive border-destructive/20 dark:bg-destructive/15",
};

export function ProjectCard({
  project,
  mentor,
  enrolled,
  actions,
}: ProjectCardProps) {
  const difficulty = project.difficulty ?? project.project_level;
  const phaseCount = project.phases?.length ?? 0;
  // Prefer the server's count when an endpoint supplied one (fetchByMentor
  // does), otherwise the count the caller derived from the students query.
  const enrolledCount = project.enrolled_count ?? enrolled;
  // The list endpoint omits the joined mentor, so fall back to the one the
  // caller resolved from the mentors query.
  const mentorName = project.mentor
    ? fullName(project.mentor)
    : mentor
      ? fullName(mentor)
      : null;

  return (
    <div className="flex h-full flex-col rounded-2xl border border-border bg-card p-6 transition-shadow duration-300 hover:shadow-lg">
      <div className="mb-2 flex items-start justify-between gap-3">
        <h3 className="text-lg font-bold leading-tight text-foreground">
          {project.title}
        </h3>
        {typeof project.rating === "number" && project.rating > 0 && (
          <div className="flex shrink-0 items-center gap-1 text-warning">
            <Star className="h-3.5 w-3.5 fill-current" />
            <span className="text-sm font-semibold tabular-nums">
              {project.rating.toFixed(1)}
            </span>
          </div>
        )}
      </div>

      {(project.subtitle || project.description) && (
        <p className="mb-4 line-clamp-2 text-sm text-muted-foreground">
          {project.subtitle || project.description}
        </p>
      )}

      {/* Mentor attribution — the piece the admin project view is really for. */}
      <div className="mb-4 flex items-center gap-2 text-sm">
        <UserRound className="h-4 w-4 shrink-0 text-muted-foreground" />
        {mentorName ? (
          <span className="truncate font-medium text-foreground">
            {mentorName}
          </span>
        ) : (
          <span className="text-muted-foreground">Unassigned</span>
        )}
      </div>

      <div className="mb-4 flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
        {project.duration && (
          <span className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            {project.duration}
          </span>
        )}
        <span className="flex items-center gap-1.5">
          <Layers className="h-3.5 w-3.5" />
          {phaseCount} {phaseCount === 1 ? "phase" : "phases"}
        </span>
        {typeof enrolledCount === "number" && (
          <span
            className="flex items-center gap-1.5"
            title={`${enrolledCount} ${
              enrolledCount === 1 ? "student" : "students"
            } enrolled`}
          >
            <GraduationCap className="h-3.5 w-3.5" />
            <span className="tabular-nums">{enrolledCount}</span>
          </span>
        )}
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
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
          <Badge variant="secondary" className="text-[10px] font-medium">
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

      {actions && <div className="mt-auto flex gap-2 pt-2">{actions}</div>}
    </div>
  );
}
