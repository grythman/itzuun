"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

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
  const pathname = usePathname() || "";
  let fileName = "logo-";
  
  if (variant === "icon") {
    fileName = "logo-icon";
    if (theme === "dark") {
      fileName += "-dark";
    }
  } else {
    fileName += `${variant}-${theme}`;
  }

  const proxyPrefixMatch = pathname.match(/^\/(proxy\/\d+)(?:\/|$)/);
  const assetPrefix = proxyPrefixMatch ? `/${proxyPrefixMatch[1]}` : "";
  const src = `${assetPrefix}/images/${fileName}.svg?v=20260410`;

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
      unoptimized
    />
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }

  return content;
}
