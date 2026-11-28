import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import User from '../models/User.js'; 

dotenv.config();
const DEFAULT_JWT_SECRET = 'your_super_secret_access_key_change_in_production';
const AUTH_SERVICE_BE_URL = process.env.AUTH_SERVICE_BE_URL || 'http://localhost:3004/api/v1';

export default async function authMiddleware(req, res, next) {
  const token = req.headers['authorization'];

  if (!token)
    return res.status(401).json({ message: 'No token provided' });
  const tokenWithoutBearer = token.replace(/^Bearer\s/, '');
  const secret = process.env.JWT_SECRET || DEFAULT_JWT_SECRET;

  jwt.verify(tokenWithoutBearer, secret, async (err, decoded) => {
    if (err) {
      if (err.name === 'TokenExpiredError')
        return res.status(401).json({ message: 'Token expired' });
      return res.status(401).json({ message: 'Unauthorized' });
    }
    // ✅ Ensure authId exists in decoded token (support `authId`, `sub`, `id`, and `userId` from auth services)
    const authId = decoded.authId || decoded.sub || decoded.id || decoded.userId;
    if (!authId) {
      const saRole = (process.env.SUPER_ADMIN_ROLE || 'SUPER_ADMIN').toUpperCase();
      const saUser = (process.env.SUPER_ADMIN_USERNAME || 'Vyshwa').toLowerCase();
      const isSuperAdminToken =
        (decoded.role === saRole || decoded.role === 'super-admin' || decoded.role === 'SUPER_ADMIN') &&
        decoded.username &&
        decoded.username.toLowerCase() === saUser;

      if (isSuperAdminToken) {
        let adminUser = await User.findOne({
          $or: [
            { role: 'SUPER_ADMIN' },
            { authId: 'super-admin-root' },
            { username: process.env.SUPER_ADMIN_USERNAME || 'Vyshwa' },
          ],
          isDeleted: false,
        });

        if (!adminUser) {
          adminUser = await User.findOneAndUpdate(
            { role: 'SUPER_ADMIN' },
            {
              $setOnInsert: {
                authId: 'super-admin-root',
                username: process.env.SUPER_ADMIN_USERNAME || 'Vyshwa',
                role: 'SUPER_ADMIN',
                email: 'admin@krishub.in',
                firstName: 'Vyshwa',
                lastName: 'Super Admin',
                isDeleted: false,
              },
            },
            { upsert: true, new: true, setDefaultsOnInsert: true }
          );
        }

        req.user = {
          ...decoded,
          authId: adminUser.authId,
          _id: adminUser._id,
          role: saRole,
          isSuperAdmin: true,
        };
        return next();
      }

      return res.status(401).json({ message: 'Invalid token: user identifier missing' });
    }
    try {
      // ✅ Lookup by authId (string, not _id)
      let user = await User.findOne({ authId });

      if (user && user.isDeleted) {
        return res.status(404).json({ message: 'User Account not found' });
      }

      if (!user) {
        // User is authenticated via Auth Service JWT, but does not yet exist in MongoDB.
        // Try fetching user profile from Auth Service to populate details.
        let email = decoded.email || '';
        let phoneNumber = decoded.phoneNumber || decoded.phone || '';
        let firstName = decoded.firstName || '';
        let lastName = decoded.lastName || '';

        try {
          const authBase = AUTH_SERVICE_BE_URL.replace(/\/api\/v1\/?$/, '');
          let profileRes = await fetch(`${authBase}/users/me`, {
            headers: {
              Authorization: `Bearer ${tokenWithoutBearer}`,
              'app-code': 'RENOTE',
            },
          }).catch(() => null);

          if (!profileRes || !profileRes.ok) {
            const cleanBase = authBase.replace(/\/auth\/?$/, '');
            profileRes = await fetch(`${cleanBase}/users/me`, {
              headers: {
                Authorization: `Bearer ${tokenWithoutBearer}`,
                'app-code': 'RENOTE',
              },
            }).catch(() => null);
          }

          if (profileRes && profileRes.ok) {
            const profileJson = await profileRes.json();
            const pUser = profileJson?.data?.user;
            if (pUser) {
              email = pUser.email || email;
              phoneNumber = pUser.phone || phoneNumber;
              firstName = pUser.firstName || firstName;
              lastName = pUser.lastName || lastName;
            }
          }
        } catch (fetchErr) {
          // If auth service fetch fails, continue with token defaults
        }

        // If an unlinked user already exists in MongoDB with the same email or phone, link them
        if (email || phoneNumber) {
          const matchConditions = [];
          if (email) matchConditions.push({ email });
          if (phoneNumber) matchConditions.push({ phoneNumber });
          const existingUnlinked = await User.findOne({
            $or: matchConditions,
            isDeleted: false,
          });
          if (existingUnlinked) {
            existingUnlinked.authId = authId;
            if (firstName && !existingUnlinked.firstName) existingUnlinked.firstName = firstName;
            if (lastName && !existingUnlinked.lastName) existingUnlinked.lastName = lastName;
            user = await existingUnlinked.save();
          }
        }

        // Otherwise upsert new MongoDB user
        if (!user) {
          const update = {
            $setOnInsert: {
              authId,
              role: 'USER',
              email,
              phoneNumber,
              firstName,
              lastName,
              isDeleted: false,
            },
          };
          user = await User.findOneAndUpdate({ authId }, update, {
            upsert: true,
            new: true,
            setDefaultsOnInsert: true,
          });
        }
      }

      // Normalize: ensure req.user always has authId and _id (MongoDB ObjectId) for downstream controllers
      req.user = { ...decoded, authId, _id: user._id };
      next();
    } catch (dbError) {
      console.error('Error checking user in MongoDB:', dbError);
      return res.status(500).json({ message: 'Server error during authentication' });
    }
  });
}
