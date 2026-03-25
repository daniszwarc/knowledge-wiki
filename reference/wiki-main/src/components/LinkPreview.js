import { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";

export default function LinkPreview({ href, previews, children }) {
  const [visible, setVisible] = useState(false);
  const timeoutRef = useRef(null);
  const wrapperRef = useRef(null);
  const [above, setAbove] = useState(false);

  const slug = href.replace(/^\//, "");
  const preview = previews[slug];

  useEffect(() => {
    return () => clearTimeout(timeoutRef.current);
  }, []);

  const show = useCallback(() => {
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      if (wrapperRef.current) {
        const rect = wrapperRef.current.getBoundingClientRect();
        setAbove(window.innerHeight - rect.bottom < 160);
      }
      setVisible(true);
    }, 300);
  }, []);

  const hide = useCallback(() => {
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => setVisible(false), 150);
  }, []);

  if (!preview) {
    return (
      <Link href={href} className="wiki-link">
        {children}
      </Link>
    );
  }

  return (
    <span
      ref={wrapperRef}
      className="link-preview-wrapper"
      onMouseEnter={show}
      onMouseLeave={hide}
    >
      <Link href={href} className="wiki-link">
        {children}
      </Link>
      {visible && (
        <span
          className={`link-preview-popup ${above ? "link-preview-above" : "link-preview-below"}`}
          onMouseEnter={() => clearTimeout(timeoutRef.current)}
          onMouseLeave={hide}
        >
          <span className="link-preview-title">{preview.title}</span>
          <span className="link-preview-description">{preview.description}</span>
        </span>
      )}
    </span>
  );
}
