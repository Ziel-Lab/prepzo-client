import { Check, Users, CreditCard, Shield } from "lucide-react";

const badges = [
  { icon: Users, text: "800+ Professionals", subtext: "Practicing Today" },
  // { icon: CreditCard, text: "No Credit Card", subtext: "Required" },
  // { icon: Shield, text: "GDPR Compliant", subtext: "Secure" },
];

export function TrustBadges() {
  return (
    <div className="flex flex-wrap gap-3">
      {badges.map((badge, index) => (
        <div
          key={index}
          className="trust-badge flex items-center gap-2"
          style={{ animationDelay: `${0.3 + index * 0.1}s` }}
        >
          {/* Dynamically render icon based on badge.icon */}
          <badge.icon className="w-4 h-4 text-green-300" />
          <div className="flex flex-col">
            <span className="text-sm font-medium text-white">{badge.text}</span>
            <span className="text-xs opacity-75 text-white/70">{badge.subtext}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
