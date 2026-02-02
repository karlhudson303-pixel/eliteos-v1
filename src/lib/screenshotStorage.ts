import { invoke } from "@tauri-apps/api/core";

// ======================================================
// TYPES
// ======================================================

export interface StoredScreenshot {
  id: string;
  tradeId: string;
  filename: string;
  size: number;
  createdAt: string;
}

export interface StorageStats {
  totalScreenshots: number;
  totalSizeBytes: number;
  totalSizeMB: string;
  storageType: "filesystem";
}

// ======================================================
// SAVE SCREENSHOT (DISK)
// ======================================================

export const saveScreenshot = async (
  tradeId: string,
  file: File
): Promise<string> => {
  const arrayBuffer = await file.arrayBuffer();
  const bytes = Array.from(new Uint8Array(arrayBuffer));

  const savedName = await invoke<string>("save_screenshot", {
    tradeId,
    filename: file.name,
    bytes,
  });

  return savedName; // e.g. "tradeId_filename.png"
};

// ======================================================
// LOAD SCREENSHOT (DISK)
// returns base64 data URL
// ======================================================

export const getScreenshot = async (
  filename: string
): Promise<string | null> => {
  try {
    const dataUrl = await invoke<string>("load_screenshot", { filename });
    return dataUrl;
  } catch {
    return null;
  }
};

// ======================================================
// DELETE SCREENSHOT
// ======================================================

export const deleteScreenshot = async (filename: string): Promise<void> => {
  await invoke("delete_screenshot", { filename });
};

// ======================================================
// LIST ALL SCREENSHOTS
// ======================================================

export const listScreenshots = async (): Promise<string[]> => {
  return await invoke<string[]>("list_screenshots");
};

// ======================================================
// STORAGE STATS
// ======================================================

export const getStorageStats = async (): Promise<StorageStats> => {
  const [count, totalSize] = await invoke<[number, number]>("screenshot_stats");

  return {
    totalScreenshots: count,
    totalSizeBytes: totalSize,
    totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
    storageType: "filesystem",
  };
};

// ======================================================
// MIGRATION FROM INDEXEDDB → DISK (OPTIONAL)
// ======================================================

export const migrateOldScreenshots = async (): Promise<void> => {
  console.log("Migration placeholder — implement if needed.");
};