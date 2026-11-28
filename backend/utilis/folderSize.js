import fs from "fs";
import path from "path";

// Recursively calculates the total size of all files in a directory
export function getFolderSize(folderPath) {
  let totalSize = 0;
  if (!fs.existsSync(folderPath)) return 0;
  const files = fs.readdirSync(folderPath);
  for (const file of files) {
    const filePath = path.join(folderPath, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      totalSize += getFolderSize(filePath);
    } else {
      totalSize += stat.size;
    }
  }
  return totalSize;
}
// Helper to format bytes as human-readable string
export function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}