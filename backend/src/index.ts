import express from 'express';
import path from 'path';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Item from './models/Item';
import History from './models/History';

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors({
  origin: process.env.FRONTEND_URL ? [process.env.FRONTEND_URL, 'http://localhost:5173', 'http://localhost:3000'] : '*',
  credentials: true
}));
app.use(express.json());

// MongoDB connection
// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/ekspeditor', {
  serverSelectionTimeoutMS: 3000 // fail fast if db is unreachable
})
  .then(async () => {
    console.log('Connected to MongoDB Atlas');
    await initializeDatabase();
  })
  .catch(err => {
    console.error('\n=== MOONGOSE CONNECTION ERROR ===');
    console.error('Failed to connect to DB, continuing in degraded mode...');
  });

const INITIAL_INVENTORY = [
  { id: '26211281', name: 'Item 1281', perBox: 100, currentStock: 0, minLimit: 50 },
  { id: '26211284', name: 'Item 1284', perBox: 160, currentStock: 0, minLimit: 50 },
  { id: '26211277', name: 'Item 1277', perBox: 160, currentStock: 0, minLimit: 50 },
  { id: '26211286', name: 'Item 1286', perBox: 168, currentStock: 0, minLimit: 50 },
  { id: '26244137', name: 'Item 4137', perBox: 70, currentStock: 0, minLimit: 50 },
  { id: '26214138', name: 'Item 4138', perBox: 70, currentStock: 0, minLimit: 50 },
  { id: '26279885', name: 'Item 9885', perBox: 70, currentStock: 0, minLimit: 50 },
  { id: '26279886', name: 'Item 9886', perBox: 70, currentStock: 0, minLimit: 50 },
  { id: '26235140', name: 'Item 5140', perBox: 216, currentStock: 0, minLimit: 50 },
  { id: '13536589', name: 'Item 6589', perBox: 144, currentStock: 0, minLimit: 50 },
  { id: '13547616', name: 'Item 7616', perBox: 30, currentStock: 0, minLimit: 50 },
  { id: '52165067', name: 'Item 5067', perBox: 168, currentStock: 0, minLimit: 50 },
  { id: '52165069', name: 'Item 5069', perBox: 168, currentStock: 0, minLimit: 50 },
  { id: '52164050', name: 'Item 4050', perBox: 48, currentStock: 0, minLimit: 50 },
  { id: '13504351', name: 'Item 4351', perBox: 1000, currentStock: 0, minLimit: 50 },
  { id: '25774623', name: 'Item 4623', perBox: 460, currentStock: 0, minLimit: 50 },
  { id: '26434099', name: 'Item 4099', perBox: 100, currentStock: 0, minLimit: 50 },
  { id: '26216360', name: 'Item 6360', perBox: 210, currentStock: 0, minLimit: 50 }
];

async function initializeDatabase() {
  try {
    // Clear the database completely to reset with new IDs
    await Item.deleteMany({});
    console.log('Cleared existing inventory.');

    let inserted = 0;
    for (const item of INITIAL_INVENTORY) {
      await Item.create(item);
      inserted++;
    }
    console.log(`Database seeded with ${inserted} new real items.`);

    // Clear history on initialization for clean slate testing, optional
    await History.deleteMany({});
    console.log('Cleared existing history.');
  } catch (error) {
    console.error('Failed to initialize DB:', error);
  }
}

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Warehouse Backend is running' });
});

// Get inventory with optional search (by last 4 digits)
app.get('/api/inventory', async (req, res) => {
  try {
    const { search } = req.query;
    let query = {};

    if (search && typeof search === 'string') {
      if (/^\d+$/.test(search)) {
        const last4 = search.slice(-4);
        query = { id: { $regex: last4 + '$' } };
      } else {
        query = { name: { $regex: search, $options: 'i' } };
      }
    }

    const items = await Item.find(query);
    res.status(200).json(items);
  } catch (error) {
    console.error('Inventory fetch failed (DB down?):', error);
    res.status(200).json([]); // Fallback to allow frontend UI to render
  }
});

// Add new item
app.post('/api/inventory', async (req, res) => {
  try {
    const { id, name, perBox, minLimit } = req.body;
    if (!id || !name || perBox === undefined || minLimit === undefined) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if ID already exists
    const existing = await Item.findOne({ id });
    if (existing) {
      return res.status(400).json({ error: `Item with ID ${id} already exists` });
    }

    const newItem = await Item.create({
      id,
      name,
      perBox,
      minLimit,
      currentStock: 0
    });

    res.status(201).json({ success: true, item: newItem });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create item' });
  }
});

// Global Settings (Update ALL minLimits)
app.put('/api/inventory/global-limit', async (req, res) => {
  try {
    const { minLimit } = req.body;
    if (minLimit === undefined || typeof minLimit !== 'number') {
      return res.status(400).json({ error: 'Invalid minLimit value' });
    }

    await Item.updateMany({}, { $set: { minLimit } });
    res.status(200).json({ success: true, message: `All items updated to minLimit: ${minLimit}` });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update global limit' });
  }
});

// System Management (Reset ALL stock to zero)
app.put('/api/inventory/reset-stock', async (req, res) => {
  try {
    await Item.updateMany({}, { $set: { currentStock: 0 } });

    // Also Optional: Log a massive history event or clear history? 
    // Usually best to leave history intact but add a system log, or maybe clear history
    // We'll leave history but just set stock to 0.

    res.status(200).json({ success: true, message: 'All stock reset to zero successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to reset stock' });
  }
});

// Execute IN/OUT command
app.post('/api/inventory/command', async (req, res) => {
  try {
    const { id, type, totalPieces } = req.body;

    // We also need boxes to save in history
    const foundItem = await Item.findOne({ id });
    const perBox = foundItem?.perBox || 1;
    const boxes = req.body.boxes || Math.floor(req.body.totalPieces / perBox) || 0;

    if (!id || !type || totalPieces === undefined) {
      return res.status(400).json({ error: 'Missing required fields: id, type, totalPieces' });
    }

    const item = await Item.findOne({ id });
    if (!item) {
      return res.status(404).json({ error: `Item with ID ${id} not found.` });
    }

    if (type === 'OUT' && item.currentStock < totalPieces) {
      return res.status(400).json({
        error: `Not enough stock. Remaining: ${item.currentStock}, Requested: ${totalPieces}`
      });
    }

    let newStock = item.currentStock;
    if (type === 'IN') {
      newStock += totalPieces;
    } else if (type === 'OUT') {
      newStock -= totalPieces;
    } else if (type === 'SET') {
      newStock = totalPieces;
    }

    item.currentStock = newStock;
    await item.save();

    // Log to History
    await History.create({
      itemId: id,
      type,
      boxes,
      totalPieces
    });

    res.status(200).json({ success: true, item });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to process command' });
  }
});

// Get 7-day stock dynamics for chart
app.get('/api/statistics/stock-dynamics', async (req, res) => {
  try {
    const allItems = await Item.find({});
    const currentTotal = allItems.reduce((acc: number, item: any) => acc + (item?.currentStock || 0), 0);
    const minLimitTotal = allItems.reduce((acc: number, item: any) => acc + (item?.minLimit || 0), 0);

    const getLocalDateString = (d: Date): string => {
      const offset = d.getTimezoneOffset() * 60000;
      return new Date(d.getTime() - offset).toISOString().substring(0, 10);
    };

    const dates: string[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const ds = getLocalDateString(d);
      if (ds) dates.push(ds);
    }

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7); // Go back 7 days just to be safe with timezone boundaries

    const historyMatches = await History.find({
      timestamp: { $gte: sevenDaysAgo }
    });

    const dailyDeltas: Record<string, { IN: number; OUT: number }> = {};
    for (const date of dates) {
      if (date) {
        dailyDeltas[date] = { IN: 0, OUT: 0 };
      }
    }

    historyMatches.forEach((record: any) => {
      if (!record || !record.timestamp) return;
      const dateStr = getLocalDateString(record.timestamp);
      if (dateStr && dailyDeltas[dateStr]) {
        if (record.type === 'IN') dailyDeltas[dateStr].IN += (record.totalPieces || 0);
        if (record.type === 'OUT') dailyDeltas[dateStr].OUT += (record.totalPieces || 0);
      }
    });

    const reversedDates = [...dates].reverse();
    const resultMap: Record<string, number> = {};

    let runningStock = currentTotal;

    for (const date of reversedDates) {
      if (!date) continue;

      resultMap[date] = runningStock;
      const delta = dailyDeltas[date];
      if (delta) {
        runningStock = runningStock - delta.IN + delta.OUT;
      }
    }

    const data = dates.map(date => {
      if (!date) return null;
      const d = new Date(date);
      const displayDate = d.toLocaleDateString('uz-UZ', { month: 'short', day: 'numeric' });
      return {
        date: displayDate,
        fullDate: date,
        stock: resultMap[date] || 0,
        minLimitTotal
      };
    }).filter(Boolean);

    res.status(200).json(data);
  } catch (error) {
    console.error('Stock dynamics failed (DB down?):', error);
    res.status(200).json([]);
  }
});

// Get History
app.get('/api/history', async (req, res) => {
  try {
    const history = await History.find().sort({ timestamp: -1 }).limit(100);
    res.status(200).json(history);
  } catch (error) {
    console.error('History fetch failed (DB down?):', error);
    res.status(200).json([]);
  }
});

// Delete History (Undo operation)
app.delete('/api/history/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Find the history record
    const historyRecord = await History.findById(id);
    if (!historyRecord) {
      return res.status(404).json({ error: 'History record not found' });
    }

    // Try to revert the stock
    const item = await Item.findOne({ id: historyRecord.itemId });
    if (item) {
      if (historyRecord.type === 'IN') {
        item.currentStock -= historyRecord.totalPieces;
        // Don't go below 0 on undo
        if (item.currentStock < 0) item.currentStock = 0;
      } else if (historyRecord.type === 'OUT') {
        item.currentStock += historyRecord.totalPieces;
      }
      // If type is 'SET', we cannot safely revert, so we just delete the log.

      await item.save();
    }

    await History.findByIdAndDelete(id);

    res.status(200).json({ success: true, message: 'Record deleted and stock reverted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete history record' });
  }
});

// Update Item Settings
app.put('/api/inventory/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { perBox, minLimit } = req.body;

    const item = await Item.findOne({ id });
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    if (perBox !== undefined) item.perBox = perBox;
    if (minLimit !== undefined) item.minLimit = minLimit;

    await item.save();
    res.status(200).json({ success: true, item });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update item settings' });
  }
});

app.use(express.static(path.join(process.cwd(), '../frontend/dist')));
app.get('*', (req, res) => {
  res.sendFile(path.join(process.cwd(), '../frontend/dist/index.html'));
});

app.listen(port, () => {
  console.log(`Backend server listening at http://localhost:${port}`);
});
