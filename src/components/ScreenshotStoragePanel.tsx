import { useEffect, useState } from "react";
import { getStorageStats } from "@/lib/screenshotStorage";
import { open } from "@tauri-apps/plugin-shell";
import { appDataDir } from "@tauri-apps/api/path";

export function ScreenshotStoragePanel() {
  const [stats, setStats] = useState({
    totalScreenshots: 0,
    totalSizeMB: "0.00",
  });

  const [folderPath, setFolderPath] = useState("");

  useEffect(() => {
    refresh();
  }, []);

  const refresh = async () => {
    const s = await getStorageStats();
    setStats(s);

    const base = await appDataDir();
    setFolderPath(base + "screenshots");
  };

  const openFolder = async () => {
    await open(folderPath);
  };

  return (
    <div className="p-4 rounded-lg border bg-neutral-900/40">
      <h2 className="text-lg font-bold mb-2">Screenshot Storage</h2>

      <div className="space-y-1 text-sm">
        <div>Total screenshots: {stats.totalScreenshots}</div>
        <div>Total size: {stats.totalSizeMB} MB</div>
        <div className="text-neutral-400 break-all">
          Folder: {folderPath}
        </div>
      </div>

      <button
        onClick={openFolder}
        className="mt-3 px-3 py-2 bg-blue-600 rounded text-sm"
      >
        Open Screenshot Folder
      </button>
    </div>
  );
}