"use client";

import React from "react";
import { useRouter } from "next/navigation";
import TalkToAgentLiveKit from "@/components/dashboard/TalkToAgent/TalkToAgentLiveKit";
import TalkToAgentAssistant from "@/components/dashboard/TalkToAgent/TalkToAgentAssistant";

export default function Page() {
  const router = useRouter();
  return (
    <TalkToAgentLiveKit>
      <TalkToAgentAssistant onExit={() => router.push("/dashboard")} />
    </TalkToAgentLiveKit>
  );
}


