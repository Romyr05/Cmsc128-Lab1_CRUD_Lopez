import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { register } from "@/api/auth";
import { registerSchema } from "@/lib/authSchema";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { AuthCard } from "@/components/shared/AuthCard";
import { FormField } from "@/components/shared/FormField";

function RegisterPage() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const queryClient = useQueryClient();
  const [formError, setFormError] = useState<string | null>(null);


  const form = useForm({
    defaultValues: { name: "", email: "", password: "" },
    validators: { onChange: registerSchema },  //zod validator
    onSubmit: async ({ value }) => {
      setFormError(null);
      try {
        const user = await register(value);
        // register starts a session, so log in immediately.
        queryClient.clear(); // drop any previous user's cached tasks/lists
        setUser(user);
        navigate("/");
      } catch (err) {
        setFormError(err instanceof Error ? err.message : "Registration failed");
      }
    },
  });

  return (
    <AuthCard title="Create an account" description="Enter your details to get started.">
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
            />
          )}
        </form.Field>

        {formError && <p className="text-destructive text-sm">{formError}</p>}

        <form.Subscribe
          selector={(s) => ({ canSubmit: s.canSubmit, isSubmitting: s.isSubmitting })}
        >
          {({ canSubmit, isSubmitting }) => (
            <Button type="submit" className="w-full" disabled={!canSubmit || isSubmitting}>
              {isSubmitting ? "Creating account…" : "Create account"}
            </Button>
          )}
        </form.Subscribe>
      </form>

      <p className="mt-4 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link to="/login" className="text-primary underline-offset-4 hover:underline">
          Login
        </Link>
      </p>
    </AuthCard>
  );
}

export default RegisterPage;
