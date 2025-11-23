export function validateProductPayload(body) {
  const required = ['name', 'unit', 'category', 'brand', 'stock', 'status'];
  for (const key of required) {
    if (body[key] === undefined || body[key] === null || body[key] === '') {
      return { ok: false, message: `Field '${key}' is required.` };
    }
  }
  const stock = Number(body.stock);
  if (!Number.isFinite(stock) || stock < 0) {
    return { ok: false, message: 'Stock must be a number ≥ 0.' };
  }
  if (!['In Stock', 'Out of Stock'].includes(body.status)) {
    return { ok: false, message: "Status must be 'In Stock' or 'Out of Stock'." };
  }
  return { ok: true, stock };
}