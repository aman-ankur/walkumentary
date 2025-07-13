"use client";

import { Suspense } from "react";
import CustomizePageContent from "./CustomizePageContent";

export default function CustomizePageWrapper() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-orange-50/20 flex items-center justify-center">Loading...</div>}>
      <CustomizePageContent />
    </Suspense>
  );
}