import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

const DEFAULT_JWT_SECRET = 'your_super_secret_access_key_change_in_production';

export default function superAdminAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader)
    return res.status(401).json({ message: 'No token provided' });

  const token = authHeader.replace(/^Bearer\s/, '');
  const secret = process.env.JWT_SECRET || DEFAULT_JWT_SECRET;

  try {
    const decoded = jwt.verify(token, secret);

    const expectedRole = (process.env.SUPER_ADMIN_ROLE || 'SUPER_ADMIN').trim();
    const expectedUsername = (process.env.SUPER_ADMIN_USERNAME || 'Vyshwa').trim().toLowerCase();

    // Must have super-admin role (accept configured SUPER_ADMIN_ROLE, 'SUPER_ADMIN', or legacy 'super-admin')
    const roleMatches =
      decoded.role === expectedRole ||
      decoded.role === 'SUPER_ADMIN' ||
      decoded.role === 'super-admin';

    if (!roleMatches)
      return res.status(403).json({ message: 'Forbidden: Super Admin access required' });

    // SECURITY: Only accept tokens issued by the SA login flow (contain matching "username" field).
    // Auth-service client tokens contain "authId" and must NOT be accepted for SA panel access.
    if (!decoded.username || decoded.username.toLowerCase() !== expectedUsername || decoded.authId) {
      return res.status(403).json({ message: 'Forbidden: This token is not valid for superadmin access' });
    }

    req.user = decoded;
    req.superAdmin = true;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError')
      return res.status(401).json({ message: 'Token expired' });
    return res.status(401).json({ message: 'Invalid token' });
  }
}
