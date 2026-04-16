"use client";

import { useMemo, useRef } from "react";
import { ExternalLink, FileText, Loader2, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useUploadMultipleImages } from "@/hooks/use-upload";

interface SingleFileUploadProps {
  value?: string;
  onChange: (url: string) => void;
  disabled?: boolean;
  className?: string;
  accept?: string;
  maxSizeMb?: number;
  mimeTypes?: string[];
  emptyTitle?: string;
  emptyHint?: string;
}

function getDisplayName(url: string) {
  const lastSegment = url.split("/").pop() || "document.pdf";
  const decoded = decodeURIComponent(lastSegment);
  return decoded.replace(/^[0-9a-f-]+-/, "");
}

export function SingleFileUpload({
  value = "",
  onChange,
  disabled = false,
  className,
  accept = ".pdf,application/pdf",
  maxSizeMb = 10,
  mimeTypes = ["application/pdf"],
  emptyTitle = "Upload a PDF document",
  emptyHint = "PDF only",
}: SingleFileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadMutation = useUploadMultipleImages();

  const fileName = useMemo(() => (value ? getDisplayName(value) : ""), [value]);

  const handleSelect = async (file?: File) => {
    if (!file) return;

    if (file.size > maxSizeMb * 1024 * 1024) {
      toast.error(`File size exceeds ${maxSizeMb}MB limit`);
      return;
    }

    if (mimeTypes.length > 0 && !mimeTypes.includes(file.type)) {
      toast.error("Please select a valid PDF document");
      return;
    }

    try {
      const results = await uploadMutation.mutateAsync([file]);
      const result = results[0];
      if (!result) {
        throw new Error("File upload failed");
      }
      onChange(result.data.url);
      toast.success("File uploaded successfully");
    } catch {
      // Upload hook already shows the user-facing error toast.
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  return (
    <div className={cn("space-y-3", className)}>
      {!value ? (
        <button
          type="button"
          onClick={() => !disabled && !uploadMutation.isPending && fileInputRef.current?.click()}
          disabled={disabled || uploadMutation.isPending}
          className={cn(
            "flex w-full items-center justify-between rounded-xl border border-dashed px-4 py-4 text-left transition-colors",
            disabled || uploadMutation.isPending
              ? "cursor-not-allowed border-primary/30 bg-primary/5"
              : "border-gray-200 hover:border-primary/50 hover:bg-primary/5",
          )}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              {uploadMutation.isPending ? (
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              ) : (
                <Upload className="h-5 w-5 text-primary" />
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700">{emptyTitle}</p>
              <p className="mt-0.5 text-xs text-gray-400">{emptyHint}</p>
            </div>
          </div>
        </button>
      ) : (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-gray-800">{fileName || "Uploaded PDF"}</p>
              <p className="text-xs text-gray-400">Stored in R2 and ready to save with this job</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 text-xs"
              onClick={() => window.open(value, "_blank", "noopener,noreferrer")}
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Open
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 px-2 text-red-600 hover:bg-red-50 hover:text-red-700"
              onClick={() => onChange("")}
              disabled={disabled || uploadMutation.isPending}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        className="hidden"
        disabled={disabled || uploadMutation.isPending}
        onChange={(e) => handleSelect(e.target.files?.[0])}
      />
    </div>
  );
}
