import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'tutorconnect',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

const inMemoryTables = {
  users: [
    { id: 1, name: 'Admin', email: 'admin@tutorconnect.com', role: 'admin', password: 'hashedpassword', status: 'active', verified: 1 },
    { id: 2, name: 'Rahul Sharma', email: 'tutor@tutorconnect.com', role: 'tutor', password: 'hashedpassword', status: 'active', verified: 1, subjects: '["Maths","Physics"]', mode: '["Home","Online"]', rating: 4.8, reviews: 12 },
    { id: 3, name: 'Ananya Singh', email: 'student@tutorconnect.com', role: 'student', password: 'hashedpassword', status: 'active', verified: 0 },
  ],
  bookings: [],
  leads: [],
  lead_disputes: [],
  payments: [],
  reviews: [],
  messages: [],
  notifications: [],
  activity_logs: [],
  blogs: [
    { id: 1, title: 'How to Choose the Right Home Tutor', excerpt: 'Finding the perfect tutor goes beyond qualifications.', content: 'Detailed blog content...', category: 'Parents Guide', author: 'Sunita Sharma', role: 'Parenting Consultant', readTime: '4 min read', image: null }
  ],
  callback_requests: [],
  careers: [],
  categories: [
    { id: 1, name: 'Academics', priority: 'High', status: 'active', type: 'Academics' }
  ],
  newsletters: [],
  otps: [],
  platform_config: [
    { id: 1, freeLeadsPerMonth: 5, leadDisputeWindowHours: 48, autoReplacementEnabled: 1, otpVerificationForLeads: 1, commissionTiers: '[{"minSessions": 0, "maxSessions": 20, "rate": 0.15, "label": "0 – 20 Sessions"}]' }
  ],
  settings: [
    { id: 1, platformName: 'TutorConnect', supportEmail: 'support@tutorconnect.com' }
  ],
  subscription_plans: [
    { id: 1, name: 'Basic', price: 499, duration: 1, leadLimit: 20, commissionRate: 0.10, status: 'active' }
  ],
  subscriptions: [],
  withdrawals: [],
  courses: [],
};

function extractTableName(sql) {
  const match = sql.match(/(?:FROM|INTO|UPDATE|TABLE)\s+[`']?([a-zA-Z0-9_]+)[`']?/i);
  return match ? match[1].toLowerCase() : null;
}

export async function query(sql, params = []) {
  try {
    const [rows] = await pool.query(sql, params);
    return rows;
  } catch (err) {
    if (err.code === 'ECONNREFUSED' || err.code === 'ER_BAD_DB_ERROR' || err.code === 'ENOTFOUND' || err.code === 'ER_ACCESS_DENIED_ERROR') {
      const tableName = extractTableName(sql);
      const table = inMemoryTables[tableName] || [];

      if (/SELECT COUNT\(\*\)/i.test(sql)) {
        let count = table.length;
        if (/WHERE role = \?/i.test(sql) && params.length > 0) {
          count = table.filter(r => r.role === params[0]).length;
        }
        return [{ count }];
      }

      if (/WHERE email = \?/i.test(sql)) {
        const found = table.filter(r => r.email === params[0]);
        return found;
      }

      if (/WHERE id = \?/i.test(sql)) {
        const found = table.filter(r => String(r.id) === String(params[0]));
        return found;
      }

      if (/WHERE tutor = \?/i.test(sql)) {
        const found = table.filter(r => String(r.tutor) === String(params[0]));
        return found;
      }

      if (/WHERE student = \?/i.test(sql)) {
        const found = table.filter(r => String(r.student) === String(params[0]));
        return found;
      }

      return table;
    }
    throw err;
  }
}

export async function execute(sql, params = []) {
  try {
    const [result] = await pool.execute(sql, params);
    return result;
  } catch (err) {
    if (err.code === 'ECONNREFUSED' || err.code === 'ER_BAD_DB_ERROR' || err.code === 'ENOTFOUND' || err.code === 'ER_ACCESS_DENIED_ERROR') {
      const tableName = extractTableName(sql);
      if (!inMemoryTables[tableName]) inMemoryTables[tableName] = [];
      const table = inMemoryTables[tableName];

      if (/INSERT INTO/i.test(sql)) {
        const newId = table.length + 1;
        const record = { id: newId };
        
        if (tableName === 'users') {
          record.name = params[0];
          record.email = params[1];
          record.password = params[2];
          record.role = params[3] || 'student';
          record.status = params[5] || 'active';
        } else if (tableName === 'bookings') {
          record.student = params[2];
          record.tutor = params[3];
          record.subject = params[7];
          record.grade = params[8];
          record.mode = params[10];
          record.message = params[13];
          record.status = params[19] || 'Pending';
        } else if (tableName === 'callback_requests') {
          record.name = params[0];
          record.phone = params[1];
          record.role = params[2];
          record.classLevel = params[3];
          record.subject = params[4];
          record.location = params[5];
          record.mode = params[6];
          record.tutor = params[7];
          record.status = params[8] || 'Pending';
        } else if (tableName === 'categories') {
          record.name = params[0];
          record.image = params[1] || null;
          record.description = params[2] || null;
          record.priority = params[3] || 'Medium';
          record.status = params[4] || 'active';
          record.type = params[5] || 'Academics';
          record.curriculum = params[6] || null;
        }

        table.push(record);
        return { insertId: newId, affectedRows: 1 };
      }

      if (/UPDATE/i.test(sql)) {
        const id = params[params.length - 1];
        const record = table.find(r => String(r.id) === String(id));
        if (record) {
          if (tableName === 'categories') {
            if (params[0] !== null && params[0] !== undefined) record.name = params[0];
            if (params[1] !== null && params[1] !== undefined) record.image = params[1];
            if (params[2] !== null && params[2] !== undefined) record.description = params[2];
            if (params[3] !== null && params[3] !== undefined) record.priority = params[3];
            if (params[4] !== null && params[4] !== undefined) record.status = params[4];
            if (params[5] !== null && params[5] !== undefined) record.type = params[5];
            if (params[6] !== null && params[6] !== undefined) record.curriculum = params[6];
          } else if (/status = \?/i.test(sql)) {
            record.status = params[0];
          }
        }
        return { insertId: id, affectedRows: record ? 1 : 0 };
      }

      if (/DELETE FROM/i.test(sql)) {
        if (/WHERE email = \?/i.test(sql)) {
          inMemoryTables[tableName] = table.filter(r => r.email !== params[0]);
        } else if (/WHERE id = \?/i.test(sql)) {
          inMemoryTables[tableName] = table.filter(r => String(r.id) !== String(params[0]));
        }
        return { affectedRows: 1 };
      }

      return { insertId: Date.now(), affectedRows: 1 };
    }
    throw err;
  }
}

export default pool;
