import { GraduationCap, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { difficultyStyles } from "@/Utils/projectDisplay";
import { cn } from "@/lib/utils";
import { fullName } from "@/Utils/format";
import type { Mentor, Project } from "@/Types";

interface ProjectsTableProps {
  projects: Project[];
  mentorsById: Map<string, Mentor>;
  enrolments: Map<string, number>;
  onDelete: (project: Project) => void;
  onOpen?: (project: Project) => void;
}

/**
 * List/table rendering of projects — the same records the card grid shows, for
 * admins who want a denser scan. Column vocabulary (level, status, enrolled)
 * mirrors ProjectCard so the two views stay in sync.
 */
export function ProjectsTable({
  projects,
  mentorsById,
  enrolments,
  onDelete,
  onOpen,
}: ProjectsTableProps) {
  return (
    <div className="rounded-xl border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Project</TableHead>
            <TableHead>Mentor</TableHead>
            <TableHead>Level</TableHead>
            <TableHead className="text-right">Phases</TableHead>
            <TableHead className="text-right">Enrolled</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects.map((project) => {
            const difficulty = project.difficulty ?? project.project_level;
            const phaseCount = project.phases?.length ?? 0;
            const enrolledCount =
              project.enrolled_count ??
              enrolments.get(project.project_id) ??
              0;
            const mentor = project.mentor_id
              ? mentorsById.get(project.mentor_id)
              : undefined;
            const mentorName = project.mentor
              ? fullName(project.mentor)
              : mentor
                ? fullName(mentor)
                : null;

            return (
              <TableRow
                key={project.project_id}
                onClick={onOpen ? () => onOpen(project) : undefined}
                className={onOpen ? "cursor-pointer" : undefined}
              >
                <TableCell className="max-w-[280px]">
                  <p className="truncate font-medium text-foreground">
                    {project.title}
                  </p>
                  {(project.subtitle || project.description) && (
                    <p className="truncate text-xs text-muted-foreground">
                      {project.subtitle || project.description}
                    </p>
                  )}
                </TableCell>
                <TableCell>
                  {mentorName ? (
                    <span className="text-sm">{mentorName}</span>
                  ) : (
                    <span className="text-sm text-muted-foreground">
                      Unassigned
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  {difficulty ? (
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px] font-bold uppercase tracking-wider",
                        difficultyStyles[difficulty]
                      )}
                    >
                      {difficulty}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {phaseCount}
                </TableCell>
                <TableCell className="text-right">
                  <span
                    className="inline-flex items-center gap-1.5 tabular-nums"
                    title={`${enrolledCount} ${
                      enrolledCount === 1 ? "student" : "students"
                    } enrolled`}
                  >
                    <GraduationCap className="h-3.5 w-3.5 text-muted-foreground" />
                    {enrolledCount}
                  </span>
                </TableCell>
                <TableCell>
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
                </TableCell>
                <TableCell
                  className="text-right"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={`Delete ${project.title}`}
                    onClick={() => onDelete(project)}
                    className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
