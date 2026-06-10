import Image from "next/image";

type MomentumOSLogoProps = {
  className?: string;
  width?: number;
};

export function MomentumOSLogo({ className = "", width = 220 }: MomentumOSLogoProps) {
  return (
    <Image
      alt="MomentumOS"
      className={className}
      height={48}
      priority
      src="/momentumos-logo.svg"
      width={width}
    />
  );
}
