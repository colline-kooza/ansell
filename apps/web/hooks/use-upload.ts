"use client";

import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { buildApiUrl } from "@/lib/api";

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
  const token = typeof window !== "undefined" ? localStorage.getItem("ansell_auth_token") : null;
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const response = await fetch(buildApiUrl("upload/presign"), {
    method: "POST",
    headers,
    body: JSON.stringify({
      filename: file.name,
      content_type: file.type,
      file_size: file.size,
      folder: options.folder,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || err.message || "Failed to get upload URL");
  }

  const json = await response.json();
  const data = json.data;

  if (!data || !data.upload_url || !data.public_url) {
    throw new Error("Invalid response from upload server");
  }

  return {
    presignedUrl: data.upload_url,
    publicUrl: data.public_url,
    key: data.key,
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
