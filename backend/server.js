import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { getDb } from './db.js';
import { upload } from './middleware/upload.js';
import {
  importCsv, exportCsv, getProducts, searchProducts,
  updateProduct, getHistory, addProduct, deleteProduct
} from './controllers/productsController.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: process.env.FRONTEND_URL, credentials: false }));
app.use(express.json());

app.get('/', (_, res) => res.send('Inventory API OK'));

app.post('/api/products/import', upload.single('file'), importCsv);
app.get('/api/products/export', exportCsv);

app.get('/api/products', getProducts);
app.get('/api/products/search', searchProducts);

app.post('/api/products', addProduct);
app.put('/api/products/:id', updateProduct);
app.delete('/api/products/:id', deleteProduct);

app.get('/api/products/:id/history', getHistory);

getDb().close();

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});