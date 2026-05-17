import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Bullshit HQ",
  description:
    "Charts and playful stats for impulse spend tagged Bullshit in PayMay.",
};

export default function BullshitLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return children;
}
