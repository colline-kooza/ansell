"use client";

import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

interface PresignedUrlResponse {
  presignedUrl: string;
  key: string;
  publicUrl: string;
}

interface UploadResult {
  data: { url: string; key: string };
}

interface UploadOptions {
  folder?: string;
  errorMessage?: string;
}

async function getPresignedUrl(
  file: File,
  options: UploadOptions = {},
): Promise<PresignedUrlResponse> {
  // Use the Next.js API route — no auth required, R2 credentials are server-side
  const response = await fetch("/api/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      filename: file.name,
      contentType: file.type,
      size: file.size,
      folder: options.folder,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || err.message || "Failed to get upload URL");
  }

  const json = await response.json();

  if (!json.presignedUrl || !json.publicUrl) {
    throw new Error("Invalid response from upload server");
  }

  return {
    presignedUrl: json.presignedUrl,
    publicUrl: json.publicUrl,
    key: json.key,
  };
}

async function uploadFileToR2(
  file: File,
  options: UploadOptions = {},
): Promise<UploadResult> {
  const { presignedUrl, publicUrl, key } = await getPresignedUrl(file, options);

  const uploadResponse = await fetch(presignedUrl, {
    method: "PUT",
    body: file,
    headers: { "Content-Type": file.type },
  });

  if (!uploadResponse.ok) {
    throw new Error("Failed to upload file to R2");
  }

  return { data: { url: publicUrl, key } };
}

export function useUploadImage() {
  return useMutation({
    mutationFn: async (file: File): Promise<UploadResult> => {
      return uploadFileToR2(file);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Image upload failed");
    },
  });
}

export function useUploadFile(options: UploadOptions = {}) {
  const errorMessage = options.errorMessage || "File upload failed";

  return useMutation({
    mutationFn: async (file: File): Promise<UploadResult> => {
      return uploadFileToR2(file, options);
    },
    onError: (error: Error) => {
      toast.error(error.message || errorMessage);
    },
  });
}

export function useUploadMultipleImages() {
  return useMutation({
    mutationFn: async (files: File[]): Promise<UploadResult[]> => {
      const results = await Promise.all(files.map((file) => uploadFileToR2(file)));
      return results;
    },
    onError: (error: Error) => {
      toast.error(error.message || "Image upload failed");
    },
  });
}

export function useUploadFiles(options: UploadOptions = {}) {
  const errorMessage = options.errorMessage || "File upload failed";

  return useMutation({
    mutationFn: async (files: File[]): Promise<UploadResult[]> => {
      const results = await Promise.all(
        files.map((file) => uploadFileToR2(file, options)),
      );
      return results;
    },
    onError: (error: Error) => {
      toast.error(error.message || errorMessage);
    },
  });
}
