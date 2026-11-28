import mongoose from 'mongoose';
import SystemSetting from '../models/SystemSetting.js';

let cachedMaintenance = false;
let lastChecked = 0;
const CACHE_TTL = 30000; // 30 seconds

async function refreshCache() {
  if (mongoose.connection.readyState !== 1) {
    // Database is not connected; keep previous state and avoid blocking
    lastChecked = Date.now();
    return;
  }
  try {
    const setting = await SystemSetting.findOne({ key: 'maintenance_mode' }).maxTimeMS(1000);
    cachedMaintenance = setting?.value === true;
    lastChecked = Date.now();
  } catch {
    // Keep previous cached value on error
    lastChecked = Date.now();
  }
}

export default async function maintenanceCheck(req, res, next) {
  // Never block SA routes
  if (req.path.startsWith('/api/superadmin')) return next();

  if (Date.now() - lastChecked > CACHE_TTL) {
    await refreshCache();
  }

  if (cachedMaintenance) {
    return res.status(503).json({
      maintenance: true,
      message: 'System is under maintenance. Please try again later.',
    });
  }

  next();
}
