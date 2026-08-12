import jwt from 'jsonwebtoken';

const getJwtSecret = () => process.env.JWT_SECRET || 'verifiedtutor-dev-secret';
const getTokenFromHeader = (req) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  return authHeader.split(' ')[1];
};

const verifyJwtToken = (token) => {
  return jwt.verify(token, getJwtSecret());
};

export const verifyToken = (req, res, next) => {
  try {
    const token = getTokenFromHeader(req);
    if (!token) {
      return res.status(401).json({ message: 'Authentication token missing' });
    }

    const decoded = verifyJwtToken(token);
    req.user = {
      id: decoded.sub,
      role: decoded.role,
      email: decoded.email,
      name: decoded.name,
    };
    return next();
  } catch (err) {
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};

export const optionalAuth = (req, _res, next) => {
  const token = getTokenFromHeader(req);
  if (!token) return next();

  try {
    const decoded = verifyJwtToken(token);
    req.user = {
      id: decoded.sub,
      role: decoded.role,
      email: decoded.email,
      name: decoded.name,
    };
  } catch (err) {
    // ignore invalid token for optional auth
  }
  return next();
};

export const requireRole = (role) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  if (req.user.role !== role) {
    return res.status(403).json({ message: 'Access denied' });
  }
  return next();
};

export const requireAnyRole = (roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  if (!roles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Access denied' });
  }
  return next();
};
