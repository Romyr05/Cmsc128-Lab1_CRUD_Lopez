import { useState } from "react";
import { useForm } from "@tanstack/react-form";
import { Link, useNavigate } from "react-router-dom";
import { register } from "@/api/auth";
import { registerSchema } from "@/lib/authSchema";
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

function RegisterPage() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const [formError, setFormError] = useState<string | null>(null);


  const form = useForm({
    defaultValues: { name: "", email: "", password: "" },
    validators: { onChange: registerSchema },  //zod validator
    onSubmit: async ({ value }) => {
      setFormError(null);
      try {
        const user = await register(value);
        // register starts a session, so log in immediately.
        setUser(user);
        navigate("/");
      } catch (err) {
        setFormError(err instanceof Error ? err.message : "Registration failed");
      }
    },
  });

  return (
    <div className="flex min-h-svh items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>Create an account</CardTitle>
          <CardDescription>Enter your details to get started.</CardDescription>
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

            <form.Field name="password">
              {(field) => (
                <div className="grid gap-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
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
        </CardContent>
      </Card>
    </div>
  );
}

export default RegisterPage;
