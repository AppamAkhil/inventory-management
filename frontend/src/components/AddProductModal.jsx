import React, { useState } from 'react';
import { api } from '../api/client';
import { toast } from 'react-hot-toast';

export default function AddProductModal({ onClose, onAdded }) {
  const [form, setForm] = useState({
    name: '', unit: '', category: '', brand: '', stock: 0, status: 'Out of Stock', image: ''
  });

  function update(k, v) { setForm(prev => ({ ...prev, [k]: v })); }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const payload = { ...form, stock: Number(form.stock) };
      console.log("Submitting payload:", payload);
        if (payload.stock > 0 && payload.status !== 'In Stock') payload.status = 'In Stock';
      const { data } = await api.post('/api/products', payload);
      toast.success('Product added');
      onAdded(data);
      onClose();
    } catch (e) {
      toast.error(e.response?.data?.error || 'Failed to add product');
    }
  }

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <div className="modal-header">
          <div style={{ fontWeight: 600 }}>Add New Product</div>
          <button className="button" onClick={onClose}>Close</button>
        </div>
        <form className="modal-form" onSubmit={handleSubmit}>
          <input className="input" placeholder="Name" value={form.name} onChange={e => update('name', e.target.value)} />
          <input className="input" placeholder="Unit (e.g., pcs, kg)" value={form.unit} onChange={e => update('unit', e.target.value)} />
          <input className="input" placeholder="Category" value={form.category} onChange={e => update('category', e.target.value)} />
          <input className="input" placeholder="Brand" value={form.brand} onChange={e => update('brand', e.target.value)} />
          <input className="input" type="number" min="0" placeholder="Stock" value={form.stock} onChange={e => update('stock', e.target.value)} />
          <select className="select" value={form.status} onChange={e => update('status', e.target.value)}>
            <option>In Stock</option>
            <option>Out of Stock</option>
          </select>
          <input className="input" placeholder="Image URL (optional)" value={form.image} onChange={e => update('image', e.target.value)} />
          <div className="modal-actions">
            <button type="button" className="button" onClick={onClose}>Cancel</button>
            <button type="submit" className="button primary">Add</button>
          </div>
        </form>
      </div>
    </div>
  );
}