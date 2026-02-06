const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const DATA_FILE = path.join(__dirname, 'assets', 'data', 'contact-submissions.json');

function readData() {
  try {
    const s = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(s || '[]');
  } catch (e) {
    return [];
  }
}

function writeData(arr) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(arr, null, 2));
}

app.post('/api/contact', (req, res) => {
  const { name, email, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const submissions = readData();
  const entry = {
    id: Date.now(),
    name,
    email,
    message,
    receivedAt: new Date().toISOString(),
  };
  submissions.push(entry);
  writeData(submissions);

  return res.json({ ok: true });
});

app.get('/api/ping', (_req, res) => res.json({ ok: true }));

const port = process.env.PORT || 3001;
app.listen(port, () => console.log(`Contact backend running on http://localhost:${port}`));
