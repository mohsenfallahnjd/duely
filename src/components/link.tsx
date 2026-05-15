import NextLink from "next/link";
import { forwardRef } from "react";
import type { ComponentProps } from "react";
import { cn } from "@/lib/cn";

export type AppLinkProps = ComponentProps<typeof NextLink> & {
  className?: string;
};

export const Link = forwardRef<HTMLAnchorElement, AppLinkProps>(
  function Link({ className, ...props }, ref) {
    return <NextLink ref={ref} className={cn(className)} {...props} />;
  },
);
