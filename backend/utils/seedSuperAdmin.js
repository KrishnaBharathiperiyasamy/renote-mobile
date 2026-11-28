import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import SystemSetting from '../models/SystemSetting.js';
import User from '../models/User.js';
import { TOTP } from 'otpauth';
import dotenv from 'dotenv';
dotenv.config();

export async function seedSuperAdmin() {
  if (mongoose.connection.readyState !== 1) {
    return;
  }
  try {
    const saUsername = process.env.SUPER_ADMIN_USERNAME || 'Vyshwa';
    const saPassword = process.env.SUPER_ADMIN_PASSWORD;
    const saRole = process.env.SUPER_ADMIN_ROLE || 'SUPER_ADMIN';

    // 1. Ensure collection indexes are synced (creates the database-level partial unique index for SUPER_ADMIN)
    try {
      await User.syncIndexes();
    } catch (idxErr) {
      console.warn('[Super Admin Init] Index sync notice:', idxErr.message);
    }

    // 2. Check if a permanent Super Admin account already exists in Renote_DB
    let superAdmin = await User.findOne({ role: 'SUPER_ADMIN' }).select('+password');

    if (superAdmin) {
      console.log(`[Super Admin Init] Permanent Super Admin record confirmed: ${superAdmin.username || saUsername} (${superAdmin.authId})`);
      // Preserve existing details, ensure username and password hash are set without unexpected overwrites
      let updated = false;
      if (!superAdmin.username) {
        superAdmin.username = saUsername;
        updated = true;
      }
      if (!superAdmin.password && saPassword) {
        superAdmin.password = await bcrypt.hash(saPassword, 12);
        updated = true;
      }
      if (updated) {
        await superAdmin.save();
      }
    } else {
      // Check if an existing root user or username exists that should be promoted
      const existingUser = await User.findOne({
        $or: [
          { authId: 'super-admin-root' },
          { username: saUsername },
        ],
      }).select('+password');

      if (existingUser) {
        existingUser.role = 'SUPER_ADMIN';
        existingUser.username = saUsername;
        if (!existingUser.password && saPassword) {
          existingUser.password = await bcrypt.hash(saPassword, 12);
        }
        await existingUser.save();
        console.log(`[Super Admin Init] Promoted existing account to single Super Admin: ${saUsername}`);
      } else {
        // Create the single permanent Super Admin account
        const hashedPassword = saPassword ? await bcrypt.hash(saPassword, 12) : '';
        await User.create({
          authId: 'super-admin-root',
          username: saUsername,
          password: hashedPassword,
          role: 'SUPER_ADMIN',
          email: 'admin@krishub.in',
          firstName: saUsername,
          lastName: 'Super Admin',
          isDeleted: false,
        });
        console.log(`[Super Admin Init] Successfully created permanent Super Admin account: ${saUsername}`);
      }
    }

    // 3. Initialize system settings if not already present
    const existingSetting = await SystemSetting.findOne({ key: 'sa_initialized' });
    if (!existingSetting) {
      await SystemSetting.findOneAndUpdate(
        { key: 'maintenance_mode' },
        { value: false },
        { upsert: true }
      );
      await SystemSetting.findOneAndUpdate(
        { key: 'sa_initialized' },
        { value: true },
        { upsert: true }
      );

      // Log TOTP setup URI for Google Authenticator (first-time setup only)
      if (process.env.TOTP_SECRET) {
        const totp = new TOTP({
          issuer: 'reNote',
          label: saUsername,
          algorithm: 'SHA1',
          digits: 6,
          period: 30,
          secret: process.env.TOTP_SECRET,
        });
        console.log('\n========================================');
        console.log('🔐 SUPER ADMIN TOTP SETUP');
        console.log('Scan this URI with Google Authenticator:');
        console.log(totp.toString());
        console.log('========================================\n');
      }
    }
  } catch (error) {
    console.error('Error seeding super admin:', error.message);
  }
}
