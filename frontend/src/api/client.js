import axios from 'axios';

export const api = axios.create({
  baseURL: "https://inventory-backend-0xec.onrender.com/api",
  headers: { 'Content-Type': 'application/json' }
});