import NextImage, { type ImageProps } from "next/image";
import { forwardRef } from "react";
import { cn } from "@/lib/cn";

export type AppImageProps = ImageProps & { className?: string };

export const Image = forwardRef<HTMLImageElement, AppImageProps>(
  function Image({ className, alt, ...props }, ref) {
    return (
      <NextImage
        ref={ref}
        className={cn(className)}
        alt={alt}
        {...props}
      />
    );
  },
);
