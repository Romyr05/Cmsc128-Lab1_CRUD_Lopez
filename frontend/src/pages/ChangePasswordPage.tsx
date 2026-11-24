import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { z } from "zod";
import { changePassword } from "@/api/auth";
import { changePasswordSchema } from "shared";
import { Button } from "@/components/ui/button";
import { AuthCard } from "@/components/shared/AuthCard";
import { FormField } from "@/components/shared/FormField";

// The server only needs current + new; the confirm field is a frontend-only
// typo check, so it's added here instead of in the shared schema.
const changePasswordFormSchema = changePasswordSchema
  .extend({ confirmPassword: z.string() })
  .refine((d) => d.newPassword === d.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

function ChangePasswordPage() {
  const navigate = useNavigate();
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm({
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
    validators: { onChange: changePasswordFormSchema },
    onSubmit: async ({ value }) => {
      setFormError(null);
      try {
        // confirmPassword stays on the frontend; the server gets only these two.
        await changePassword({
          currentPassword: value.currentPassword,
          newPassword: value.newPassword,
        });
        toast.success("Password updated.");
        navigate("/profile");
      } catch (err) {
        setFormError(err instanceof Error ? err.message : "Password change failed");
      }
    },
  });

  return (
    <AuthCard
      title="Change password"
      description="Enter your current password, then choose a new one."
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
        className="flex flex-col gap-4"
      >
        <form.Field name="currentPassword">
          {(field) => (
            <FormField
              id="currentPassword"
              label="Current password"
              type="password"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={field.handleChange}
              errors={field.state.meta.errors}
            />
          )}
        </form.Field>

        <form.Field name="newPassword">
          {(field) => (
            <FormField
              id="newPassword"
              label="New password"
              type="password"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={field.handleChange}
              errors={field.state.meta.errors}
            />
          )}
        </form.Field>

        <form.Field name="confirmPassword">
          {(field) => (
            <FormField
              id="confirmPassword"
              label="Confirm new password"
              type="password"
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
              {isSubmitting ? "Updating…" : "Change password"}
            </Button>
          )}
        </form.Subscribe>

        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => navigate("/profile")}
        >
          Cancel
        </Button>
      </form>
    </AuthCard>
  );
}

export default ChangePasswordPage;
