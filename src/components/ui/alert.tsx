import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const alertVariants = cva(
  "relative w-full rounded-2xl border p-4 text-xs [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground",
  {
    variants: {
      variant: {
        default: "bg-slate-900 border-slate-800 text-slate-100",
        destructive: "border-rose-900/50 bg-rose-950/60 text-rose-200 [&>svg]:text-rose-400",
        warning: "border-amber-900/50 bg-amber-950/60 text-amber-200 [&>svg]:text-amber-400",
        success: "border-emerald-900/50 bg-emerald-950/60 text-emerald-200 [&>svg]:text-emerald-400",
        stage1: "border-orange-800/60 bg-orange-950/40 text-orange-200 [&>svg]:text-orange-400",
        stage2: "border-rose-800/60 bg-rose-950/40 text-rose-200 [&>svg]:text-rose-400",
        stage3: "border-purple-800/60 bg-purple-950/40 text-purple-200 [&>svg]:text-purple-400",
        stage4: "border-fuchsia-700/80 bg-fuchsia-950/50 text-fuchsia-200 animate-pulse [&>svg]:text-fuchsia-300",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant, ...props }, ref) => (
  <div
    ref={ref}
    role="alert"
    className={cn(alertVariants({ variant }), className)}
    {...props}
  />
));
Alert.displayName = "Alert";

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={cn("mb-1 font-bold leading-none tracking-tight text-white", className)}
    {...props}
  />
));
AlertTitle.displayName = "AlertTitle";

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-xs text-slate-300 [&_p]:leading-relaxed", className)}
    {...props}
  />
));
AlertDescription.displayName = "AlertDescription";

export { Alert, AlertTitle, AlertDescription };
