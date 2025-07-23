import { supabase } from "./supabase";

/**
 * Uploads a file to Supabase Storage and returns the public URL.
 * @param file File to upload
 * @returns { url: string, error?: string }
 */
export const uploadFile = async (
  file: File
): Promise<{ url: string; error?: string }> => {
  try {
    console.log("Uploading file:", file.name); // Debug log

    // Correct: Do NOT include bucket name in filePath
    const filePath = `${Date.now()}-${file.name}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from("vriksh-bill-attachments")
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      console.error("Upload error:", uploadError.message); // Debug log
      return { url: "", error: uploadError.message };
    }

    // Get public URL
    const { data } = supabase.storage
      .from("vriksh-bill-attachments")
      .getPublicUrl(filePath);

    if (!data?.publicUrl) {
      console.error("Failed to get public URL"); // Debug log
      return { url: "", error: "Failed to get public URL" };
    }

    // Print the public URL to the console
    console.log("Public URL:", data.publicUrl);

    return { url: data.publicUrl };
  } catch (error: any) {
    console.error("Exception:", error.message); // Debug log
    return { url: "", error: error.message || "Failed to upload file" };
  }
};

// Helper function to check if a file URL is accessible
export const isFileAccessible = async (fileUrl: string): Promise<boolean> => {
  try {
    const response = await fetch(fileUrl, { method: "HEAD" });
    return response.ok;
  } catch {
    return false;
  }
};

/**
 * Validates a file for upload (size and type).
 * @param file File to validate
 * @returns { valid: boolean, error?: string }
 */
export const validateFile = (
  file: File
): { valid: boolean; error?: string } => {
  const maxSize = 10 * 1024 * 1024; // 10MB
  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "application/pdf",
    "text/plain",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ];

  if (file.size > maxSize) {
    return { valid: false, error: "File size must be less than 10MB" };
  }

  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error:
        "File type not supported. Please upload images, PDFs, or documents.",
    };
  }

  return { valid: true };
};
