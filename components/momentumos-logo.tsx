import Image from "next/image";
import { cn } from "@/lib/utils";

type MomentumOSLogoProps = {
  className?: string;
  width?: number;
};

export function MomentumOSLogo({ className = "", width = 220 }: MomentumOSLogoProps) {
  const height = Math.round((width / 1920) * 450);

  return (
    <div
      className={cn("relative block shrink-0 mx-auto", className)}
      style={{ width: `${width}px` }}
    >
      <Image
        alt="MomentumOS"
        className="block h-auto w-full"
        height={height}
        priority
        src="/momentumos-logo.png"
        width={width}
      />
    </div>
  );
}
