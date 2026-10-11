
const express = require('express');
const { Pool } = require('pg');

const app = express();
app.use(express.json());

const pool = new Pool({
  host: process.env.DB_HOST || 'db',
  user: process.env.DB_USER || 'stockwise',
  password: process.env.DB_PASSWORD || 'stockwise_dev',
  database: process.env.DB_NAME || 'stockwise',
  port: Number(process.env.DB_PORT) || 5432,
});

app.get('/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({
      status: 'ok',
      service: 'product-api',
      version: process.env.APP_VERSION || 'dev',
    });
  } catch (e) {
    res.status(503).json({ error: 'database unavailable' });
  }
});

app.get('/products', async (_req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM products ORDER BY id DESC'
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: 'database error' });
  }
});

app.get('/products/:id', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM products WHERE id = $1',
      [req.params.id]
    );

    rows.length
      ? res.json(rows[0])
      : res.status(404).json({ error: 'product not found' });
  } catch (e) {
    res.status(500).json({ error: 'database error' });
  }
});

app.post('/products', async (req, res) => {
  const { name, sku, category = 'General', price } = req.body || {};

  if (
    !name ||
    !sku ||
    price === undefined ||
    price === null ||
    price === '' ||
    !Number.isFinite(Number(price)) ||
    Number(price) < 0
  ) {
    return res.status(400).json({
      error: 'name, sku, and non-negative price are required',
    });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const result = await client.query(
      `INSERT INTO products (name, sku, category, price)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [name, sku, category, Number(price)]
    );

    const id = result.rows[0].id;

    await client.query(
      `INSERT INTO inventory (product_id, quantity, low_stock_threshold)
       VALUES ($1, 0, 5)`,
      [id]
    );

    await client.query('COMMIT');

    res.status(201).json({
      id,
      name,
      sku,
      category,
      price: Number(price),
    });
  } catch (e) {
    await client.query('ROLLBACK');

    res.status(e.code === '23505' ? 409 : 500).json({
      error: e.code === '23505'
        ? 'SKU already exists'
        : 'could not create product',
    });
  } finally {
    client.release();
  }
});

app.put('/products/:id', async (req, res) => {
  const { name, sku, category = 'General', price } = req.body || {};

  if (
    !name ||
    !sku ||
    price === undefined ||
    price === null ||
    price === '' ||
    !Number.isFinite(Number(price)) ||
    Number(price) < 0
  ) {
    return res.status(400).json({
      error: 'valid name, sku, and price required',
    });
  }

  try {
    const result = await pool.query(
      `UPDATE products
       SET name = $1, sku = $2, category = $3, price = $4
       WHERE id = $5`,
      [name, sku, category, Number(price), req.params.id]
    );

    result.rowCount
      ? res.json({ message: 'updated' })
      : res.status(404).json({ error: 'product not found' });
  } catch (e) {
    res.status(e.code === '23505' ? 409 : 500).json({
      error: e.code === '23505'
        ? 'SKU already exists'
        : 'could not update product',
    });
  }
});

app.delete('/products/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM products WHERE id = $1',
      [req.params.id]
    );

    result.rowCount
      ? res.json({ message: 'deleted' })
      : res.status(404).json({ error: 'product not found' });
  } catch (e) {
    res.status(409).json({
      error: 'product may have inventory or sales history',
    });
  }
});

if (require.main === module) {
  app.listen(3001, '0.0.0.0', () => {
    console.log('product-api on 3001');
  });
}

module.exports = app;
