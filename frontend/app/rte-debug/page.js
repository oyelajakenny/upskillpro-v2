"use client";
import React, { useState } from "react";
import RichTextEditor from "@/components/RichTextEditor";

const RichTextEditorDebugPage = () => {
  const [content, setContent] = useState("");

  return (
    <div style={{ maxWidth: 800, margin: "2rem auto", padding: "1rem" }}>
      <h1
        style={{ fontSize: "1.5rem", fontWeight: "bold", marginBottom: "1rem" }}
      >
        Rich Text Editor Debug
      </h1>
      <RichTextEditor value={content} onChange={setContent} />
      <div style={{ marginTop: "1rem" }}>
        <h2 style={{ fontWeight: "600" }}>Preview</h2>
        <div dangerouslySetInnerHTML={{ __html: content }} />
      </div>
    </div>
  );
};

export default RichTextEditorDebugPage;
