require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const complaintsRoutes = require('./routes/complaints');
const adminRoutes = require('./routes/admin');
const notificationsRoutes = require('./routes/notifications');
const schemesRoutes = require('./routes/schemes');
const { startEscalationCron } = require('./services/escalation');

const app = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ──────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Routes ──────────────────────────────────────────────────────────────────
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/complaints', complaintsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/schemes', schemesRoutes);

app.get('/api/health', (_req, res) =>
  res.json({ status: 'OK', timestamp: new Date().toISOString() })
);

// ── Start ────────────────────────────────────────────────────────────────────
startEscalationCron();

app.listen(PORT, () => {
  console.log(`✅  LokSetu backend running on http://localhost:${PORT}`);
});
