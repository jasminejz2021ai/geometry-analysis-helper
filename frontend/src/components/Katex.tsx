import { useMemo } from "react";
import katex from "katex";

type Props = {
  math: string;
  displayMode?: boolean;
  className?: string;
};

export default function Katex({ math, displayMode = false, className }: Props) {
  const html = useMemo(() => {
    try {
      return katex.renderToString(math, {
        displayMode,
        throwOnError: false,
      });
    } catch {
      return math;
    }
  }, [math, displayMode]);

  return (
    <span
      className={className}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
