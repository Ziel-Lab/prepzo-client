import { Lock } from "lucide-react";

export function SecurityBadge() {
  return (
    <div className="flex items-center gap-2 text-white/60 text-sm">
      <Lock className="w-4 h-4" />
      <span>Bank-level encryption • Your data is 100% secure</span>
    </div>
  );
}
