import Image from "next/image";

type MomentumOSLogoProps = {
  className?: string;
  width?: number;
};

export function MomentumOSLogo({ className = "", width = 220 }: MomentumOSLogoProps) {
  const height = Math.round((width / 1920) * 450);

  return (
    <Image
      alt="MomentumOS"
      className={className}
      height={height}
      priority
      src="/momentumos-logo.png"
      width={width}
    />
  );
}
