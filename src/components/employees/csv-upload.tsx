"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";

interface CsvUploadProps {
  onSuccess: () => void;
}

export function CsvUpload({ onSuccess }: CsvUploadProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);

    const fd = new FormData();
    fd.append("file", file);

    const res = await fetch("/api/employees/import", {
      method: "POST",
      body: fd,
    });

    if (res.ok) {
      onSuccess();
    }
    setLoading(false);
    if (fileRef.current) fileRef.current.value = "";
  }

  return (
    <>
      <input
        ref={fileRef}
        type="file"
        accept=".csv"
        className="hidden"
        onChange={handleUpload}
      />
      <Button
        variant="outline"
        onClick={() => fileRef.current?.click()}
        disabled={loading}
      >
        <Upload className="mr-2 h-4 w-4" />
        {loading ? "Importing..." : "Import CSV"}
      </Button>
    </>
  );
}
