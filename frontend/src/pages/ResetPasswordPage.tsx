import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { resetPassword } from "@/api/auth";
import { resetPasswordSchema } from "shared";
import { Button } from "@/components/ui/button";
import { AuthCard } from "@/components/shared/AuthCard";
import { FormField } from "@/components/shared/FormField";

// The form only has the password field; the token comes from the URL
const newPasswordSchema = resetPasswordSchema.omit({ token: true });

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm({
    defaultValues: { password: "" },
    validators: { onChange: newPasswordSchema },
    onSubmit: async ({ value }) => {
      setFormError(null);
      try {
        await resetPassword({ token, password: value.password });
        toast.success("Password updated. Please log in.");
        navigate("/login");
      } catch (err) {
        setFormError(err instanceof Error ? err.message : "Password reset failed");
      }
    },
  });

  // No token in the URL → the link is broken/incomplete.
  if (!token) {
    return (
      <AuthCard
        title="Invalid reset link"
        description="This link is missing its token. Request a new one."
      >
        <Link
          to="/forgot-password"
          className="text-sm text-primary underline-offset-4 hover:underline"
        >
          Back to forgot password
        </Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Set a new password" description="Enter a new password for your account.">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
        className="flex flex-col gap-4"
      >
        <form.Field name="password">
          {(field) => (
            <FormField
              id="password"
              label="New password"
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
              {isSubmitting ? "Updating…" : "Reset password"}
            </Button>
          )}
        </form.Subscribe>
      </form>
    </AuthCard>
  );
}

export default ResetPasswordPage;
