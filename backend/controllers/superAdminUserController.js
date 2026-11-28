import User from '../models/User.js';
import Company from '../models/Company.js';
import Quotation from '../models/Quotation.js';
import Invoice from '../models/Invoice.js';
import Poster from '../models/Poster.js';
import Product from '../models/Product.js';
import UserBackup from '../models/UserBackup.js';
import axios from 'axios';
import archiver from 'archiver';
import { getIO } from '../utils/socket.js';
import { getAuthServiceAdminToken, fetchAuthServiceUsers } from '../utils/authServiceHelper.js';

function emitSA(event, data) {
  const io = getIO();
  if (io) io.of('/superadmin').to('sa-room').emit(event, data);
}



// GET /api/superadmin/users/backups — list all available backups (persisted in MongoDB, 6-month TTL)
export const listUserBackups = async (req, res) => {
  try {
    const SIX_MONTHS_MS = 180 * 24 * 60 * 60 * 1000;
    const docs = await UserBackup.find({}, {
      ownerName: 1, createdAt: 1,
      companiesCount: 1, quotationsCount: 1, invoicesCount: 1, postersCount: 1, productsCount: 1,
    }).sort({ createdAt: -1 }).lean();
    const backups = docs.map((b) => {
      const expiresAt = new Date(b.createdAt).getTime() + SIX_MONTHS_MS;
      return {
        backupId: b._id.toString(),
        userName: b.ownerName || 'Unknown',
        deletedAt: new Date(b.createdAt).toISOString(),
        expiresAt: new Date(expiresAt).toISOString(),
        remainingMs: expiresAt - Date.now(),
        counts: {
          companies: b.companiesCount || 0,
          quotations: b.quotationsCount || 0,
          invoices: b.invoicesCount || 0,
          posters: b.postersCount || 0,
          products: b.productsCount || 0,
        },
      };
    });
    res.json({ backups });
  } catch (error) {
    res.status(500).json({ message: 'Error listing backups', error: error.message });
  }
};

// GET /api/superadmin/users
export const getAllUsers = async (req, res) => {
  try {
    // Get user counts from MongoDB
    const mongoUsers = await User.aggregate([
      { $match: { isDeleted: { $ne: true } } },
      {
        $lookup: {
          from: 'quotations',
          localField: '_id',
          foreignField: 'user_id',
          as: 'userQuotations',
        },
      },
      {
        $lookup: {
          from: 'invoices',
          localField: '_id',
          foreignField: 'user_id',
          as: 'userInvoices',
        },
      },
      {
        $lookup: {
          from: 'posters',
          localField: '_id',
          foreignField: 'user_id',
          as: 'userPosters',
        },
      },
      {
        $lookup: {
          from: 'companies',
          localField: 'company',
          foreignField: '_id',
          as: 'userCompanies',
        },
      },
      {
        $lookup: {
          from: 'products',
          localField: '_id',
          foreignField: 'user_id',
          as: 'userProducts',
        },
      },
      {
        $project: {
          authId: 1,
          createdAt: 1,
          email: 1,
          firstName: 1,
          lastName: 1,
          phoneNumber: 1,
          phone: 1,
          name: 1,
          username: 1,
          kycData: 1,
          companiesCount: { $size: '$userCompanies' },
          invoicesCount: { $size: '$userInvoices' },
          postersCount: { $size: '$userPosters' },
          estimationsCount: { $size: '$userQuotations' },
          productsCount: { $size: '$userProducts' },
        },
      },
    ]);

    // Try to merge with auth-service-be user data
    let authUsers = [];
    try {
      authUsers = await fetchAuthServiceUsers();
    } catch {
      // Auth service may be down — continue with MongoDB data only
    }

    const authMap = {};
    for (const au of authUsers) {
      authMap[String(au.id)] = au;
    }

    const merged = mongoUsers.map((u) => {
      const auth = authMap[String(u.authId)] || {};
      const mongoName = [u.firstName, u.lastName].filter(Boolean).join(' ') || u.name || u.username || u.kycData?.name || u.email || u.phoneNumber || u.phone;
      return {
        ...u,
        name: auth.fullName || auth.name || mongoName || 'Unknown',
        email: auth.email || u.email || '',
        phone: auth.phone || u.phoneNumber || u.phone || '',
        isBlocked: auth.isBlocked ?? false,
        lastLoggedInAt: auth.lastLoggedInAt || null,
        role: auth.role?.code || '',
      };
    });

    res.json({ users: merged });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching users', error: error.message });
  }
};

// DELETE /api/superadmin/users/:id
export const deleteUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Backup all user data before deletion
    const [quotations, invoices, companies, posters, products] = await Promise.all([
      Quotation.find({ user_id: userId }).lean(),
      Invoice.find({ user_id: userId }).lean(),
      Company.find({ userId: userId }).lean(),
      Poster.find({ user_id: userId }).lean(),
      Product.find({ user_id: userId }).lean(),
    ]);

    // Fetch user info from auth-service-be for backup
    const mongoName = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.name || user.username || user.kycData?.name || user.email || user.phoneNumber || user.phone;
    let ownerName = mongoName || 'Unknown';
    let ownerEmail = user.email || '';
    let authUser = null;
    try {
      const allAuthUsers = await fetchAuthServiceUsers();
      const found = allAuthUsers.find(au => au.id === user.authId);
      if (found) {
        ownerName = found.fullName || found.name || ownerName;
        ownerEmail = found.email || ownerEmail;
        authUser = found;
      }
    } catch { /* ignore — auth-service may be down */ }

    // Persist backup to MongoDB (6-month TTL via index)
    const backup = await UserBackup.create({
      ownerName,
      ownerEmail,
      authUser,
      user: user.toObject(),
      quotations,
      invoices,
      companies,
      posters,
      products,
      companiesCount: companies.length,
      quotationsCount: quotations.length,
      invoicesCount: invoices.length,
      postersCount: posters.length,
      productsCount: products.length,
    });

    // Cascade delete all related MongoDB data
    await Promise.all([
      Quotation.deleteMany({ user_id: userId }),
      Invoice.deleteMany({ user_id: userId }),
      Company.deleteMany({ userId: userId }),
      Poster.deleteMany({ user_id: userId }),
      Product.deleteMany({ user_id: userId }),
    ]);

    await User.findByIdAndDelete(userId);

    // Delete user from auth-service-be (PostgreSQL)
    let authDeleted = false;
    if (authUser && user.authId) {
      try {
        const token = await getAuthServiceAdminToken();
        await axios.delete(`${authUrl}/admin/users/${user.authId}`, {
          headers: { Authorization: `Bearer ${token}` },
          data: { secret: process.env.SA_DELETE_SECRET },
        });
        authDeleted = true;
      } catch (authErr) {
        console.error('Failed to delete auth user:', authErr.message);
      }
    }

    emitSA('user:deleted', { userId, authId: user.authId });
    res.json({
      message: 'User and all related data deleted from both databases',
      authDeleted,
      backupId: backup._id.toString(),
      backupExpiresIn: '6 months',
      counts: {
        quotations: quotations.length,
        invoices: invoices.length,
        companies: companies.length,
        posters: posters.length,
        products: products.length,
      },
    });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting user', error: error.message });
  }
};

// POST /api/superadmin/users/restore/:backupId
export const restoreUserBackup = async (req, res) => {
  try {
    const { backupId } = req.params;
    const backup = await UserBackup.findById(backupId);
    if (!backup) return res.status(404).json({ message: 'Backup not found or expired (6-month limit)' });

    // Restore auth user in PostgreSQL first
    let authRestored = false;
    if (backup.authUser) {
      try {
        const authUrl = process.env.AUTH_SERVICE_BE_URL || 'http://localhost:3004/api/v1';
        const token = await getAuthServiceAdminToken();
        await axios.post(`${authUrl}/admin/users/restore`, {
          user: backup.authUser,
          secret: process.env.SA_DELETE_SECRET,
        }, {
          headers: { Authorization: `Bearer ${token}` },
        });
        authRestored = true;
      } catch (authErr) {
        console.error('Failed to restore auth user:', authErr.message);
      }
    }

    // Restore user in MongoDB
    await User.create(backup.user);

    // Restore related data
    const restored = [];
    if (backup.companies.length > 0) {
      await Company.insertMany(backup.companies);
      restored.push(`companies: ${backup.companies.length}`);
    }
    if (backup.quotations.length > 0) {
      await Quotation.insertMany(backup.quotations);
      restored.push(`quotations: ${backup.quotations.length}`);
    }
    if (backup.invoices.length > 0) {
      await Invoice.insertMany(backup.invoices);
      restored.push(`invoices: ${backup.invoices.length}`);
    }
    if (backup.posters.length > 0) {
      await Poster.insertMany(backup.posters);
      restored.push(`posters: ${backup.posters.length}`);
    }
    if (backup.products.length > 0) {
      await Product.insertMany(backup.products);
      restored.push(`products: ${backup.products.length}`);
    }

    // Remove used backup
    await UserBackup.findByIdAndDelete(backupId);

    emitSA('user:restored', { userId: backup.user._id });
    res.json({ message: 'User and all data restored successfully', authRestored, restored });
  } catch (error) {
    res.status(500).json({ message: 'Error restoring user backup', error: error.message });
  }
};

// GET /api/superadmin/users/backups/:backupId/download — download backup as zip
export const downloadUserBackup = async (req, res) => {
  try {
    const backup = await UserBackup.findById(req.params.backupId).lean();
    if (!backup) return res.status(404).json({ message: 'Backup not found or expired' });

    const safeName = (backup.ownerName || 'Unknown').replace(/[^a-zA-Z0-9_\-.]/g, '_');
    const dateStr = new Date(backup.createdAt).toISOString().slice(0, 19).replace(/:/g, '-') + 'Z';
    const fileName = `${safeName}_${dateStr}.zip`;

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.on('error', (err) => { throw err; });
    archive.pipe(res);

    if (backup.authUser) {
      archive.append(JSON.stringify(backup.authUser, null, 2), { name: 'auth_user.json' });
    }
    archive.append(JSON.stringify(backup.user, null, 2), { name: 'user.json' });
    archive.append(JSON.stringify(backup.companies, null, 2), { name: 'companies.json' });
    archive.append(JSON.stringify(backup.quotations, null, 2), { name: 'quotations.json' });
    archive.append(JSON.stringify(backup.invoices, null, 2), { name: 'invoices.json' });
    archive.append(JSON.stringify(backup.posters, null, 2), { name: 'posters.json' });
    archive.append(JSON.stringify(backup.products, null, 2), { name: 'products.json' });

    await archive.finalize();
  } catch (error) {
    if (!res.headersSent) {
      res.status(500).json({ message: 'Error downloading backup', error: error.message });
    }
  }
};

// PUT /api/superadmin/users/:id/block
export const blockUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Block all companies owned by this user
    await Company.updateMany({ userId: user._id }, { isDeleted: true });

    emitSA('user:blocked', { userId: user._id, authId: user.authId });
    res.json({ message: 'All companies blocked for this user' });
  } catch (error) {
    res.status(500).json({ message: 'Error blocking user', error: error.message });
  }
};

// PUT /api/superadmin/users/:id/unblock
export const unblockUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Unblock all companies owned by this user
    await Company.updateMany({ userId: user._id }, { isDeleted: false });

    emitSA('user:unblocked', { userId: user._id, authId: user.authId });
    res.json({ message: 'All companies unblocked for this user' });
  } catch (error) {
    res.status(500).json({ message: 'Error unblocking user', error: error.message });
  }
};

// POST /api/superadmin/users/:id/reset-password
export const resetUserPassword = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const authId = user.authId;
    if (!authId) return res.status(400).json({ message: 'No auth ID linked to this user' });

    const authUrl = process.env.AUTH_SERVICE_BE_URL || 'http://localhost:3004/api/v1';

    // Get user email from auth-service-be
    let email = '';
    try {
      const allAuthUsers = await fetchAuthServiceUsers();
      const found = allAuthUsers.find(au => au.id === authId);
      email = found?.email || '';
    } catch { /* ignore */ }
    if (!email) return res.status(400).json({ message: 'User has no email address' });

    // Trigger password reset email
    await axios.post(`${authUrl}/auth/request-reset-email`, { email });

    res.json({ message: `Password reset email sent to ${email}` });
  } catch (error) {
    if (error.response?.status === 404) {
      return res.status(404).json({ message: 'User not found in auth service' });
    }
    res.status(500).json({ message: 'Error resetting user password', error: error.message });
  }
};

// DELETE /api/superadmin/users/backups/:backupId — permanently delete a user backup
export const deleteUserBackup = async (req, res) => {
  try {
    const backupId = req.params.backupId;
    const backup = await UserBackup.findById(backupId);
    if (!backup) return res.status(404).json({ message: 'Backup not found' });

    await UserBackup.findByIdAndDelete(backupId);

    emitSA('backup:deleted', { backupId });
    res.json({ message: 'Backup permanently deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting backup', error: error.message });
  }
};
