import React from 'react';

export default function Header({ searchQuery, setSearchQuery, categories, categoryFilter, setCategoryFilter, onAdd, onImport, onExport }) {
  return (
    <div className="header">
      <div className="header-left">
        <input
          className="input"
          placeholder="Search products..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <select
          className="select"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
        >
          <option value="">All categories</option>
          {categories.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <button className="button primary" onClick={onAdd}>Add New Product</button>
      </div>

      <div className="header-right">
        <button className="button" onClick={onImport}>Import</button>
        <button className="button" onClick={onExport}>Export</button>
      </div>
    </div>
  );
}