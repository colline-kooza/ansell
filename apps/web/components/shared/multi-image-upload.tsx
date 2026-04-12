"use client";

import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Upload, X, Loader2, ImageIcon, FileText } from "lucide-react";
import { useUploadMultipleImages } from "@/hooks/use-upload";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface MultiImageUploadProps {
  value?: string[];
  onChange: (urls: string[]) => void;
  disabled?: boolean;
  className?: string;
  maxFiles?: number;
  maxSize?: number; // in MB
  onlyImages?: boolean;
}

// Helper to check if a URL or string looks like a document
const isDocument = (url: string) => {
  if (!url) return false;
  const lower = url.toLowerCase();
  return (
    lower.includes("document-icon") || 
    lower.endsWith(".pdf") || 
    lower.endsWith(".doc") || 
    lower.endsWith(".docx") ||
    lower.includes("application/pdf") ||
    lower.includes("application/msword") ||
    lower.includes("application/vnd.openxmlformats-officedocument")
  );
};

export function MultiImageUpload({
  value = [],
  onChange,
  disabled = false,
  className,
  maxFiles = 10,
  maxSize = 10,
  onlyImages = false,
}: MultiImageUploadProps) {
  const [previews, setPreviews] = useState<string[]>(value);
  const [uploadingIndices, setUploadingIndices] = useState<Set<number>>(new Set());
  const uploadMutation = useUploadMultipleImages();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync internal previews with prop value
  useEffect(() => {
    setPreviews(value);
  }, [value]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (previews.length + files.length > maxFiles) {
      toast.error(`Maximum ${maxFiles} files allowed`);
      return;
    }

    const oversizedFiles = files.filter((f) => f.size > maxSize * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      toast.error(`Some files exceed ${maxSize}MB limit`);
      return;
    }

    const allowedTypes = onlyImages 
      ? ["image/jpeg", "image/png", "image/webp"] 
      : [
          "image/jpeg", "image/png", "image/webp", 
          "application/pdf", 
          "application/msword", 
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        ];
        
    const invalidFiles = files.filter((f) => !allowedTypes.includes(f.type) && !f.type.startsWith("image/"));
    if (invalidFiles.length > 0) {
      toast.error(onlyImages ? "Invalid file type. Please select images only." : "Invalid file type. Please select images or documents (PDF, DOCX)");
      return;
    }

    // Create local previews immediately
    const newPreviews = await Promise.all(
      files.map((file) => {
        if (file.type.startsWith("image/")) {
          return new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
          });
        }
        // For non-images, use a placeholder string that isDocument() will catch
        return Promise.resolve(`document-icon:${file.name}`);
      })
    );

    const startIndex = previews.length;
    const newIndices = new Set(Array.from({ length: files.length }, (_, i) => startIndex + i));
    setUploadingIndices(newIndices);
    setPreviews((prev) => [...prev, ...newPreviews]);

    try {
      const results = await uploadMutation.mutateAsync(files);
      const urls = results.map((r) => r.data.url);
      const newValue = [...value, ...urls];
      onChange(newValue);
      toast.success(`${files.length} file${files.length > 1 ? "s" : ""} uploaded successfully`);
    } catch {
      // Remove the failed previews
      setPreviews((prev) => prev.slice(0, prev.length - newPreviews.length));
      toast.error("Upload failed. Please try again.");
    } finally {
      setUploadingIndices(new Set());
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemove = (index: number) => {
    const newPreviews = previews.filter((_, i) => i !== index);
    const newUrls = value.filter((_, i) => i !== index);
    setPreviews(newPreviews);
    onChange(newUrls);
  };

  const isUploading = uploadMutation.isPending;

  return (
    <div className={cn("space-y-3", className)}>
      {/* Upload area */}
      {previews.length < maxFiles && (
        <div
          className={cn(
            "border-2 border-dashed rounded-xl p-6 text-center transition-colors cursor-pointer",
            isUploading
              ? "border-primary/40 bg-primary/5 cursor-not-allowed"
              : "border-gray-200 hover:border-primary/50 hover:bg-primary/5"
          )}
          onClick={() => !disabled && !isUploading && fileInputRef.current?.click()}
        >
          {isUploading ? (
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
              <p className="text-sm text-gray-500">Uploading...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Upload className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700">
                  Click to upload files
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {previews.length}/{maxFiles} files • {onlyImages ? "PNG, JPG, WEBP" : "PNG, JPG, PDF, DOCX"}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Preview grid */}
      {previews.length > 0 && (
        <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
          {previews.map((preview, index) => {
            const isThisUploading = uploadingIndices.has(index);
            const isDoc = isDocument(preview);

            return (
              <div key={index} className="relative group aspect-square">
                <div
                  className={cn(
                    "w-full h-full rounded-xl overflow-hidden border-2 shadow-sm transition-all flex items-center justify-center bg-gray-50",
                    isThisUploading ? "border-primary/50" : "border-gray-100 group-hover:border-primary/30"
                  )}
                >
                  {isDoc ? (
                    <div className="flex flex-col items-center justify-center p-2 text-center w-full">
                      <FileText className="h-7 w-7 text-primary/70 mb-1" />
                      <span className="text-[9px] font-semibold text-muted-foreground truncate w-full px-1">
                        DOC
                      </span>
                    </div>
                  ) : (
                    <img
                      src={preview}
                      alt={`File ${index + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // If image fails to load, fallback appropriately
                        const img = e.target as HTMLImageElement;
                        img.className = "hidden";
                        if (img.parentElement) {
                           img.parentElement.innerHTML = onlyImages ? `
                            <div class="flex flex-col items-center justify-center p-2 text-center w-full bg-gray-50 h-full">
                              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-6 w-6 text-gray-300 mb-1"><line x1="2" x2="22" y1="2" y2="22"/><path d="M10.41 10.41a2 2 0 1 1-2.83-2.83"/><line x1="13.5" x2="6" y1="13.5" y2="21"/><line x1="18" x2="21" y1="12" y2="15"/><path d="M3.59 3.59A1.99 1.99 0 0 0 3 5v14a2 2 0 0 0 2 2h14c.55 0 1.05-.22 1.41-.59"/><path d="M21 15V5a2 2 0 0 0-2-2H9"/></svg>
                              <span class="text-[9px] font-semibold text-gray-400">Broken</span>
                            </div>
                           ` : `
                            <div class="flex flex-col items-center justify-center p-2 text-center w-full h-full">
                              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="h-7 w-7 text-primary/70 mb-1"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>
                              <span class="text-[9px] font-semibold text-muted-foreground">DOC</span>
                            </div>
                           `;
                        }
                      }}
                    />
                  )}
                  {isThisUploading && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-xl">
                      <Loader2 className="h-5 w-5 text-white animate-spin" />
                    </div>
                  )}
                </div>
                {!disabled && !isThisUploading && (
                  <button
                    type="button"
                    className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-red-500 text-white flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                    onClick={() => handleRemove(index)}
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
                {/* First image badge */}
                {index === 0 && !isThisUploading && !isDoc && (
                  <span className="absolute bottom-1 left-1 bg-primary/90 text-primary-foreground text-[9px] font-bold px-1.5 py-0.5 rounded-md">
                    Cover
                  </span>
                )}
              </div>
            );
          })}

          {/* Add more button if under limit */}
          {previews.length < maxFiles && (
            <button
              type="button"
              onClick={() => !disabled && !isUploading && fileInputRef.current?.click()}
              disabled={disabled || isUploading}
              className="aspect-square rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-1 text-gray-400 hover:border-primary/50 hover:text-primary hover:bg-primary/5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Upload className="h-4 w-4" />
              <span className="text-[10px] font-medium">Add</span>
            </button>
          )}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept={onlyImages ? "image/*" : "image/*,.pdf,.doc,.docx"}
        multiple
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || isUploading}
      />
    </div>
  );
}
