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

async function getPresignedUrl(file: File): Promise<PresignedUrlResponse> {
  const response = await fetch("/api/upload", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      filename: file.name,
      contentType: file.type,
      size: file.size,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || "Failed to get upload URL");
  }

  return response.json();
}

async function uploadFileToR2(file: File): Promise<UploadResult> {
  const { presignedUrl, publicUrl, key } = await getPresignedUrl(file);

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
