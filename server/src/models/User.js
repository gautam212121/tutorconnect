import { query, execute } from '../config/db.js';

function parseJson(val, fallback) {
  if (!val) return fallback;
  if (typeof val === 'object') return val;
  try {
    return JSON.parse(val);
  } catch {
    return fallback;
  }
}

export function formatUser(row) {
  if (!row) return null;
  const user = {
    _id: row.id,
    id: row.id,
    name: row.name,
    email: row.email,
    password: row.password,
    role: row.role,
    avatar: row.avatar,
    status: row.status,
    headline: row.headline,
    bio: row.bio,
    price: row.price != null ? Number(row.price) : undefined,
    priceMax: row.priceMax != null ? Number(row.priceMax) : undefined,
    experience: row.experience,
    location: row.location,
    subjects: parseJson(row.subjects, []),
    classesTaught: parseJson(row.classesTaught, []),
    mode: parseJson(row.mode, []),
    verified: Boolean(row.verified),
    emailVerified: Boolean(row.emailVerified),
    googleId: row.googleId,
    rating: Number(row.rating || 0),
    reviews: Number(row.reviews || 0),
    demoVideoUrl: row.demoVideoUrl,
    completedSessions: Number(row.completedSessions || 0),
    currentCommissionRate: Number(row.currentCommissionRate || 0.15),
    wallet: {
      pendingBalance: Number(row.walletPendingBalance || 0),
      availableBalance: Number(row.walletAvailableBalance || 0),
      paidBalance: Number(row.walletPaidBalance || 0),
    },
    activeSubscription: row.activeSubscription,
    freeLeadsUsed: Number(row.freeLeadsUsed || 0),
    freeLeadsResetDate: row.freeLeadsResetDate,
    bankDetails: {
      accountName: row.bankAccountName || '',
      accountNumber: row.bankAccountNumber || '',
      ifscCode: row.bankIfscCode || '',
      bankName: row.bankName || '',
    },
    upiId: row.upiId || '',
    mobile: row.mobile,
    qualification: row.qualification,
    languages: parseJson(row.languages, []),
    feeType: row.feeType || 'Hourly',
    availableDays: parseJson(row.availableDays, []),
    availableTimeSlots: row.availableTimeSlots,
    address: {
      city: row.addressCity || '',
      area: row.addressArea || '',
      pincode: row.addressPincode || '',
      state: row.addressState || '',
      full: row.addressFull || '',
    },
    documents: parseJson(row.documents, []),
    kycStatus: row.kycStatus || 'pending',
    backgroundVerified: Boolean(row.backgroundVerified),
    idVerified: Boolean(row.idVerified),
    addressVerified: Boolean(row.addressVerified),
    experienceVerified: Boolean(row.experienceVerified),
    referenceVerified: Boolean(row.referenceVerified),
    dob: row.dob,
    gender: row.gender,
    grade: row.grade,
    board: row.board,
    school: row.school,
    medium: row.medium,
    schedule: parseJson(row.schedule, {}),
    learningGoal: row.learningGoal,
    specialRequirements: row.specialRequirements,
    budget: row.budget != null ? Number(row.budget) : undefined,
    preferredTutorGender: row.preferredTutorGender || 'Any',
    wishlist: parseJson(row.wishlist, []),
    referralCode: row.referralCode,
    referredBy: row.referredBy,
    referralCount: Number(row.referralCount || 0),
    lastLoginAt: row.lastLoginAt,
    isOnline: Boolean(row.isOnline),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
  return user;
}

export class User {
  static async findOne(conditions = {}) {
    if (conditions.email) {
      const rows = await query('SELECT * FROM users WHERE email = ? LIMIT 1', [conditions.email]);
      return rows[0] ? formatUser(rows[0]) : null;
    }
    if (conditions.referralCode) {
      const rows = await query('SELECT * FROM users WHERE referralCode = ? LIMIT 1', [conditions.referralCode]);
      return rows[0] ? formatUser(rows[0]) : null;
    }
    if (conditions.id || conditions._id) {
      return this.findById(conditions.id || conditions._id);
    }
    const keys = Object.keys(conditions);
    if (keys.length > 0) {
      const where = keys.map(k => `${k} = ?`).join(' AND ');
      const values = keys.map(k => conditions[k]);
      const rows = await query(`SELECT * FROM users WHERE ${where} LIMIT 1`, values);
      return rows[0] ? formatUser(rows[0]) : null;
    }
    const rows = await query('SELECT * FROM users LIMIT 1');
    return rows[0] ? formatUser(rows[0]) : null;
  }

  static async findById(id) {
    if (!id) return null;
    const rows = await query('SELECT * FROM users WHERE id = ? LIMIT 1', [id]);
    return rows[0] ? formatUser(rows[0]) : null;
  }

  static async find(queryFilter = {}) {
    let sql = 'SELECT * FROM users WHERE 1=1';
    const params = [];

    if (queryFilter.role) {
      sql += ' AND role = ?';
      params.push(queryFilter.role);
    }
    if (queryFilter.status) {
      sql += ' AND status = ?';
      params.push(queryFilter.status);
    }
    if (queryFilter.verified !== undefined) {
      sql += ' AND verified = ?';
      params.push(queryFilter.verified ? 1 : 0);
    }

    sql += ' ORDER BY id DESC';

    const rows = await query(sql, params);
    return rows.map(formatUser);
  }

  static async create(data) {
    const {
      name, email, password, role = 'student', avatar, status = 'active',
      headline, bio, price, priceMax, experience, location, subjects, classesTaught,
      mode, verified = false, emailVerified = false, googleId, rating = 0, reviews = 0,
      demoVideoUrl, completedSessions = 0, currentCommissionRate = 0.15, wallet = {},
      activeSubscription, freeLeadsUsed = 0, freeLeadsResetDate, bankDetails = {},
      upiId, mobile, qualification, languages, feeType = 'Hourly', availableDays,
      availableTimeSlots, address = {}, documents, kycStatus = 'pending',
      backgroundVerified = false, idVerified = false, addressVerified = false,
      experienceVerified = false, referenceVerified = false, dob, gender, grade,
      board, school, medium, schedule, learningGoal, specialRequirements, budget,
      preferredTutorGender = 'Any', wishlist, referralCode, referredBy, referralCount = 0,
      lastLoginAt, isOnline = false
    } = data;

    const sql = `INSERT INTO users (
      name, email, password, role, avatar, status, headline, bio, price, priceMax,
      experience, location, subjects, classesTaught, mode, verified, emailVerified,
      googleId, rating, reviews, demoVideoUrl, completedSessions, currentCommissionRate,
      walletPendingBalance, walletAvailableBalance, walletPaidBalance, activeSubscription,
      freeLeadsUsed, freeLeadsResetDate, bankAccountName, bankAccountNumber, bankIfscCode,
      bankName, upiId, mobile, qualification, languages, feeType, availableDays,
      availableTimeSlots, addressCity, addressArea, addressPincode, addressState, addressFull,
      documents, kycStatus, backgroundVerified, idVerified, addressVerified,
      experienceVerified, referenceVerified, dob, gender, grade, board, school, medium,
      schedule, learningGoal, specialRequirements, budget, preferredTutorGender, wishlist,
      referralCode, referredBy, referralCount, lastLoginAt, isOnline
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?
    )`;

    const params = [
      name, email, password, role, avatar || null, status, headline || null, bio || null,
      price || null, priceMax || null, experience || null, location || null,
      subjects ? JSON.stringify(subjects) : null,
      classesTaught ? JSON.stringify(classesTaught) : null,
      mode ? JSON.stringify(mode) : null,
      verified ? 1 : 0, emailVerified ? 1 : 0, googleId || null, rating, reviews,
      demoVideoUrl || null, completedSessions, currentCommissionRate,
      wallet.pendingBalance || 0, wallet.availableBalance || 0, wallet.paidBalance || 0,
      activeSubscription || null, freeLeadsUsed, freeLeadsResetDate || null,
      bankDetails.accountName || null, bankDetails.accountNumber || null,
      bankDetails.ifscCode || null, bankDetails.bankName || null, upiId || null,
      mobile || null, qualification || null,
      languages ? JSON.stringify(languages) : null, feeType,
      availableDays ? JSON.stringify(availableDays) : null, availableTimeSlots || null,
      address.city || null, address.area || null, address.pincode || null,
      address.state || null, address.full || null,
      documents ? JSON.stringify(documents) : null, kycStatus,
      backgroundVerified ? 1 : 0, idVerified ? 1 : 0, addressVerified ? 1 : 0,
      experienceVerified ? 1 : 0, referenceVerified ? 1 : 0, dob || null, gender || null,
      grade || null, board || null, school || null, medium || null,
      schedule ? JSON.stringify(schedule) : null, learningGoal || null,
      specialRequirements || null, budget || null, preferredTutorGender,
      wishlist ? JSON.stringify(wishlist) : null, referralCode || null,
      referredBy || null, referralCount, lastLoginAt || null, isOnline ? 1 : 0
    ];

    const result = await execute(sql, params);
    return this.findById(result.insertId);
  }

  static async findByIdAndUpdate(id, updates = {}, options = {}) {
    if (!id) return null;
    const user = await this.findById(id);
    if (!user) return null;

    const fields = [];
    const params = [];

    // Map nested structures to flat columns if updated
    if (updates.name !== undefined) { fields.push('name = ?'); params.push(updates.name); }
    if (updates.email !== undefined) { fields.push('email = ?'); params.push(updates.email); }
    if (updates.password !== undefined) { fields.push('password = ?'); params.push(updates.password); }
    if (updates.status !== undefined) { fields.push('status = ?'); params.push(updates.status); }
    if (updates.role !== undefined) { fields.push('role = ?'); params.push(updates.role); }
    if (updates.avatar !== undefined) { fields.push('avatar = ?'); params.push(updates.avatar); }
    if (updates.verified !== undefined) { fields.push('verified = ?'); params.push(updates.verified ? 1 : 0); }
    if (updates.isOnline !== undefined) { fields.push('isOnline = ?'); params.push(updates.isOnline ? 1 : 0); }
    if (updates.headline !== undefined) { fields.push('headline = ?'); params.push(updates.headline); }
    if (updates.bio !== undefined) { fields.push('bio = ?'); params.push(updates.bio); }
    if (updates.price !== undefined) { fields.push('price = ?'); params.push(updates.price); }
    if (updates.priceMax !== undefined) { fields.push('priceMax = ?'); params.push(updates.priceMax); }
    if (updates.experience !== undefined) { fields.push('experience = ?'); params.push(updates.experience); }
    if (updates.location !== undefined) { fields.push('location = ?'); params.push(updates.location); }
    if (updates.subjects !== undefined) { fields.push('subjects = ?'); params.push(JSON.stringify(updates.subjects)); }
    if (updates.classesTaught !== undefined) { fields.push('classesTaught = ?'); params.push(JSON.stringify(updates.classesTaught)); }
    if (updates.mode !== undefined) { fields.push('mode = ?'); params.push(JSON.stringify(updates.mode)); }
    if (updates.languages !== undefined) { fields.push('languages = ?'); params.push(JSON.stringify(updates.languages)); }
    if (updates.availableDays !== undefined) { fields.push('availableDays = ?'); params.push(JSON.stringify(updates.availableDays)); }
    if (updates.documents !== undefined) { fields.push('documents = ?'); params.push(JSON.stringify(updates.documents)); }
    if (updates.schedule !== undefined) { fields.push('schedule = ?'); params.push(JSON.stringify(updates.schedule)); }
    if (updates.wishlist !== undefined) { fields.push('wishlist = ?'); params.push(JSON.stringify(updates.wishlist)); }
    if (updates.rating !== undefined) { fields.push('rating = ?'); params.push(updates.rating); }
    if (updates.reviews !== undefined) { fields.push('reviews = ?'); params.push(updates.reviews); }
    if (updates.completedSessions !== undefined) { fields.push('completedSessions = ?'); params.push(updates.completedSessions); }
    if (updates.currentCommissionRate !== undefined) { fields.push('currentCommissionRate = ?'); params.push(updates.currentCommissionRate); }
    if (updates.freeLeadsUsed !== undefined) { fields.push('freeLeadsUsed = ?'); params.push(updates.freeLeadsUsed); }
    if (updates.activeSubscription !== undefined) { fields.push('activeSubscription = ?'); params.push(updates.activeSubscription); }
    if (updates.kycStatus !== undefined) { fields.push('kycStatus = ?'); params.push(updates.kycStatus); }
    if (updates.mobile !== undefined) { fields.push('mobile = ?'); params.push(updates.mobile); }
    if (updates.qualification !== undefined) { fields.push('qualification = ?'); params.push(updates.qualification); }
    if (updates.feeType !== undefined) { fields.push('feeType = ?'); params.push(updates.feeType); }

    if (updates.wallet) {
      if (updates.wallet.pendingBalance !== undefined) { fields.push('walletPendingBalance = ?'); params.push(updates.wallet.pendingBalance); }
      if (updates.wallet.availableBalance !== undefined) { fields.push('walletAvailableBalance = ?'); params.push(updates.wallet.availableBalance); }
      if (updates.wallet.paidBalance !== undefined) { fields.push('walletPaidBalance = ?'); params.push(updates.wallet.paidBalance); }
    }

    if (updates.bankDetails) {
      if (updates.bankDetails.accountName !== undefined) { fields.push('bankAccountName = ?'); params.push(updates.bankDetails.accountName); }
      if (updates.bankDetails.accountNumber !== undefined) { fields.push('bankAccountNumber = ?'); params.push(updates.bankDetails.accountNumber); }
      if (updates.bankDetails.ifscCode !== undefined) { fields.push('bankIfscCode = ?'); params.push(updates.bankDetails.ifscCode); }
      if (updates.bankDetails.bankName !== undefined) { fields.push('bankName = ?'); params.push(updates.bankDetails.bankName); }
    }

    if (updates.address) {
      if (updates.address.city !== undefined) { fields.push('addressCity = ?'); params.push(updates.address.city); }
      if (updates.address.area !== undefined) { fields.push('addressArea = ?'); params.push(updates.address.area); }
      if (updates.address.pincode !== undefined) { fields.push('addressPincode = ?'); params.push(updates.address.pincode); }
      if (updates.address.state !== undefined) { fields.push('addressState = ?'); params.push(updates.address.state); }
      if (updates.address.full !== undefined) { fields.push('addressFull = ?'); params.push(updates.address.full); }
    }

    if (fields.length === 0) return user;

    params.push(id);
    await execute(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, params);
    return this.findById(id);
  }

  static async countDocuments(queryFilter = {}) {
    let sql = 'SELECT COUNT(*) as count FROM users WHERE 1=1';
    const params = [];
    if (queryFilter.role) { sql += ' AND role = ?'; params.push(queryFilter.role); }
    if (queryFilter.status) { sql += ' AND status = ?'; params.push(queryFilter.status); }
    const rows = await query(sql, params);
    return rows[0] ? Number(rows[0].count) : 0;
  }
}

export default User;
