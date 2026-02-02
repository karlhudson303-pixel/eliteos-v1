import { invoke } from "@tauri-apps/api/core";

export async function loadFromDisk(path: string) {
  const raw = await invoke<string>("load_data", { path });
  return raw ? JSON.parse(raw) : null;
}

export async function saveToDisk(path: string, data: any) {
  await invoke("save_data", {
    path,
    data: JSON.stringify(data),
  });
}