"use client";

import { useState } from "react";
import Image, { ImageProps } from "next/image";

type SafeImageProps = ImageProps;

export default function SafeImage({ src, alt, ...props }: SafeImageProps) {
  const [error, setError] = useState(false);

  return (
    <Image
      src={error ? "/placeholder.svg" : src}
      alt={alt}
      onError={() => setError(true)}
      {...props}
    />
  );
}
