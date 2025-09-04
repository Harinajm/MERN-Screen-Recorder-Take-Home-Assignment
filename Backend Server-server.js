const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('uploads')); // Serve uploaded files statically

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Initialize SQLite database
const db = new sqlite3.Database(process.env.DATABASE_URL || './recordings.db', (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database');
    
    // Create recordings table if it doesn't exist
    db.run(`
      CREATE TABLE IF NOT EXISTS recordings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        filename TEXT NOT NULL,
        size INTEGER NOT NULL,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `, (err) => {
      if (err) {
        console.error('Error creating table:', err.message);
      } else {
        console.log('Recordings table ready');
      }
    });
  }
});

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const extension = path.extname(file.originalname) || '.webm';
    cb(null, `recording-${timestamp}${extension}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept video files
    if (file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only video files are allowed'), false);
    }
  }
});

// API Routes

// GET /api/recordings - List all recordings
app.get('/api/recordings', (req, res) => {
  db.all(
    'SELECT id, title, filename, size, createdAt FROM recordings ORDER BY createdAt DESC',
    [],
    (err, rows) => {
      if (err) {
        console.error('Database error:', err.message);
        res.status(500).json({ error: 'Failed to fetch recordings' });
        return;
      }
      res.json(rows);
    }
  );
});

// POST /api/recordings - Upload a new recording
app.post('/api/recordings', upload.single('recording'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const { title, size } = req.body;
  const filename = req.file.filename;

  // Insert recording metadata into database
  db.run(
    'INSERT INTO recordings (title, filename, size) VALUES (?, ?, ?)',
    [title || filename, filename, parseInt(size) || req.file.size],
    function(err) {
      if (err) {
        console.error('Database error:', err.message);
        // Clean up uploaded file if database insertion fails
        fs.unlink(req.file.path, (unlinkErr) => {
          if (unlinkErr) console.error('Error cleaning up file:', unlinkErr);
        });
        res.status(500).json({ error: 'Failed to save recording metadata' });
        return;
      }

      res.status(201).json({
        id: this.lastID,
        title: title || filename,
        filename: filename,
        size: parseInt(size) || req.file.size,
        message: 'Recording uploaded successfully'
      });
    }
  );
});

// GET /api/recordings/:id - Stream or download a specific recording
app.get('/api/recordings/:id', (req, res) => {
  const recordingId = parseInt(req.params.id);

  if (isNaN(recordingId)) {
    return res.status(400).json({ error: 'Invalid recording ID' });
  }

  db.get(
    'SELECT filename, title FROM recordings WHERE id = ?',
    [recordingId],
    (err, row) => {
      if (err) {
        console.error('Database error:', err.message);
        res.status(500).json({ error: 'Database error' });
        return;
      }

      if (!row) {
        res.status(404).json({ error: 'Recording not found' });
        return;
      }

      const filePath = path.join(uploadsDir, row.filename);

      // Check if file exists
      if (!fs.existsSync(filePath)) {
        res.status(404).json({ error: 'Recording file not found on disk' });
        return;
      }

      const stat = fs.statSync(filePath);
      const fileSize = stat.size;
      const range = req.headers.range;

      if (range) {
        // Handle range requests for video streaming
        const parts = range.replace(/bytes=/, "").split("-");
        const start = parseInt(parts[0], 10);
        const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
        const chunksize = (end - start) + 1;
        const file = fs.createReadStream(filePath, { start, end });
        
        const head = {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunksize,
          'Content-Type': 'video/webm',
        };
        
        res.writeHead(206, head);
        file.pipe(res);
      } else {
        // Send entire file
        const head = {
          'Content-Length': fileSize,
          'Content-Type': 'video/webm',
          'Content-Disposition': `inline; filename="${row.title}"`,
        };
        
        res.writeHead(200, head);
        fs.createReadStream(filePath).pipe(res);
      }
    }
  );
});

// DELETE /api/recordings/:id - Delete a recording
app.delete('/api/recordings/:id', (req, res) => {
  const recordingId = parseInt(req.params.id);

  if (isNaN(recordingId)) {
    return res.status(400).json({ error: 'Invalid recording ID' });
  }

  // First, get the filename to delete the file from disk
  db.get(
    'SELECT filename FROM recordings WHERE id = ?',
    [recordingId],
    (err, row) => {
      if (err) {
        console.error('Database error:', err.message);
        res.status(500).json({ error: 'Database error' });
        return;
      }

      if (!row) {
        res.status(404).json({ error: 'Recording not found' });
        return;
      }

      // Delete the file from disk
      const filePath = path.join(uploadsDir, row.filename);
      fs.unlink(filePath, (unlinkErr) => {
        if (unlinkErr) {
          console.error('Error deleting file:', unlinkErr);
          // Continue with database deletion even if file deletion fails
        }

        // Delete the record from database
        db.run(
          'DELETE FROM recordings WHERE id = ?',
          [recordingId],
          function(err) {
            if (err) {
              console.error('Database error:', err.message);
              res.status(500).json({ error: 'Failed to delete recording' });
              return;
            }

            if (this.changes === 0) {
              res.status(404).json({ error: 'Recording not found' });
              return;
            }

            res.json({ message: 'Recording deleted successfully' });
          }
        );
      });
    }
  );
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 100MB.' });
    }
  }
  
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Shutting down server...');
  db.close((err) => {
    if (err) {
      console.error('Error closing database:', err.message);
    } else {
      console.log('Database connection closed.');
    }
    process.exit(0);
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
