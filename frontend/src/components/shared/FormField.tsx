import type { ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type FormFieldProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  errors: ({ message?: string } | undefined)[]; // field.state.meta.errors
  type?: string;
  placeholder?: string;
  labelExtra?: ReactNode; // shown right of the label (e.g. "Forgot password?" link)
};

// Label + Input + validation errors, used inside a form.Field render prop
export function FormField({
  id,
  label,
  value,
  onChange,
  onBlur,
  errors,
  type,
  placeholder,
  labelExtra,
}: FormFieldProps) {
  return (
    <div className="grid gap-2">
      {labelExtra ? (
        <div className="flex items-center justify-between">
          <Label htmlFor={id}>{label}</Label>
          {labelExtra}
        </div>
      ) : (
        <Label htmlFor={id}>{label}</Label>
      )}
      <Input
        id={id}
        type={type}
        placeholder={placeholder}
        value={value}
        onBlur={onBlur}
        onChange={(e) => onChange(e.target.value)}
      />
      {errors.length > 0 && (
        <p className="text-destructive text-sm">
          {errors.map((e) => e?.message).join(", ")}
        </p>
      )}
    </div>
  );
}
