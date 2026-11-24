import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { forgotPassword } from "@/api/auth";
import { forgotPasswordSchema } from "@/lib/authSchema";
import { Button } from "@/components/ui/button";
import { AuthCard } from "@/components/shared/AuthCard";
import { FormField } from "@/components/shared/FormField";

function ForgotPasswordPage() {
  const [formError, setFormError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const form = useForm({
    defaultValues: { email: "" },
    validators: { onChange: forgotPasswordSchema },
    onSubmit: async ({ value }) => {
      setFormError(null);
      try {
        await forgotPassword(value);
        setSent(true);
        toast.success("If that email exists, a reset link was sent.");
      } catch (err) {
        setFormError(err instanceof Error ? err.message : "Request failed");
      }
    },
  });

  return (
    <AuthCard
      title="Forgot password"
      description="Enter your email and we'll send you reset instructions."
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
        className="flex flex-col gap-4"
      >
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
        {sent && (
          <p className="text-sm text-muted-foreground">
            Check your email for a reset link. It expires in 1 hour.
          </p>
        )}

        <form.Subscribe
          selector={(s) => ({ canSubmit: s.canSubmit, isSubmitting: s.isSubmitting })}
        >
          {({ canSubmit, isSubmitting }) => (
            <Button type="submit" className="w-full" disabled={!canSubmit || isSubmitting}>
              {isSubmitting ? "Sending…" : "Send reset link"}
            </Button>
          )}
        </form.Subscribe>
      </form>

      <p className="mt-4 text-center text-sm text-muted-foreground">
        Remembered it?{" "}
        <Link to="/login" className="text-primary underline-offset-4 hover:underline">
          Login
        </Link>
      </p>
    </AuthCard>
  );
}

export default ForgotPasswordPage;
