import Image from "next/image";

const LOGOS = {
  full: {
    src: "/brand/hope-logo-full.png",
    width: 2989,
    height: 1459,
    alt: "HOPE Christliches Sozialwerk",
  },
  mark: {
    src: "/brand/hope-logo-mark.png",
    width: 1565,
    height: 1459,
    alt: "HOPE Logo",
  },
} as const;

type HopeLogoProps = {
  variant?: keyof typeof LOGOS;
  className?: string;
  sizes?: string;
  priority?: boolean;
};

export function HopeLogo({
  variant = "full",
  className,
  sizes = "(max-width: 640px) 200px, 280px",
  priority = false,
}: HopeLogoProps) {
  const logo = LOGOS[variant];

  return (
    <Image
      src={logo.src}
      alt={logo.alt}
      width={logo.width}
      height={logo.height}
      className={className}
      sizes={sizes}
      priority={priority}
    />
  );
}
