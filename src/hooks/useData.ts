"use client";
import { useDashboardData } from "@/components/DataProvider";

/** Shared dashboard state. It intentionally has no polling timer. */
export function useData() { return useDashboardData(); }
