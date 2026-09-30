import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { updateProfile } from "@/api/auth";
import { updateProfileSchema } from "@/lib/authSchema";
import { useAuth } from "@/context/AuthContext";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function ProfilePage() {
  const navigate = useNavigate();
  const { user, setUser } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm({
    // Pre-fill with the current user so the form shows existing values.
    defaultValues: { name: user?.name ?? "", email: user?.email ?? "" },
    validators: { onChange: updateProfileSchema },
    onSubmit: async ({ value }) => {
      setFormError(null);
      try {
        const updated = await updateProfile(value);
        // Refresh the context so the rest of the app sees the new values.
        setUser(updated);
        toast.success("Profile updated.");
      } catch (err) {
        setFormError(err instanceof Error ? err.message : "Profile update failed");
      }
    },
  });

  return (
    <div className="flex min-h-svh items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Update your account details.</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              form.handleSubmit();
            }}
            className="flex flex-col gap-4"
          >
            <form.Field name="name">
              {(field) => (
                <div className="grid gap-2">
                  <Label htmlFor="name">Display name</Label>
                  <Input
                    id="name"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                  {field.state.meta.errors.length > 0 && (
                    <p className="text-destructive text-sm">
                      {field.state.meta.errors.map((e) => e?.message).join(", ")}
                    </p>
                  )}
                </div>
              )}
            </form.Field>

            <form.Field name="email">
              {(field) => (
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                  {field.state.meta.errors.length > 0 && (
                    <p className="text-destructive text-sm">
                      {field.state.meta.errors.map((e) => e?.message).join(", ")}
                    </p>
                  )}
                </div>
              )}
            </form.Field>

            {formError && <p className="text-destructive text-sm">{formError}</p>}

            <form.Subscribe
              selector={(s) => ({ canSubmit: s.canSubmit, isSubmitting: s.isSubmitting })}
            >
              {({ canSubmit, isSubmitting }) => (
                <Button type="submit" className="w-full" disabled={!canSubmit || isSubmitting}>
                  {isSubmitting ? "Saving…" : "Save changes"}
                </Button>
              )}
            </form.Subscribe>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => navigate(-1)}
            >
              Go back
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default ProfilePage;
