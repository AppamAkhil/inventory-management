import { useEffect, useMemo, useState } from 'react';
import { api } from '../api/client';

export default function useProducts() {
  const [products, setProducts] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [history, setHistory] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  const categories = useMemo(() => {
    const s = new Set(products.map(p => p.category));
    return Array.from(s).sort();
  }, [products]);

  async function fetchProducts() {
    setLoading(true);
    try {
      if (searchQuery) {
        const { data } = await api.get(`/api/products/search`, { params: { name: searchQuery } });
        setProducts(data);
        setTotal(data.length);
      } else {
        const { data } = await api.get(`/api/products`, { params: { page, limit, category: categoryFilter || undefined } });
        setProducts(data.data);
        setTotal(data.total);
      }
    } finally {
      setLoading(false);
    }
  }

  async function fetchHistory(id) {
    try {
      const { data } = await api.get(`/api/products/${id}/history`);
      setHistory(data);
    } catch {
      setHistory([]);
    }
  }

  useEffect(() => { fetchProducts(); }, [searchQuery, categoryFilter, page]);

  return {
    products, setProducts,
    categories, categoryFilter, setCategoryFilter,
    searchQuery, setSearchQuery,
    loading,
    selectedProduct, setSelectedProduct,
    history, fetchHistory,
    page, setPage, total, limit,
    refresh: fetchProducts
  };
}