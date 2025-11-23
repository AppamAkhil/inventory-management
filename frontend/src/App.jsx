import React, { useRef, useState } from 'react';
import Header from './components/Header';
import ProductsTable from './components/ProductsTable';
import InventoryHistoryPanel from './components/InventoryHistoryPanel';
import AddProductModal from './components/AddProductModal';
import useProducts from './hooks/useProducts';
import { api } from './api/client';
import toast, { Toaster } from 'react-hot-toast';

export default function App() {
  const {
    products, setProducts,
    categories, categoryFilter, setCategoryFilter,
    searchQuery, setSearchQuery,
    loading,
    selectedProduct, setSelectedProduct,
    history, fetchHistory,
    page, setPage, total, limit,
    refresh
  } = useProducts();

  const [showAddModal, setShowAddModal] = useState(false);
  const fileInputRef = useRef(null);

  function openImport() {
    fileInputRef.current?.click();
  }

  async function handleImportFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);

    try {
      const { data } = await api.post('/api/products/import', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success(`Imported: ${data.added}, Skipped: ${data.skipped}`);
      if (data.duplicates?.length) toast(`Duplicates: ${data.duplicates.length}`, { icon: '⚠️' });
      await refresh();
    } catch (e) {
      toast.error('Import failed');
    } finally {
      e.target.value = '';
    }
  }

  async function handleExport() {
    try {
      const res = await api.get('/api/products/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'products.csv');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch {
      toast.error('Export failed');
    }
  }

  function onSelectProduct(p) {
    setSelectedProduct(p);
    fetchHistory(p.id);
  }

  function onAdded(newProduct) {
    setProducts([newProduct, ...products]);
  }

  return (
    <div>
      <Toaster position="top-right" />
      <div className="container">
        <Header
          searchQuery={searchQuery} setSearchQuery={setSearchQuery}
          categories={categories} categoryFilter={categoryFilter} setCategoryFilter={setCategoryFilter}
          onAdd={() => setShowAddModal(true)} onImport={openImport} onExport={handleExport}
        />

        <ProductsTable
          products={products}
          setProducts={setProducts}
          loading={loading}
          onSelectProduct={onSelectProduct}
        />

        <div className="pagination">
          <button className="button" onClick={() => setPage(Math.max(1, page-1))} disabled={page === 1}>Prev</button>
          <span style={{ fontSize: 12, color: '#6b7280' }}>
            Page {page} of {Math.max(1, Math.ceil(total / limit))}
          </span>
          <button className="button" onClick={() => setPage(page+1)} disabled={page >= Math.ceil(total/limit)}>Next</button>
        </div>

        <input ref={fileInputRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={handleImportFile} />
      </div>

      {showAddModal && <AddProductModal onClose={() => setShowAddModal(false)} onAdded={onAdded} />}

      {selectedProduct && (
        <InventoryHistoryPanel
          product={selectedProduct}
          history={history}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </div>
  );
}