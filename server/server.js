import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.join(__dirname, 'database.json');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// Helper: Read DB
function readDb() {
  try {
    if (!fs.existsSync(DB_FILE)) {
      return { universities: [], applications: [], profile: {}, auditLogs: [] };
    }
    const data = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.error("Error reading database:", err);
    return { universities: [], applications: [], profile: {}, auditLogs: [] };
  }
}

// Helper: Write DB
function writeDb(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error("Error writing database:", err);
  }
}

// 1. Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'UniGoh Database API', version: '1.0.0', time: new Date() });
});

// 2. Universities List
app.get('/api/universities', (req, res) => {
  const db = readDb();
  res.json(db.universities || []);
});

// 3. Applications List
app.get('/api/applications', (req, res) => {
  const db = readDb();
  const { universityId, status } = req.query;
  let results = db.applications || [];
  if (universityId) results = results.filter(a => a.universityId === universityId);
  if (status && status !== 'ALL') results = results.filter(a => a.status === status);
  res.json(results);
});

// 4. Create New Application (1-Click Apply)
app.post('/api/applications', (req, res) => {
  const db = readDb();
  const newApp = {
    id: req.body.id || `UNIGOH-2026-${Math.floor(1000 + Math.random() * 9000)}`,
    universityId: req.body.universityId,
    universityName: req.body.universityName,
    programName: req.body.programName,
    degree: req.body.degree || 'Bakalavr',
    applicantName: req.body.applicantName,
    applicantPhone: req.body.applicantPhone,
    applicantPinfl: req.body.applicantPinfl,
    status: 'PENDING',
    examDate: 'Tez orada belgilanadi',
    submittedAt: new Date().toISOString(),
    notes: req.body.notes || 'UniGoh orqali yuborilgan'
  };

  db.applications.unshift(newApp);
  writeDb(db);
  res.status(201).json(newApp);
});

// 5. Update Status (OTM CRM & Master Admin)
app.patch('/api/applications/:id/status', (req, res) => {
  const db = readDb();
  const { id } = req.params;
  const { status } = req.body;

  const appIndex = db.applications.findIndex(a => a.id === id);
  if (appIndex === -1) {
    return res.status(404).json({ error: "Ariza topilmadi" });
  }

  db.applications[appIndex].status = status;
  db.applications[appIndex].updatedAt = new Date().toISOString();
  writeDb(db);
  res.json(db.applications[appIndex]);
});

// 6. Abituriyent Profile & Certificates
app.get('/api/profile', (req, res) => {
  const db = readDb();
  res.json(db.profile || {});
});

app.put('/api/profile', (req, res) => {
  const db = readDb();
  db.profile = { ...db.profile, ...req.body, updatedAt: new Date().toISOString() };
  writeDb(db);
  res.json(db.profile);
});

// 7. Admin & Founder Analytics
app.get('/api/admin/metrics', (req, res) => {
  const db = readDb();
  const apps = db.applications || [];
  const total = apps.length;
  const approved = apps.filter(a => a.status === 'APPROVED' || a.status === 'CONTRACT_ISSUED').length;
  const contractsPaid = apps.filter(a => a.status === 'CONTRACT_ISSUED').length;
  const totalSubRevenue = 42000000; // 42 mln UZS MRR
  const commissionEarned = contractsPaid * 1500000;

  res.json({
    totalApplications: total,
    approvedApplications: approved,
    contractsPaid,
    totalSubRevenue,
    commissionEarned,
    conversionRate: total > 0 ? ((approved / total) * 100).toFixed(1) : "0.0"
  });
});

// 8. Admin Authentication (PIN 7777)
app.post('/api/admin/auth', (req, res) => {
  const { pin, role } = req.body;
  if (pin === '7777') {
    return res.json({
      success: true,
      token: "unigoh_secret_token_" + Date.now(),
      role: role || 'master_admin',
      user: 'Abdulloh Komilov (@komilovv77)'
    });
  }
  return res.status(401).json({ success: false, message: "Noto'g'ri PIN kod" });
});

app.listen(PORT, () => {
  console.log(`UniGoh Database & API Server running on http://localhost:${PORT}`);
});
