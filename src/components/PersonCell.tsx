import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { fullName, initials } from "@/Utils/format";
import type { Mentor, Student } from "@/Types";

/** Avatar + name + email, shared by the students and mentors tables. */
export function PersonCell({ person }: { person: Partial<Student & Mentor> }) {
  return (
    <div className="flex items-center gap-3">
      <Avatar className="h-9 w-9 shrink-0">
        <AvatarImage src={person.avatar} alt="" />
        <AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">
          {initials(person)}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <p className="truncate font-medium text-foreground">
          {fullName(person)}
        </p>
        {person.email && (
          <p className="truncate text-xs text-muted-foreground">
            {person.email}
          </p>
        )}
      </div>
    </div>
  );
}
