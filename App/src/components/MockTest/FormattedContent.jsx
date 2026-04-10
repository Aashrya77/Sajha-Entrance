import React, { useEffect, useRef } from "react";
import renderMathInElement from "katex/dist/contrib/auto-render";
import "katex/dist/katex.min.css";

const FormattedContent = ({
  html,
  emptyText = "",
  className = "",
  style = {},
}) => {
  const contentRef = useRef(null);

  useEffect(() => {
    if (!contentRef.current) {
      return;
    }

    try {
      renderMathInElement(contentRef.current, {
        delimiters: [
          { left: "$$", right: "$$", display: true },
          { left: "\\[", right: "\\]", display: true },
          { left: "$", right: "$", display: false },
          { left: "\\(", right: "\\)", display: false },
        ],
        throwOnError: false,
      });
    } catch (error) {
      // Keep content readable even if a formula is malformed.
    }
  }, [html]);

  if (!html) {
    return emptyText ? (
      <span className={className} style={style}>
        {emptyText}
      </span>
    ) : null;
  }

  return (
    <div
      ref={contentRef}
      className={className}
      style={style}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};

export default FormattedContent;
