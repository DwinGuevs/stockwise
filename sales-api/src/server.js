
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
      service: 'sales-api',
      version: process.env.APP_VERSION || 'dev',
    });
  } catch (e) {
    res.status(503).json({ error: 'database unavailable' });
  }
});

app.get('/sales', async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT s.*, p.name, p.sku
       FROM sales s
       JOIN products p ON p.id = s.product_id
       ORDER BY s.id DESC`
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: 'database error' });
  }
});

app.get('/sales/:id', async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT s.*, p.name, p.sku
       FROM sales s
       JOIN products p ON p.id = s.product_id
       WHERE s.id = $1`,
      [req.params.id]
    );

    rows.length
      ? res.json(rows[0])
      : res.status(404).json({ error: 'sale not found' });
  } catch (e) {
    res.status(500).json({ error: 'database error' });
  }
});

app.post('/sales', async (req, res) => {
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

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const productResult = await client.query(
      'SELECT id, price FROM products WHERE id = $1',
      [productId]
    );

    if (productResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'product not found' });
    }

    const inventoryResult = await client.query(
      'SELECT quantity FROM inventory WHERE product_id = $1 FOR UPDATE',
      [productId]
    );

    if (
      inventoryResult.rows.length === 0 ||
      inventoryResult.rows[0].quantity < quantity
    ) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'insufficient stock' });
    }

    const unitPrice = Number(productResult.rows[0].price);
    const totalAmount = Number((unitPrice * quantity).toFixed(2));

    const saleResult = await client.query(
      `INSERT INTO sales
         (product_id, quantity, unit_price, total_amount)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [productId, quantity, unitPrice, totalAmount]
    );

    await client.query(
      `UPDATE inventory
       SET quantity = quantity - $1, updated_at = NOW()
       WHERE product_id = $2`,
      [quantity, productId]
    );

    await client.query('COMMIT');

    res.status(201).json({
      id: saleResult.rows[0].id,
      productId,
      quantity,
      unitPrice,
      totalAmount,
    });
  } catch (e) {
    try {
      await client.query('ROLLBACK');
    } catch (_) {
      // Ignore rollback errors if the transaction has already ended.
    }

    res.status(500).json({ error: 'could not record sale' });
  } finally {
    client.release();
  }
});

if (require.main === module) {
  app.listen(3003, '0.0.0.0', () => {
    console.log('sales-api on 3003');
  });
}

module.exports = app;
