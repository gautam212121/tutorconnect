import express from 'express';
import PlatformConfig from '../models/PlatformConfig.js';
import { verifyToken, requireRole } from '../middleware/auth.js';
import { getCommissionStructure } from '../services/commissionService.js';

const router = express.Router();
const getIo = (req) => req.app.get('io');

// ── Public: Get commission structure & free tier info ──────────────────────────
router.get('/commission', async (_req, res) => {
  try {
    const structure = await getCommissionStructure();
    res.json(structure);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Public: Get basic platform info ───────────────────────────────────────────
router.get('/info', async (_req, res) => {
  try {
    const config = await PlatformConfig.getConfig();
    res.json({
      platformName: config.platformName,
      supportEmail: config.supportEmail,
      supportPhone: config.supportPhone,
      platformAddress: config.platformAddress,
      freeLeadsPerMonth: config.freeLeadsPerMonth,
      maintenanceMode: config.maintenanceMode,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Admin: Get full config ────────────────────────────────────────────────────
router.get('/admin', verifyToken, requireRole('admin'), async (_req, res) => {
  try {
    const config = await PlatformConfig.getConfig();
    res.json(config);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Admin: Update config ──────────────────────────────────────────────────────
router.put('/admin', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const updated = await PlatformConfig.findOneAndUpdate({}, req.body);

    const io = getIo(req);
    io?.emit('config:updated', {
      freeLeadsPerMonth: updated.freeLeadsPerMonth,
      commissionTiers: updated.commissionTiers,
    });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── Admin: Update commission tiers only ───────────────────────────────────────
router.put('/admin/commission-tiers', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const { tiers } = req.body;
    if (!Array.isArray(tiers) || tiers.length === 0) {
      return res.status(400).json({ message: 'At least one commission tier is required' });
    }

    const updated = await PlatformConfig.findOneAndUpdate({}, { commissionTiers: tiers });

    const io = getIo(req);
    io?.emit('config:updated', { commissionTiers: updated.commissionTiers });

    res.json({ message: 'Commission tiers updated', tiers: updated.commissionTiers });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
