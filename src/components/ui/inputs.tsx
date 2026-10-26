import type { ComponentPropsWithoutRef } from "react";

/**
 * Unstyled-but-consistent inputs. React 19 passes `ref` as a regular
 * prop, so no `forwardRef` wrapper is needed; react-hook-form's
 * `register()` return value (including its ref callback) spreads
 * straight onto these elements.
 *
 * Styling is deliberately shared: a validation state change never
 * means restyling one input by hand.
 */

const inputClassName =
  "w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600/30 disabled:cursor-not-allowed disabled:bg-gray-100";

export function TextInput(props: ComponentPropsWithoutRef<"input">) {
  return <input {...props} className={`${inputClassName} ${props.className ?? ""}`.trim()} />;
}

export function SelectInput(props: ComponentPropsWithoutRef<"select">) {
  return <select {...props} className={`${inputClassName} ${props.className ?? ""}`.trim()} />;
}

export function CheckboxInput(props: ComponentPropsWithoutRef<"input">) {
  return (
    <input
      type="checkbox"
      {...props}
      className={`h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600 ${props.className ?? ""}`.trim()}
    />
  );
}
