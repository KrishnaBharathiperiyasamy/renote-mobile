import User from '../models/User.js';
import Company from '../models/Company.js';
import Quotation from '../models/Quotation.js';
import Invoice from '../models/Invoice.js';
import Poster from '../models/Poster.js';
import Product from '../models/Product.js';
import SystemSetting from '../models/SystemSetting.js';
import mongoose from 'mongoose';
import archiver from 'archiver';
import unzipper from 'unzipper';
import { Readable } from 'stream';
import { getIO } from '../utils/socket.js';

function emitSA(event, data) {
  const io = getIO();
  if (io) io.of('/superadmin').to('sa-room').emit(event, data);
}

// GET /api/superadmin/stats
export const getStats = async (req, res) => {
  try {
    const now = new Date();
    const sevenDaysAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000);

    const [
      totalUsers,
      totalCompanies,
      totalPosters,
      totalInvoices,
      totalQuotations,
      totalProducts,
      newUsersWeek,
      newUsersMonth,
      activeCompanies,
      // Growth data for charts
      userGrowth,
    ] = await Promise.all([
      User.countDocuments({ isDeleted: { $ne: true } }),
      Company.countDocuments({ isDeleted: { $ne: true } }),
      Poster.countDocuments(),
      Invoice.countDocuments(),
      Quotation.countDocuments(),
      Product.countDocuments(),
      User.countDocuments({ isDeleted: { $ne: true }, createdAt: { $gte: sevenDaysAgo } }),
      User.countDocuments({ isDeleted: { $ne: true }, createdAt: { $gte: thirtyDaysAgo } }),
      Company.countDocuments({ isDeleted: false }),
      // User signups per day (last 30 days)
      User.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo }, isDeleted: { $ne: true } } },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    res.json({
      stats: {
        totalUsers,
        totalCompanies,
        totalPosters,
        totalInvoices,
        totalQuotations,
        totalProducts,
        newUsersWeek,
        newUsersMonth,
        activeCompanies,
      },
      userGrowth,
    });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching stats', error: error.message });
  }
};

// GET /api/superadmin/maintenance
export const getMaintenanceStatus = async (req, res) => {
  try {
    const setting = await SystemSetting.findOne({ key: 'maintenance_mode' });
    res.json({ maintenance: setting?.value === true });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching maintenance status', error: error.message });
  }
};

// POST /api/superadmin/maintenance
export const toggleMaintenance = async (req, res) => {
  try {
    const { enabled } = req.body;
    const newValue = typeof enabled === 'boolean' ? enabled : false;
    await SystemSetting.findOneAndUpdate(
      { key: 'maintenance_mode' },
      { value: newValue },
      { upsert: true }
    );
    emitSA('maintenance:toggled', { enabled: newValue });
    res.json({ message: `Maintenance mode ${newValue ? 'enabled' : 'disabled'}`, maintenance: newValue });
  } catch (error) {
    res.status(500).json({ message: 'Error toggling maintenance', error: error.message });
  }
};

// POST /api/superadmin/backup
export const createBackup = async (req, res) => {
  try {
    const collections = {
      users: await User.find().lean(),
      companies: await Company.find().lean(),
      quotations: await Quotation.find().lean(),
      invoices: await Invoice.find().lean(),
      posters: await Poster.find().lean(),
      products: await Product.find().lean(),
    };

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=renote-backup-${new Date().toISOString().slice(0, 10)}.zip`
    );

    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.on('error', (err) => {
      throw err;
    });
    archive.pipe(res);

    for (const [name, docs] of Object.entries(collections)) {
      archive.append(JSON.stringify(docs, null, 2), { name: `${name}.json` });
    }

    await archive.finalize();
  } catch (error) {
    res.status(500).json({ message: 'Error creating backup', error: error.message });
  }
};

// POST /api/superadmin/restore
export const restoreBackup = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No backup file uploaded' });

    const confirm = req.body.confirm;
    if (confirm !== 'RESTORE') {
      return res.status(400).json({
        message: 'Send confirm: "RESTORE" in body to proceed. This will overwrite existing data.',
      });
    }

    const collectionMap = {
      'users.json': User,
      'companies.json': Company,
      'quotations.json': Quotation,
      'invoices.json': Invoice,
      'posters.json': Poster,
      'products.json': Product,
    };

    const bufferStream = new Readable();
    bufferStream.push(req.file.buffer);
    bufferStream.push(null);

    const entries = [];
    await new Promise((resolve, reject) => {
      bufferStream
        .pipe(unzipper.Parse())
        .on('entry', async (entry) => {
          const fileName = entry.path;
          if (collectionMap[fileName]) {
            const chunks = [];
            entry.on('data', (chunk) => chunks.push(chunk));
            entry.on('end', () => {
              entries.push({ fileName, data: Buffer.concat(chunks).toString() });
            });
          } else {
            entry.autodrain();
          }
        })
        .on('close', resolve)
        .on('error', reject);
    });

    const restored = [];
    for (const { fileName, data } of entries) {
      const Model = collectionMap[fileName];
      if (!Model) continue;
      const docs = JSON.parse(data);
      if (!Array.isArray(docs)) continue;
      const collName = fileName.replace('.json', '');
      await mongoose.connection.collection(collName).deleteMany({});
      if (docs.length > 0) {
        await mongoose.connection.collection(collName).insertMany(docs);
      }
      restored.push(`${collName}: ${docs.length} documents`);
    }

    emitSA('system:restored', { collections: restored });
    res.json({ message: 'Backup restored successfully', restored });
  } catch (error) {
    res.status(500).json({ message: 'Error restoring backup', error: error.message });
  }
};
