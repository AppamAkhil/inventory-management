import { getDb } from '../db.js';
import { parseCsv } from '../utils/csv.js';
import { validateProductPayload } from '../utils/validators.js';

function normalizeName(name) {
  return String(name || '').trim().toLowerCase();
}

export async function importCsv(req, res) {
  try {
    if (!req.file) return res.status(400).json({ error: 'CSV file is required' });
    const records = await parseCsv(req.file.buffer);

    const db = getDb();
    const duplicates = [];
    let added = 0;
    let skipped = 0;

    await new Promise((resolve, reject) => {
      db.serialize(() => {
        db.run('BEGIN TRANSACTION');
        const stmt = db.prepare(
          `INSERT INTO products (name, unit, category, brand, stock, status, image)
           VALUES (?, ?, ?, ?, ?, ?, ?)`
        );
        const checkStmt = db.prepare(`SELECT id FROM products WHERE lower(name) = ?`);

        let pending = records.length;
        if (pending === 0) {
          stmt.finalize();
          checkStmt.finalize();
          db.run('COMMIT', (err) => (err ? reject(err) : resolve()));
          return;
        }

        for (const r of records) {
          const name = r.name?.trim();
          const unit = r.unit?.trim();
          const category = r.category?.trim();
          const brand = r.brand?.trim();
          const stockNum = Number(r.stock ?? 0);
          const status = r.status?.trim() || (stockNum > 0 ? 'In Stock' : 'Out of Stock');
          const image = r.image?.trim() || null;

          if (!name || !unit || !category || !brand || stockNum < 0) {
            skipped++;
            if (--pending === 0) finalize();
            continue;
          }

          checkStmt.get([normalizeName(name)], (err, row) => {
            if (err) return done(err);
            if (row) {
              duplicates.push({ name, existingId: row.id });
              skipped++;
              return done();
            } else {
              stmt.run([name, unit, category, brand, stockNum, status, image], (err2) => {
                if (err2) return done(err2);
                added++;
                return done();
              });
            }
          });
        }

        function done(err) {
          if (err) return reject(err);
          if (--pending === 0) finalize();
        }

        function finalize() {
          stmt.finalize();
          checkStmt.finalize();
          db.run('COMMIT', (err) => (err ? reject(err) : resolve()));
        }
      });
    });

    res.json({ added, skipped, duplicates });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to import CSV' });
  }
}

export function exportCsv(req, res) {
  const db = getDb();
  db.all(`SELECT name, unit, category, brand, stock, status, image FROM products ORDER BY name ASC`, (err, rows) => {
    if (err) return res.status(500).send('DB error');

    const headers = ['name', 'unit', 'category', 'brand', 'stock', 'status', 'image'];
    const csv = [
      headers.join(','),
      ...rows.map(r =>
        headers.map(h => {
          const val = r[h] ?? '';
          const needsQuote = /[",\n]/.test(String(val));
          const escaped = String(val).replace(/"/g, '""');
          return needsQuote ? `"${escaped}"` : escaped;
        }).join(',')
      )
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="products.csv"');
    res.send(csv);
  });
}

export function getProducts(req, res) {
  const { page = 1, limit = 20, category, sort = 'name', dir = 'asc' } = req.query;
  const offset = (Number(page) - 1) * Number(limit);

  const db = getDb();
  const where = [];
  const params = [];

  if (category) {
    where.push('category = ?');
    params.push(category);
  }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const orderSql = `ORDER BY ${['name','brand','category','stock','status'].includes(sort) ? sort : 'name'} ${dir === 'desc' ? 'DESC' : 'ASC'}`;

  db.all(
    `SELECT * FROM products ${whereSql} ${orderSql} LIMIT ? OFFSET ?`,
    [...params, Number(limit), Number(offset)],
    (err, rows) => {
      if (err) return res.status(500).json({ error: 'DB error' });

      db.get(`SELECT COUNT(*) as total FROM products ${whereSql}`, params, (e2, countRow) => {
        if (e2) return res.status(500).json({ error: 'DB error' });
        res.json({ data: rows, total: countRow.total, page: Number(page), limit: Number(limit) });
      });
    }
  );
}

export function searchProducts(req, res) {
  const { name = '' } = req.query;
  const db = getDb();
  db.all(
    `SELECT * FROM products WHERE lower(name) LIKE ? ORDER BY name ASC`,
    [`%${normalizeName(name)}%`],
    (err, rows) => {
      if (err) return res.status(500).json({ error: 'DB error' });
      res.json(rows);
    }
  );
}

export function updateProduct(req, res) {
  const id = Number(req.params.id);
  const { ok, message, stock } = validateProductPayload(req.body);
  if (!ok) return res.status(400).json({ error: message });

  const { name, unit, category, brand, status, image } = req.body;
  const changedBy = req.user?.email || 'admin';

  const db = getDb();

  db.get(`SELECT * FROM products WHERE id = ?`, [id], (err, existing) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    if (!existing) return res.status(404).json({ error: 'Not found' });

    db.get(`SELECT id FROM products WHERE lower(name) = ? AND id != ?`, [normalizeName(name), id], (e2, dup) => {
      if (e2) return res.status(500).json({ error: 'DB error' });
      if (dup) return res.status(409).json({ error: 'Name must be unique' });

      db.run(
        `UPDATE products SET name=?, unit=?, category=?, brand=?, stock=?, status=?, image=? WHERE id=?`,
        [name, unit, category, brand, stock, status, image || existing.image, id],
        function (e3) {
          if (e3) return res.status(500).json({ error: 'DB error' });

          if (Number(existing.stock) !== Number(stock)) {
            db.run(
              `INSERT INTO inventory_logs (productId, oldStock, newStock, changedBy)
               VALUES (?, ?, ?, ?)`,
              [id, Number(existing.stock), Number(stock), changedBy]
            );
          }

          db.get(`SELECT * FROM products WHERE id = ?`, [id], (e4, updated) => {
            if (e4) return res.status(500).json({ error: 'DB error' });
            res.json(updated);
          });
        }
      );
    });
  });
}

export function getHistory(req, res) {
  const id = Number(req.params.id);
  const db = getDb();
  db.all(
    `SELECT productId, oldStock, newStock, changedBy, timestamp
     FROM inventory_logs WHERE productId = ? ORDER BY timestamp DESC`,
    [id],
    (err, rows) => {
      if (err) return res.status(500).json({ error: 'DB error' });
      res.json(rows);
    }
  );
}

export function addProduct(req, res) {
  const { ok, message, stock } = validateProductPayload(req.body);
  if (!ok) return res.status(400).json({ error: message });
  const { name, unit, category, brand, status, image } = req.body;
  const db = getDb();

  db.get(`SELECT id FROM products WHERE lower(name) = ?`, [name.trim().toLowerCase()], (err, row) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    if (row) return res.status(409).json({ error: 'Name must be unique' });

    db.run(
      `INSERT INTO products (name, unit, category, brand, stock, status, image)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [name, unit, category, brand, stock, status, image || null],
      function (e2) {
        if (e2) return res.status(500).json({ error: 'DB error' });
        db.get(`SELECT * FROM products WHERE id = ?`, [this.lastID], (e3, created) => {
          if (e3) return res.status(500).json({ error: 'DB error' });
          res.status(201).json(created);
        });
      }
    );
  });
}

export function deleteProduct(req, res) {
  const id = Number(req.params.id);
  const db = getDb();
  db.run(`DELETE FROM products WHERE id = ?`, [id], function (err) {
    if (err) return res.status(500).json({ error: 'DB error' });
    if (this.changes === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true });
  });
}