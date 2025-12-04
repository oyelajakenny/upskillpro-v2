"use client";
import React, { useEffect, useMemo, useRef, useState } from "react";
import "./RichTextEditor.css";
import "quill/dist/quill.snow.css";

const normalizeHtml = (html) =>
  (html || "")
    .replace(/>\s+</g, "><")
    .replace(/\s+/g, " ")
    .trim();

const RichTextEditor = ({
  value,
  onChange,
  placeholder = "Write your content here...",
  error = false,
  helperText = "",
  minHeight = 200,
  maxHeight = 500,
  disabled = false,
}) => {
  const editorContainerRef = useRef(null);
  const quillRef = useRef(null);
  const suppressChangeRef = useRef(false);
  const onChangeRef = useRef(onChange);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const modules = useMemo(
    () => ({
      toolbar: {
        container: [
          [{ header: [1, 2, 3, 4, 5, 6, false] }],
          ["bold", "italic", "underline", "strike"],
          [{ color: [] }, { background: [] }],
          [{ list: "ordered" }, { list: "bullet" }],
          [{ indent: "-1" }, { indent: "+1" }],
          [{ align: [] }],
          ["link", "image", "video"],
          ["blockquote", "code-block"],
          ["clean"],
        ],
      },
      clipboard: {
        matchVisual: false,
      },
    }),
    []
  );

  const formats = useMemo(
    () => [
      "header",
      "bold",
      "italic",
      "underline",
      "strike",
      "color",
      "background",
      "list",
      "bullet",
      "indent",
      "align",
      "link",
      "image",
      "video",
      "blockquote",
      "code-block",
    ],
    []
  );

  useEffect(() => {
    let isCancelled = false;
    let quillInstance = null;

    const initQuill = async () => {
      const Quill = (await import("quill")).default;
      if (!editorContainerRef.current || isCancelled) return;

      quillInstance = new Quill(editorContainerRef.current, {
        theme: "snow",
        modules,
        formats,
        placeholder,
      });

      if (value) {
        suppressChangeRef.current = true;
        quillInstance.clipboard.dangerouslyPasteHTML(0, value, "silent");
        suppressChangeRef.current = false;
      }

      quillInstance.on("text-change", () => {
        if (suppressChangeRef.current) return;
        const text = quillInstance.getText().trim();
        const html = quillInstance.root.innerHTML;
        const sanitized = text.length === 0 ? "" : html;
        onChangeRef.current?.(sanitized);
      });

      if (disabled) {
        quillInstance.enable(false);
      }

      quillRef.current = quillInstance;
      setIsReady(true);
    };

    initQuill();

    return () => {
      isCancelled = true;
      if (quillInstance) {
        quillInstance.off("text-change");
        const containerEl = editorContainerRef.current;
        if (containerEl) {
          const toolbar = containerEl.previousSibling;
          if (
            toolbar &&
            toolbar.classList &&
            toolbar.classList.contains("ql-toolbar")
          ) {
            toolbar.remove();
          }
          containerEl.innerHTML = "";
        }
        quillInstance = null;
      }
      quillRef.current = null;
      setIsReady(false);
    };
  }, [modules, formats, placeholder]);

  useEffect(() => {
    const quill = quillRef.current;
    if (!quill) return;

    const incoming = normalizeHtml(value || "");
    const current = normalizeHtml(quill.root.innerHTML);

    if (incoming === current) return;
    suppressChangeRef.current = true;
    const delta = quill.clipboard.convert(value || "");
    quill.setContents(delta, "silent");
    suppressChangeRef.current = false;
  }, [value]);

  useEffect(() => {
    const quill = quillRef.current;
    if (!quill) return;
    quill.enable(!disabled);
  }, [disabled]);

  useEffect(() => {
    const quill = quillRef.current;
    if (!quill) return;
    quill.root.dataset.placeholder = placeholder;
  }, [placeholder]);

  const renderLoadingState = () => (
    <div className="rich-text-editor-loading">
      <div className="loading-placeholder">
        <div className="loading-toolbar"></div>
        <div className="loading-content" style={{ minHeight: `${minHeight}px` }}></div>
      </div>
    </div>
  );

  return (
    <div className={`rich-text-editor-wrapper ${error ? "has-error" : ""}`}>
      <div
        className="rich-text-editor-container"
        style={{
          "--min-height": `${minHeight}px`,
          "--max-height": `${maxHeight}px`,
        }}
      >
        {!isReady && renderLoadingState()}
        <div
          ref={editorContainerRef}
          style={{ display: isReady ? "block" : "none" }}
        />
      </div>
      {helperText && (
        <p className={`helper-text ${error ? "error-text" : ""}`}>{helperText}</p>
      )}
    </div>
  );
};

export default RichTextEditor;
