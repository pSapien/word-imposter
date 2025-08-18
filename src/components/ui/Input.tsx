import { forwardRef } from "react";
import { cn } from "../../utils/cn";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(({ className, label, error, ...props }, ref) => {
  return (
    <div className="w-full">
      {label && <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>}
      <input
        className={cn(
          "w-full px-4 py-3 rounded-xl border border-gray-300 bg-white/80 backdrop-blur-sm",
          "focus:outline-none focus:ring-4 focus:ring-blue-300 focus:border-blue-500",
          "transition-all duration-200 placeholder-gray-500",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          error && "border-red-500 focus:ring-red-300 focus:border-red-500",
          className
        )}
        ref={ref}
        {...props}
      />
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
});

Input.displayName = "Input";

export { Input };
