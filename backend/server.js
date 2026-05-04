require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

const pool = new Pool({
    user: 'neondb_owner',
    host: 'ep-holy-queen-ach696nd-pooler.sa-east-1.aws.neon.tech',
    database: 'tienda',
    password: 'npg_InvmXJ9oR8Pk',
    port: 5432,
    ssl: {
        rejectUnauthorized: false,
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

// Function to generate random product data
const generateRandomProduct = () => {
    const productNames = ["Limpiador Multiusos", "Detergente Líquido", "Suavizante de Telas", "Lavaplatos", "Desinfectante", "Limpiacristales", "Cera para Pisos", "Ambientador", "Blanqueador", "Jabón en Barra"];
    const descriptions = ["Eficaz contra la suciedad.", "Deja tu ropa impecable.", "Aroma fresco y duradero.", "Poder desengrasante.", "Elimina el 99.9% de gérmenes.", "Brillo sin manchas.", "Protección y brillo.", "Fragancia agradable.", "Para una blancura radiante.", "Limpieza profunda."];
    const randomName = productNames[Math.floor(Math.random() * productNames.length)];
    const randomDescription = descriptions[Math.floor(Math.random() * descriptions.length)];
    const randomPrice = (Math.random() * 20 + 5).toFixed(2); // Price between 5 and 25
    const randomStock = Math.floor(Math.random() * 100 + 10); // Stock between 10 and 110

    return {
        name: randomName,
        description: randomDescription,
        price: parseFloat(randomPrice),
        stock: randomStock,
        category: "Limpieza",
    };
};

// API to insert 10 random products
app.post("/api/insert-products", async (req, res) => {
    try {
        const client = await pool.connect();
        // Check if the table exists, if not, create it
        await client.query(`
            CREATE TABLE IF NOT EXISTS productos (
                id SERIAL PRIMARY KEY,
                nombre VARCHAR(255) NOT NULL,
                descripcion TEXT,
                precio DECIMAL(10, 2) NOT NULL,
                stock INT NOT NULL,
                categoria VARCHAR(255),
                imagen_url VARCHAR(255)
            );
        `);

        const products = Array.from({ length: 10 }, generateRandomProduct);
        for (const product of products) {
            await client.query(
                `INSERT INTO productos (nombre, descripcion, precio, stock, categoria) VALUES ($1, $2, $3, $4, $5)`,
                [product.name, product.description, product.price, product.stock, product.category]
            );
        }

        client.release();
        res.status(200).json({ message: `Se insertaron ${products.length} productos de limpieza exitosamente.` });
    } catch (err) {
        console.error("Error al insertar productos en la base de datos", err);
        res.status(500).json({ error: "Error al insertar productos", details: err.message });
    }
});

// API to insert a single product from form
app.post("/api/productos", async (req, res) => {
    const { nombre, descripcion, precio, stock, categoria, imagen_url } = req.body;
    
    if (!nombre || precio === undefined || stock === undefined) {
        return res.status(400).json({ error: "Faltan campos obligatorios (nombre, precio, stock)" });
    }

    try {
        const client = await pool.connect();
        // Ensure table exists (optional but safe)
        await client.query(`
            CREATE TABLE IF NOT EXISTS productos (
                id SERIAL PRIMARY KEY,
                nombre VARCHAR(255) NOT NULL,
                descripcion TEXT,
                precio DECIMAL(10, 2) NOT NULL,
                stock INT NOT NULL,
                categoria VARCHAR(255),
                imagen_url VARCHAR(255)
            );
        `);

        const query = 'INSERT INTO productos (nombre, descripcion, precio, stock, categoria, imagen_url) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *';
        const values = [nombre, descripcion, precio, stock, categoria, imagen_url];
        
        const result = await client.query(query, values);
        client.release();
        
        res.status(201).json({ message: "Producto creado exitosamente", producto: result.rows[0] });
    } catch (err) {
        console.error("Error al guardar producto", err);
        res.status(500).json({ error: "Error al guardar el producto en la base de datos", details: err.message });
    }
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
