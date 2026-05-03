require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

const pool = new Pool({
    user: process.env.PGUSER,
    host: process.env.PGHOST,
    database: process.env.PGDATABASE,
    password: process.env.PGPASSWORD,
    port: 5432,
    ssl: {
        rejectUnauthorized: false, // Use with caution in production, consider proper certs
    },
});

app.use(express.json());

// Serve static files from the root directory (where index.html is)
app.use(express.static(path.join(__dirname, '..')))

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// Simple API to test database connection
app.get('/api/test-db', async (req, res) => {
    try {
        const client = await pool.connect();
        const result = await client.query('SELECT NOW()');
        client.release();
        res.status(200).json({ message: 'Database connected successfully', time: result.rows[0].now });
    } catch (err) {
        console.error('Error connecting to database', err);
        res.status(500).json({ error: 'Failed to connect to database', details: err.message });
    }
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
