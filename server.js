const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const appUsername = process.env.APP_USERNAME || 'brickworksIT';
const appPassword = process.env.APP_PASSWORD || 'brickworksIT';

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

const metricSchema = new mongoose.Schema(
  {
    analysts: {
      type: Object,
      default: { JDEdwards: [], SalesForce: [] }
    },
    records: {
      type: Array,
      default: []
    },
    months: {
      type: Array,
      default: ['2026-06']
    },
    currentMonth: {
      type: String,
      default: '2026-06'
    }
  },
  { timestamps: true }
);

const Metric = mongoose.model('Metric', metricSchema);

const fallbackState = {
  analysts: { JDEdwards: [], SalesForce: [] },
  records: [],
  months: ['2026-06'],
  currentMonth: '2026-06'
};

let mongoAvailable = false;
let mongoConnectionPromise;

function connectMongo() {
  if (mongoAvailable) return Promise.resolve();
  if (!mongoConnectionPromise) {
    mongoConnectionPromise = mongoose.connect(
      process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/brickworks_metrics'
    ).then(() => {
      mongoAvailable = true;
      console.log('Connected to MongoDB');
    }).catch((error) => {
      mongoConnectionPromise = undefined;
      console.warn('MongoDB connection unavailable, running in fallback memory mode:', error.message);
    });
  }
  return mongoConnectionPromise;
}

app.get('/api/health', (req, res) => {
  res.json({ ok: true, message: 'BrickWorks API is running', mongoAvailable });
});

app.post('/api/login', (req, res) => {
  const { username, password } = req.body || {};

  if (username === appUsername && password === appPassword) {
    return res.json({ ok: true, message: 'Login successful' });
  }

  return res.status(401).json({ ok: false, message: 'Invalid username or password' });
});

app.get('/api/metrics', async (req, res) => {
  try {
    if (!mongoAvailable) {
      res.json(fallbackState);
      return;
    }

    let metric = await Metric.findOne().sort({ createdAt: -1 });
    if (!metric) {
      metric = await Metric.create({
        analysts: { JDEdwards: [], SalesForce: [] },
        records: [],
        months: ['2026-06'],
        currentMonth: '2026-06'
      });
    }

    res.json({
      analysts: metric.analysts,
      records: metric.records,
      months: metric.months,
      currentMonth: metric.currentMonth
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to load metrics', error: error.message });
  }
});

app.post('/api/metrics', async (req, res) => {
  try {
    const { analysts, records, months, currentMonth } = req.body || {};

    const payload = {
      analysts: analysts || { JDEdwards: [], SalesForce: [] },
      records: records || [],
      months: months || ['2026-06'],
      currentMonth: currentMonth || '2026-06'
    };

    if (!mongoAvailable) {
      Object.assign(fallbackState, payload);
      res.json(payload);
      return;
    }

    const metric = await Metric.findOneAndUpdate(
      {},
      payload,
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.json({
      analysts: metric.analysts,
      records: metric.records,
      months: metric.months,
      currentMonth: metric.currentMonth
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to save metrics', error: error.message });
  }
});

async function startServer() {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });

  await connectMongo();
}

if (require.main === module) {
  startServer();
}

module.exports = { app, connectMongo };
