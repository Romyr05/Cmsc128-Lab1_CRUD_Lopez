import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { updateProfile } from "@/api/auth";
import { updateProfileSchema } from "shared";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { AuthCard } from "@/components/shared/AuthCard";
import { FormField } from "@/components/shared/FormField";

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
    <AuthCard title="Profile" description="Update your account details.">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
        className="flex flex-col gap-4"
      >
        <form.Field name="name">
          {(field) => (
            <FormField
              id="name"
              label="Display name"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={field.handleChange}
              errors={field.state.meta.errors}
            />
          )}
        </form.Field>

        <form.Field name="email">
          {(field) => (
            <FormField
              id="email"
              label="Email"
              type="email"
              placeholder="you@example.com"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={field.handleChange}
              errors={field.state.meta.errors}
            />
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
          onClick={() => navigate("/change-password")}
        >
          Change password
        </Button>

        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => navigate(-1)}
        >
          Go back
        </Button>
      </form>
    </AuthCard>
  );
}

export default ProfilePage;
