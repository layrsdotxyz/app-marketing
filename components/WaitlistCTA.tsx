"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface WaitlistStatus {
  id: string;
  referral_code: string | null;
  email: string;
}

export function WaitlistCTA() {
  const router = useRouter();
  const [waitlistStatus, setWaitlistStatus] = useState<WaitlistStatus | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const email = localStorage.getItem("waitlist_email");
    const referralLink = localStorage.getItem("waitlist_referral_link");
    if (email) {
      setWaitlistStatus({ id: email, referral_code: referralLink, email });
    }
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return (
      <div
        className="text-cta absolute text-[10px] sm:text-xs uppercase tracking-[0.14em] pointer-events-auto"
        style={{
          bottom: "15%",
          left: "50%",
          transform: "translateX(-50%)",
          color: "rgba(200, 190, 150, 0.4)",
        }}
      >
        ...
      </div>
    );
  }

  return (
    <div
      className="text-cta absolute text-[10px] sm:text-xs uppercase tracking-[0.14em] cursor-pointer pointer-events-auto transition-colors duration-200 hover:text-amber-300 text-center"
      style={{
        bottom: "15%",
        left: "50%",
        transform: "translateX(-50%)",
        color: waitlistStatus
          ? "rgba(43, 213, 118, 0.8)"
          : "rgba(200, 190, 150, 0.7)",
        animation: "ctaPulse 3s ease-in-out infinite",
        animationDelay: "0.75s",
      }}
      onClick={() => router.push("/waitlist")}
    >
      {waitlistStatus ? (
        <div className="flex flex-col items-center gap-1">
          <span className="text-[10px] text-white/60">✓ WAITLISTED</span>
          <span className="text-[8px] text-white/40">
            ID: {waitlistStatus.id.slice(0, 8)}...
          </span>
          {waitlistStatus.referral_code && (
            <span className="text-[8px] text-amber-400/70">
              REF: {waitlistStatus.referral_code}
            </span>
          )}
        </div>
      ) : (
        "GET ACCESS →"
      )}
    </div>
  );
}
