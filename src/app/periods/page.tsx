"use client";
import { Suspense } from "react";
import TemporalExplorer from "@/components/TemporalExplorer";

function PeriodsContent() {
  return <TemporalExplorer />;
}

export default function PeriodsPage() {
  return (
    <Suspense fallback={<div className="min-h-[60vh] flex items-center justify-center"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>}>
      <PeriodsContent />
    </Suspense>
  );
}
