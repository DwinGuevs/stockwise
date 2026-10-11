
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
      service: 'inventory-api',
      version: process.env.APP_VERSION || 'dev',
    });
  } catch (e) {
    res.status(503).json({ error: 'database unavailable' });
  }
});

app.get('/inventory', async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT i.*, p.name, p.sku
       FROM inventory i
       JOIN products p ON p.id = i.product_id
       ORDER BY p.name`
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: 'database error' });
  }
});

app.get('/inventory/low-stock', async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT i.*, p.name, p.sku
       FROM inventory i
       JOIN products p ON p.id = i.product_id
       WHERE i.quantity <= i.low_stock_threshold
       ORDER BY i.quantity`
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: 'database error' });
  }
});

app.get('/inventory/:productId', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT i.*, p.name, p.sku
       FROM inventory i
       JOIN products p ON p.id = i.product_id
       WHERE i.product_id = $1`,
      [req.params.productId]
    );

    rows.length
      ? res.json(rows[0])
      : res.status(404).json({ error: 'inventory not found' });
  } catch (e) {
    res.status(500).json({ error: 'database error' });
  }
});

app.post('/inventory/receive', async (req, res) => {
  const productId = Number(req.body?.productId);
  const quantity = Number(req.body?.quantity);

  if (
    !Number.isInteger(productId) ||
    productId < 1 ||
    !Number.isInteger(quantity) ||
    quantity < 1
  ) {
    return res.status(400).json({
      error: 'positive productId and quantity required',
    });
  }

  try {
    const result = await pool.query(
      `UPDATE inventory
       SET quantity = quantity + $1, updated_at = NOW()
       WHERE product_id = $2`,
      [quantity, productId]
    );

    result.rowCount
      ? res.json({
          message: 'stock received',
          productId,
          quantityAdded: quantity,
        })
      : res.status(404).json({ error: 'product not found' });
  } catch (e) {
    res.status(500).json({ error: 'could not receive stock' });
  }
});

if (require.main === module) {
  app.listen(3002, '0.0.0.0', () => {
    console.log('inventory-api on 3002');
  });
}

module.exports = app;
