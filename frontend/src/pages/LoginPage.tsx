import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { login } from "@/api/auth";
import { loginSchema } from "shared";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { AuthCard } from "@/components/shared/AuthCard";
import { FormField } from "@/components/shared/FormField";

function LoginPage() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const queryClient = useQueryClient();
  const [formError, setFormError] = useState<string | null>(null);

  const form = useForm({
    defaultValues: { email: "", password: "" },
    validators: { onChange: loginSchema },
    onSubmit: async ({ value }) => {
      setFormError(null);
      try {
        const user = await login(value);
        queryClient.clear(); // drop any previous user's cached tasks/lists
        setUser(user);
        navigate("/");
      } catch (err) {
        setFormError(err instanceof Error ? err.message : "Login failed");
      }
    },
  });

  return (
    <AuthCard
      title="Login to your account"
      description="Enter your email below to login to your account."
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

        <form.Field name="password">
          {(field) => (
            <FormField
              id="password"
              label="Password"
              type="password"
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={field.handleChange}
              errors={field.state.meta.errors}
              labelExtra={
                <Link
                  to="/forgot-password"
                  className="text-sm text-primary underline-offset-4 hover:underline"
                >
                  Forgot password?
                </Link>
              }
            />
          )}
        </form.Field>

        {formError && <p className="text-destructive text-sm">{formError}</p>}

        <form.Subscribe
          selector={(s) => ({ canSubmit: s.canSubmit, isSubmitting: s.isSubmitting })}
        >
          {({ canSubmit, isSubmitting }) => (
            <Button type="submit" className="w-full" disabled={!canSubmit || isSubmitting}>
              {isSubmitting ? "Logging in…" : "Login"}
            </Button>
          )}
        </form.Subscribe>
      </form>

      <p className="mt-4 text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link to="/register" className="text-primary underline-offset-4 hover:underline">
          Sign up
        </Link>
      </p>
    </AuthCard>
  );
}

export default LoginPage;
