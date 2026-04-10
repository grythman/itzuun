import Image from "next/image";
import Link from "next/link";

interface LogoProps {
  variant?: "horizontal" | "vertical" | "icon";
  theme?: "light" | "dark";
  className?: string;
  width?: number;
  height?: number;
  href?: string;
}

export function Logo({
  variant = "horizontal",
  theme = "light",
  className = "",
  width,
  height,
  href,
}: LogoProps) {
  let fileName = "logo-";
  
  if (variant === "icon") {
    fileName = "logo-icon";
    if (theme === "dark") {
      fileName += "-dark";
    }
  } else {
    fileName += `${variant}-${theme}`;
  }

  const src = `/images/${fileName}.svg`;

  // Default dimensions based on variant
  const defaultWidth = variant === "icon" ? 40 : variant === "vertical" ? 120 : 180;
  const defaultHeight = variant === "icon" ? 40 : variant === "vertical" ? 120 : 48;

  const content = (
    <Image
      src={src}
      alt="ITZuun Logo"
      width={width || defaultWidth}
      height={height || defaultHeight}
      className={`h-auto ${className}`}
      priority
    />
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}
