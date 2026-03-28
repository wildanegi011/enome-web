"use client";

import dynamic from "next/dynamic";

const IntegratedCollectionSlider = dynamic(
  () => import("@/components/store/home/IntegratedCollectionSlider"),
  {
    ssr: false,
    loading: () => <div className="h-screen w-full bg-white animate-pulse" />
  }
);

export default function LazyIntegratedCollectionSlider() {
  return <IntegratedCollectionSlider />;
}
