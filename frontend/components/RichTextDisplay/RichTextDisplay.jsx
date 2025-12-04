"use client";
import React, { useMemo } from "react";
import DOMPurify from "dompurify";
import "./RichTextDisplay.css";

/**
 * RichTextDisplay - Safely renders HTML content from the rich text editor
 * Uses DOMPurify to sanitize HTML and prevent XSS attacks
 */
const RichTextDisplay = ({
  content,
  className = "",
  fallbackText = "No description available.",
}) => {
  // Sanitize HTML content
  const sanitizedContent = useMemo(() => {
    if (!content || content.trim() === "") {
      return null;
    }

    // Check if content is just plain text (no HTML tags)
    const hasHtmlTags = /<[a-z][\s\S]*>/i.test(content);

    if (!hasHtmlTags) {
      // Wrap plain text in paragraph tags
      return `<p>${content}</p>`;
    }

    // Configure DOMPurify options
    const config = {
      ALLOWED_TAGS: [
        "h1",
        "h2",
        "h3",
        "h4",
        "h5",
        "h6",
        "p",
        "br",
        "strong",
        "b",
        "em",
        "i",
        "u",
        "s",
        "strike",
        "ul",
        "ol",
        "li",
        "a",
        "blockquote",
        "pre",
        "code",
        "img",
        "video",
        "iframe",
        "span",
        "div",
      ],
      ALLOWED_ATTR: [
        "href",
        "target",
        "rel",
        "src",
        "alt",
        "width",
        "height",
        "class",
        "style",
        "frameborder",
        "allowfullscreen",
        "allow",
      ],
      ALLOW_DATA_ATTR: false,
      ADD_ATTR: ["target"],
      // Force all links to open in new tab
      FORCE_BODY: true,
    };

    // Sanitize the content
    let clean = DOMPurify.sanitize(content, config);

    // Add target="_blank" and rel="noopener noreferrer" to all links for security
    clean = clean.replace(
      /<a /g,
      '<a target="_blank" rel="noopener noreferrer" '
    );

    return clean;
  }, [content]);

  if (!sanitizedContent) {
    return <p className="text-gray-500 italic">{fallbackText}</p>;
  }

  return (
    <div
      className={`rich-text-display ${className}`}
      dangerouslySetInnerHTML={{ __html: sanitizedContent }}
    />
  );
};

export default RichTextDisplay;
