const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');

const DATA_FILE = path.join(__dirname, 'data.json');
const ADMIN_EMAIL = 'admin@admin.com';
const ADMIN_PASSWORD = 'admin123';
const PORT = 3000;

function loadData() {
  if (!fs.existsSync(DATA_FILE)) {
    return { users: [], loggedInUsers: [] };
  }
  const json = fs.readFileSync(DATA_FILE, 'utf8');
  try {
    return JSON.parse(json);
  } catch (error) {
    return { users: [], loggedInUsers: [] };
  }
}

function saveData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
}

function ensureDataFile() {
  if (!fs.existsSync(DATA_FILE)) {
    saveData({ users: [], loggedInUsers: [] });
  }
}

ensureDataFile();
const app = express();
app.use(cors());
app.use(express.json());
// Serve static files (the frontend) from project root
app.use(express.static(__dirname));

app.post('/api/register', (req, res) => {
  const { name, email, password } = req.body || {};
  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
  }
  const normalizedEmail = email.trim().toLowerCase();
  if (normalizedEmail === ADMIN_EMAIL) {
    return res.status(400).json({ success: false, message: 'This email is reserved for admin. Choose another email.' });
  }
  const data = loadData();
  if (data.users.some(user => user.email === normalizedEmail)) {
    return res.status(400).json({ success: false, message: 'This email is already registered. Please login.' });
  }
  data.users.push({
    name: name.trim(),
    email: normalizedEmail,
    password,
    registeredAt: new Date().toISOString()
  });
  saveData(data);
  return res.json({ success: true });
});

app.post('/api/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required.' });
  }
  const normalizedEmail = email.trim().toLowerCase();
  if (normalizedEmail === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
    return res.json({ success: true, role: 'admin', name: 'Admin', email: ADMIN_EMAIL });
  }
  const data = loadData();
  const user = data.users.find(item => item.email === normalizedEmail && item.password === password);
  if (!user) {
    return res.status(401).json({ success: false, message: 'Invalid credentials.' });
  }
  if (!data.loggedInUsers.includes(normalizedEmail)) {
    data.loggedInUsers.push(normalizedEmail);
    saveData(data);
  }
  return res.json({ success: true, role: 'user', name: user.name, email: user.email });
});

app.post('/api/logout', (req, res) => {
  const { email } = req.body || {};
  if (!email) {
    return res.status(400).json({ success: false, message: 'Email is required to logout.' });
  }
  const normalizedEmail = email.trim().toLowerCase();
  const data = loadData();
  data.loggedInUsers = data.loggedInUsers.filter(item => item !== normalizedEmail);
  saveData(data);
  return res.json({ success: true });
});

app.get('/api/admin/users', (req, res) => {
  const data = loadData();
  return res.json({ success: true, users: data.users });
});

app.get('/api/admin/logged', (req, res) => {
  const data = loadData();
  return res.json({ success: true, loggedInUsers: data.loggedInUsers });
});

// Convenience endpoints matching frontend expectations
app.get('/api/users', (req, res) => {
  const data = loadData();
  return res.json({ success: true, users: data.users });
});

app.get('/api/logged', (req, res) => {
  const data = loadData();
  return res.json({ success: true, loggedInUsers: data.loggedInUsers });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on http://0.0.0.0:${PORT}`);
});
