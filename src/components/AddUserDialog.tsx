import { useState, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { queryKeys } from "@/hooks/useAdminData";
import { StudentService } from "@/Services/student.service";
import { MentorService } from "@/Services/mentor.service";
import { apiErrorMessage } from "@/Api/error-handling";
import type { Mentor, Student } from "@/Types";

type Role = "student" | "mentor";

interface AddUserDialogProps {
  role: Role;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** A readable temp password: no ambiguous chars, mixed classes, ~12 long. */
function generatePassword(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const symbols = "!@#$%&*";
  const bytes = new Uint32Array(11);
  crypto.getRandomValues(bytes);
  const chars = Array.from(bytes, (n) => alphabet[n % alphabet.length]);
  // Guarantee at least one symbol so it clears any main-app strength rule.
  chars.push(symbols[bytes[0] % symbols.length]);
  return chars.join("");
}

const EMPTY = {
  first_name: "",
  last_name: "",
  email: "",
  password: "",
  class_level: "", // student
  title: "", // mentor
  expertise: "", // mentor, comma-separated
};

export function AddUserDialog({ role, open, onOpenChange }: AddUserDialogProps) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ ...EMPTY });

  const set = (key: keyof typeof EMPTY, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const reset = () => setForm({ ...EMPTY });

  const mutation = useMutation<Student | Mentor>({
    mutationFn: () => {
      const base = {
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        email: form.email.trim(),
        password: form.password,
      };
      if (role === "student") {
        return StudentService.provision({
          ...base,
          class_level: form.class_level.trim() || undefined,
        });
      }
      return MentorService.provision({
        ...base,
        title: form.title.trim() || undefined,
        expertise: form.expertise
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      });
    },
    onSuccess: () => {
      toast.success(
        `${role === "student" ? "Student" : "Mentor"} added. Share the temporary password with them so they can sign in.`
      );
      queryClient.invalidateQueries({
        queryKey: role === "student" ? queryKeys.students : queryKeys.mentors,
      });
      reset();
      onOpenChange(false);
    },
    onError: (err) => {
      toast.error(apiErrorMessage(err, "Could not add this user."));
    },
  });

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (mutation.isPending) return;
    if (!form.first_name.trim()) return toast.error("First name is required.");
    if (!form.email.trim()) return toast.error("Email is required.");
    if (form.password.length < 6) {
      return toast.error("Password must be at least 6 characters.");
    }
    mutation.mutate();
  };

  const copyPassword = async () => {
    if (!form.password) return;
    try {
      await navigator.clipboard.writeText(form.password);
      toast.success("Password copied.");
    } catch {
      toast.error("Couldn't copy — select and copy it manually.");
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            Add {role === "student" ? "student" : "mentor"}
          </DialogTitle>
          <DialogDescription>
            Creates a sign-in account and profile. Set a temporary password and
            share it — they can change it after their first login.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="first_name">First name</Label>
              <Input
                id="first_name"
                value={form.first_name}
                onChange={(e) => set("first_name", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">Last name</Label>
              <Input
                id="last_name"
                value={form.last_name}
                onChange={(e) => set("last_name", e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              required
            />
          </div>

          {role === "student" ? (
            <div className="space-y-2">
              <Label htmlFor="class_level">Grade</Label>
              <Input
                id="class_level"
                placeholder="e.g. SS2"
                value={form.class_level}
                onChange={(e) => set("class_level", e.target.value)}
              />
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="e.g. Software Engineer"
                  value={form.title}
                  onChange={(e) => set("title", e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expertise">Expertise</Label>
                <Input
                  id="expertise"
                  placeholder="Comma-separated, e.g. React, Design"
                  value={form.expertise}
                  onChange={(e) => set("expertise", e.target.value)}
                />
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="password">Temporary password</Label>
            <div className="flex gap-2">
              <Input
                id="password"
                // Visible on purpose: the admin has to read it back to the user.
                type="text"
                value={form.password}
                onChange={(e) => set("password", e.target.value)}
                placeholder="At least 6 characters"
                required
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label="Generate password"
                title="Generate a strong password"
                onClick={() => set("password", generatePassword())}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={copyPassword}
                disabled={!form.password}
              >
                Copy
              </Button>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={mutation.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Add {role}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
