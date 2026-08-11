import { query, execute } from '../config/db.js';

export function formatPayment(row) {
  if (!row) return null;
  return {
    _id: row.id,
    id: row.id,
    booking: row.booking,
    student: row.student,
    tutor: row.tutor,
    totalAmount: Number(row.totalAmount || 0),
    tutorShare: Number(row.tutorShare || 0),
    adminShare: Number(row.adminShare || 0),
    adminRate: Number(row.adminRate || 0),
    tutorRate: Number(row.tutorRate || 0),
    status: row.status || 'Pending',
    method: row.method || 'Razorpay',
    razorpayOrderId: row.razorpayOrderId,
    razorpayPaymentId: row.razorpayPaymentId,
    razorpaySignature: row.razorpaySignature,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class Payment {
  static async find(filter = {}) {
    let sql = 'SELECT * FROM payments WHERE 1=1';
    const params = [];
    if (filter.student) { sql += ' AND student = ?'; params.push(filter.student); }
    if (filter.tutor) { sql += ' AND tutor = ?'; params.push(filter.tutor); }
    if (filter.booking) { sql += ' AND booking = ?'; params.push(filter.booking); }
    if (filter.status) { sql += ' AND status = ?'; params.push(filter.status); }
    sql += ' ORDER BY id DESC';
    const rows = await query(sql, params);
    return rows.map(formatPayment);
  }

  static async findById(id) {
    if (!id) return null;
    const rows = await query('SELECT * FROM payments WHERE id = ? LIMIT 1', [id]);
    return rows[0] ? formatPayment(rows[0]) : null;
  }

  static async create(data) {
    const {
      booking, student, tutor, totalAmount, tutorShare, adminShare,
      adminRate, tutorRate, status = 'Pending', method = 'Razorpay',
      razorpayOrderId, razorpayPaymentId, razorpaySignature
    } = data;

    const sql = `INSERT INTO payments (
      booking, student, tutor, totalAmount, tutorShare, adminShare,
      adminRate, tutorRate, status, method, razorpayOrderId, razorpayPaymentId, razorpaySignature
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

    const params = [
      booking, student, tutor, totalAmount, tutorShare, adminShare,
      adminRate, tutorRate, status, method,
      razorpayOrderId || null, razorpayPaymentId || null, razorpaySignature || null
    ];

    const res = await execute(sql, params);
    return this.findById(res.insertId);
  }

  static async aggregate(pipeline = []) {
    // Basic aggregation handler for total revenue calculation used in dashboard/analytics
    const rows = await query('SELECT SUM(totalAmount) as totalRevenue, SUM(adminShare) as totalCommission FROM payments WHERE status = "Completed"');
    const row = rows[0] || {};
    return [
      {
        _id: null,
        totalRevenue: Number(row.totalRevenue || 0),
        totalCommission: Number(row.totalCommission || 0),
      }
    ];
  }
}

export default Payment;
