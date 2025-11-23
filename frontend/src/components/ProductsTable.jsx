import React, { useState } from 'react';
import InlineEditorRow from './InlineEditorRow';
import { api } from '../api/client';
import { toast } from 'react-hot-toast';

export default function ProductsTable({ products, setProducts, loading, onSelectProduct }) {
  const [editingId, setEditingId] = useState(null);

  async function handleSave(id, data) {
    const prev = [...products];
    const idx = products.findIndex(p => p.id === id);
    const optimistic = [...products];
    optimistic[idx] = { ...optimistic[idx], ...data };
    setProducts(optimistic);

    try {
      const { data: updated } = await api.put(`/api/products/${id}`, { ...data, stock: Number(data.stock) });
      const final = [...optimistic];
      final[idx] = updated;
      setProducts(final);
      toast.success('Product updated');
      setEditingId(null);
    } catch (e) {
      toast.error(e.response?.data?.error || 'Update failed');
      setProducts(prev);
    }
  }

  async function handleDelete(id) {
    const prev = [...products];
    setProducts(products.filter(p => p.id !== id));
    try {
      await api.delete(`/api/products/${id}`);
      toast.success('Product deleted');
    } catch (e) {
      toast.error('Delete failed');
      setProducts(prev);
    }
  }

  return (
    <div className="card">
      <table className="table">
        <thead>
          <tr>
            <th>Image</th>
            <th>Name</th>
            <th>Unit</th>
            <th>Category</th>
            <th>Brand</th>
            <th>Stock</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {loading && (
            <tr><td className="loading" colSpan="8">Loading...</td></tr>
          )}
          {!loading && products.length === 0 && (
            <tr><td className="empty" colSpan="8">No products found</td></tr>
          )}
          {!loading && products.map(p => (
            editingId === p.id ? (
              <InlineEditorRow
                key={p.id}
                product={p}
                onCancel={() => setEditingId(null)}
                onSave={(data) => handleSave(p.id, data)}
              />
            ) : (
              <tr key={p.id} onClick={() => onSelectProduct(p)}>
                <td onClick={(e) => e.stopPropagation()}>
                  {p.image ? <img src={p.image} alt="" className="img" /> : <div className="img" />}
                </td>
                <td>{p.name}</td>
                <td>{p.unit}</td>
                <td>{p.category}</td>
                <td>{p.brand}</td>
                <td>{p.stock}</td>
                <td>
                  <span className={`badge ${p.status === 'In Stock' ? 'green' : 'red'}`}>
                    {p.status}
                  </span>
                </td>
                <td onClick={(e) => e.stopPropagation()}>
                  <div className="actions">
                    <button className="button warn" onClick={() => setEditingId(p.id)}>Edit</button>
                    <button className="button danger" onClick={() => handleDelete(p.id)}>Delete</button>
                  </div>
                </td>
              </tr>
            )
          ))}
        </tbody>
      </table>
    </div>
  );
}