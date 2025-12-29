import { PrepzoLogo } from "./PrepzoLogo";
import { TrustBadges } from "./TrustBadges";
import  SocialProof  from "./SocialProof";
import { SecurityBadge } from "./SecurityBadge";
import Link from "next/link";
import Image from "next/image";

interface SignupLeftPanelProps {
  className?: string;
}

export function SignupLeftPanel({ className = "" }: SignupLeftPanelProps) {
  return (
    <div
      className={`glass-panel min-h-screen flex flex-col justify-between p-8 lg:p-12 ${className}`}
    >
      {/* Logo & Tagline */}
      <div className="mt-10">
        <div className="flex items-center mb-10">
          {/* <Link href="/" className="flex items-center"> */}
            <Image src="/static/images/footer-logo.svg" alt="Prepzo" width={140} height={140} />
            {/* <span className="text-2xl font-bold text-prepzo">Prepzo</span> */}
            {/* <span className="ml-2 text-xs py-0.5 px-2 bg-prepzo text-white rounded-full">Beta</span> */}
          {/* </Link> */}
        </div>
        
        <h1 className="text-3xl lg:text-4xl xl:text-5xl font-bold text-white leading-tight mb-6">
          Land Your{" "}
          <span className="text-green-300">Dream Job </span><br/>with AI-Powered <br/>Interview Practice
        </h1>
        
        <p className="text-white/70 text-lg mb-8 max-w-md">
          Practice interviews with AI, get instant feedback, and boost your confidence for the real thing.
        </p>
        
        {/* Trust Badges */}
        <TrustBadges />
        
        {/* Section Divider */}
        <div className="section-divider" />
      </div>
      
      {/* Middle - Social Proof */}
      <div className="flex-grow flex flex-col justify-center py-8 px-10">
        <SocialProof />
      </div>
      
      {/* Section Divider */}
      <div className="section-divider" />
      
      {/* Bottom - Security Badge */}
      <SecurityBadge />
    </div>
  );
}
