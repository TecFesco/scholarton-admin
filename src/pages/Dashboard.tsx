import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { FolderKanban, UserCog, Users } from "lucide-react";
import { MetricCard } from "@/components/MetricCard";
import { SignupsChart } from "@/components/SignupsChart";
import { ProjectCard } from "@/components/ProjectCard";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  mentorLookup,
  useMentors,
  useProjects,
  useStudents,
} from "@/hooks/useAdminData";
import { useAdminName } from "@/hooks/useAdminName";
import { apiErrorMessage } from "@/Api/error-handling";
import { enrolmentCounts, toDate } from "@/Utils/format";

export default function Dashboard() {
  const navigate = useNavigate();
  const students = useStudents();
  const mentors = useMentors();
  const projects = useProjects();
  const adminName = useAdminName();

  const mentorsById = useMemo(
    () => mentorLookup(mentors.data),
    [mentors.data]
  );

  const enrolments = useMemo(
    () => enrolmentCounts(students.data),
    [students.data]
  );

  // Newest first where we have a timestamp; projects without created_at sort
  // to the back rather than jumbling in at an arbitrary position.
  const recentProjects = useMemo(() => {
    const list = [...(projects.data ?? [])];
    list.sort((a, b) => {
      const aTime = toDate(a.created_at)?.getTime() ?? 0;
      const bTime = toDate(b.created_at)?.getTime() ?? 0;
      return bTime - aTime;
    });
    // Three fills the xl:grid-cols-3 row exactly; the full list lives on the
    // Projects page.
    return list.slice(0, 3);
  }, [projects.data]);

  const failure = students.error ?? mentors.error ?? projects.error;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Welcome back, {adminName}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Students, mentors and projects across Scholarton.
        </p>
      </div>

      {failure && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {apiErrorMessage(failure, "Could not load dashboard data.")}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard
          title="Students"
          value={students.data?.length ?? 0}
          icon={Users}
          loading={students.isLoading}
          description="Enrolled learners"
          onClick={() => navigate("/students")}
        />
        <MetricCard
          title="Mentors"
          value={mentors.data?.length ?? 0}
          icon={UserCog}
          loading={mentors.isLoading}
          description="Active mentors"
          onClick={() => navigate("/mentors")}
        />
        <MetricCard
          title="Projects"
          value={projects.data?.length ?? 0}
          icon={FolderKanban}
          loading={projects.isLoading}
          description={`${
            projects.data?.filter((p) => p.publish).length ?? 0
          } published`}
          onClick={() => navigate("/projects")}
        />
      </div>

      <SignupsChart students={students.data} loading={students.isLoading} />

      <div>
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="text-lg font-semibold">Recent projects</h3>
          <Button variant="ghost" size="sm" onClick={() => navigate("/projects")}>
            View all
          </Button>
        </div>

        {projects.isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-56 w-full rounded-2xl" />
            ))}
          </div>
        ) : recentProjects.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            No projects yet.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {recentProjects.map((project) => (
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
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
