import { forwardRef } from "react";
import { cn } from "../../utils/cn";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "glass" | "elevated";
}

const Card = forwardRef<HTMLDivElement, CardProps>(({ className, variant = "default", ...props }, ref) => {
  const variants = {
    default: "bg-white border border-gray-200 shadow-md",
    glass: "bg-white/60 backdrop-blur-md border border-white/20 shadow-lg",
    elevated: "bg-white shadow-xl border border-gray-100",
  };

  return (
    <div ref={ref} className={cn("rounded-xl transition-all duration-200", variants[variant], className)} {...props} />
  );
});

const CardHeader = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pb-4", className)} {...props} />
));

const CardContent = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
));

const CardFooter = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-4", className)} {...props} />
));

export { Card, CardHeader, CardContent, CardFooter };
