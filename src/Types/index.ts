// Mirrors scholartonapi/functions/src/types/models.ts. Kept as a hand-written
// copy (rather than a shared package) to match how Scholarton-Frontend does it.

export const STUDENT_GRADES = [
  "JSS1",
  "JSS2",
  "JSS3",
  "SS1",
  "SS2",
  "SS3",
] as const;
export type StudentGrade = (typeof STUDENT_GRADES)[number];

export type ProjectDifficulty = "Beginner" | "Intermediate" | "Advanced";

export type PhaseStatus = "locked" | "upcoming" | "in-progress" | "completed";

export interface PhaseResource {
  id: string;
  title: string;
  type: "Video" | "Document" | "Link";
  link: string;
  isCompleted?: boolean;
}

export interface Phase {
  id: string;
  projectId?: string;
  title: string;
  description?: string;
  status: PhaseStatus;
  progress: number;
  dueDate?: string;
  duration_days?: number;
  started_at?: string;
  resources: PhaseResource[];
  isLocked: boolean;
}

export interface StudentProject {
  id?: string;
  project_id: string;
  student_id?: string;
  enrollment_date?: string;
  start_date?: string | null;
  end_date?: string | null;
  progress?: number;
  phase?: string | null;
  mentor_name?: string;
  [key: string]: unknown;
}

export interface Student {
  student_id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  class_level?: string;
  avatar?: string;
  email_verified?: boolean;
  phone_number?: string;
  dob?: string;
  gender?: string;
  address?: string;
  // NOTE: the API does not currently stamp created_at on student creation —
  // see the caveat in README.md. Treated as optional everywhere it is read.
  created_at?: string;
  updated_at?: string;
  // Attached by the API's fetchAll/findById: the student's enrolments.
  student_Project?: StudentProject[];
  [key: string]: unknown;
}

export interface Mentor {
  mentor_id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  title?: string;
  expertise?: string[];
  bio?: string;
  office_hours?: string;
  location?: string;
  avatar?: string;
  phone_number?: string;
  email_verified?: boolean;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
}

export interface Project {
  project_id: string;
  mentor_id?: string;
  title: string;
  category?: string;
  difficulty?: ProjectDifficulty;
  project_level?: ProjectDifficulty;
  phases?: Phase[];

  subtitle?: string;
  description?: string;
  detailedDescription?: string;
  overview?: string;
  tags?: string[];
  skills?: string[];
  objectives?: string[];
  duration?: string;
  rating?: number;
  mentorsCount?: number;
  publish?: boolean;
  enrolled_count?: number;

  created_at?: string;
  updated_at?: string;
  created_by_uid?: string;

  // Only populated by GET /project/published and GET /project/:id. The plain
  // list endpoint omits it, so the admin joins on mentor_id client-side.
  mentor?: Mentor;
  [key: string]: unknown;
}

/** Every API handler responds with `{ data: ... }`. */
export interface ApiEnvelope<T> {
  data: T;
  message?: string;
  error?: string;
}
