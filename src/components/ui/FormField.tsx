import { cloneElement, isValidElement, type ReactElement, type ReactNode } from "react";

interface FormFieldProps {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
}

/**
 * Accessible field wrapper: the label is always bound via `htmlFor`,
 * and the single child input is cloned with `aria-invalid` and
 * `aria-describedby` pointing at the hint/error messages, so a
 * screen reader announces the error for exactly the field it belongs
 * to. Every form control in this module goes through this wrapper so
 * an accessible label/error pair cannot be forgotten for one field.
 */
export function FormField({ id, label, error, hint, required, children }: FormFieldProps) {
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;
  const describedBy =
    [error ? errorId : null, hint ? hintId : null].filter(Boolean).join(" ") || undefined;

  const child = isValidElement(children)
    ? cloneElement(children as ReactElement<Record<string, unknown>>, {
        "aria-describedby": describedBy,
        "aria-invalid": Boolean(error),
      })
    : children;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-gray-900">
        {label}
        {required ? (
          <span aria-hidden="true" className="text-red-600">
            {" "}
            *
          </span>
        ) : null}
      </label>
      {child}
      {hint ? (
        <p id={hintId} className="text-xs text-gray-500">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} role="alert" className="text-sm text-red-600">
          {error}
        </p>
      ) : null}
    </div>
  );
}
