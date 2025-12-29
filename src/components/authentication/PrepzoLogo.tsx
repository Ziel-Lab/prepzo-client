import { Sparkles } from "lucide-react";

export function PrepzoLogo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
        <Sparkles className="w-6 h-6 text-white" />
      </div>
      <span className="text-2xl font-bold text-white tracking-tight">
        Prepzo<span className="text-green-300">.ai</span>
      </span>
    </div>
  );
}

export function PrepzoLogoDark({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
        <Sparkles className="w-6 h-6 text-primary-foreground" />
      </div>
      <span className="text-2xl font-bold text-foreground tracking-tight">
        Prepzo<span className="text-primary">.ai</span>
      </span>
    </div>
  );
}
