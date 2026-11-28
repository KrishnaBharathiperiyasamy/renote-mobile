import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';

dotenv.config();
const DEFAULT_JWT_SECRET = 'your_super_secret_access_key_change_in_production';

export default async function userMiddleware(req, res, next) {
  const token = req.headers['authorization'];

  if (!token)
    return res.status(401).json({ message: 'No token provided' });

  const tokenWithoutBearer = token.replace(/^Bearer\s/, '');
  const secret = process.env.JWT_SECRET || DEFAULT_JWT_SECRET;

  jwt.verify(tokenWithoutBearer, secret, (err, decoded) => {
    if (err) {
      if (err.name === 'TokenExpiredError')
        return res.status(401).json({ message: 'Token expired' });
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // ✅ Only decode token, do NOT check DB
    req.user = decoded;
    next();
  });
}
