import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import User from '../models/User.js';
dotenv.config();

const DEFAULT_JWT_SECRET = 'your_super_secret_access_key_change_in_production';

/**
 * Optional auth middleware — sets req.user if valid token present,
 * but allows the request to proceed even without auth.
 */
export default function optionalAuth(req, res, next) {
  const token = req.headers['authorization'];
  if (!token) return next();

  const tokenWithoutBearer = token.replace(/^Bearer\s/, '');
  const secret = process.env.JWT_SECRET || DEFAULT_JWT_SECRET;
  jwt.verify(tokenWithoutBearer, secret, async (err, decoded) => {
    if (!err && decoded) {
      const authId = decoded.authId || decoded.sub;
      if (authId) {
        try {
          const user = await User.findOne({ authId });
          if (user) {
            req.user = user;
          } else {
            req.user = { ...decoded, authId };
          }
        } catch {
          req.user = { ...decoded, authId };
        }
      } else {
        req.user = decoded;
      }
    }
    next();
  });
}
