import { forwardRef } from "react";
import { cn } from "@app/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  name: string;
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({ className, label, error, name, ...props }, ref) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor={name}>
          {label}
        </label>
      )}
      <input
        id={name}
        name={name}
        className={cn(
          "w-full px-4 py-3 rounded-xl border border-gray-300 bg-white/80 backdrop-blur-sm",
          "focus:outline-none focus:ring-4 focus:ring-blue-300 focus:border-blue-500",
          "transition-all duration-200 placeholder-gray-500",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          error && "border-red-500 focus:ring-red-500 focus:border-red-500",
          className
        )}
        ref={ref}
        {...props}
      />
      {/* Reserve space for error, such that whenever their is error it does not shift layout */}
      <p
        className={cn(
          "mt-2 text-sm min-h-[1.25rem] transition-opacity duration-200", // ~line-height for one line of text
          error ? "opacity-100  text-red-600" : "text-transparent"
        )}
      >
        {error || "placeholder"}
      </p>
    </div>
  );
});
