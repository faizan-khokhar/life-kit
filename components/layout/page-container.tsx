import { cn } from "@/lib/utils";

type PageContainerProps = {
  children: React.ReactNode;
  className?: string;
};

export function PageContainer({ children, className }: PageContainerProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full max-w-3xl px-4 pt-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] lg:max-w-5xl lg:px-8 lg:pt-6 lg:pb-10",
        className
      )}
    >
      {children}
    </div>
  );
}
