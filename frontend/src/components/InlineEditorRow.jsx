import React, { useState } from 'react';

export default function InlineEditorRow({ product, onCancel, onSave }) {
  const [form, setForm] = useState({
    name: product.name,
    unit: product.unit,
    category: product.category,
    brand: product.brand,
    stock: product.stock,
    status: product.status,
    image: product.image || ''
  });

  function updateField(k, v) {
    setForm(prev => ({ ...prev, [k]: v }));
  }

  return (
    <tr className="inline-row">
      <td>
        {product.image ? <img src={product.image} alt="" className="img" /> : <div className="img" />}
      </td>
      <td><input className="input" value={form.name} onChange={e => updateField('name', e.target.value)} /></td>
      <td><input className="input" value={form.unit} onChange={e => updateField('unit', e.target.value)} /></td>
      <td><input className="input" value={form.category} onChange={e => updateField('category', e.target.value)} /></td>
      <td><input className="input" value={form.brand} onChange={e => updateField('brand', e.target.value)} /></td>
      <td><input className="input" type="number" min="0" value={form.stock} onChange={e => updateField('stock', e.target.value)} /></td>
      <td>
        <select className="select" value={form.status} onChange={e => updateField('status', e.target.value)}>
          <option>In Stock</option>
          <option>Out of Stock</option>
        </select>
      </td>
      <td>
        <div className="actions">
          <button className="button success" onClick={() => onSave(form)}>Save</button>
          <button className="button" onClick={onCancel}>Cancel</button>
        </div>
      </td>
    </tr>
  );
}