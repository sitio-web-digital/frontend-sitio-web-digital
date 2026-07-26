import { useEffect, useState } from 'react';

// Carrito de compras (plantillas de gastronomía, ver Admin de widgets): a
// diferencia de productos/planes/etc. (contenido que arma el DUEÑO del
// negocio y que ve todo el mundo igual), el carrito es del VISITANTE — vive
// en su propio navegador, nunca se guarda en el sitio ni se manda al
// servidor. `cartKey` separa el carrito de una plantilla/negocio de otra,
// para no mezclar pedidos si en la misma sesión se mira más de un sitio.
const STORAGE_PREFIX = 'sitiowebdigital.cart.';

function readCart(cartKey) {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + cartKey);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeCart(cartKey, items) {
  try {
    localStorage.setItem(STORAGE_PREFIX + cartKey, JSON.stringify(items));
  } catch {
    // localStorage puede fallar (modo privado, cuota llena) — el carrito
    // sigue funcionando en memoria para esta visita, solo no persiste.
  }
}

export function useCart(cartKey) {
  const [items, setItems] = useState(() => (cartKey ? readCart(cartKey) : []));

  // Si cambia el negocio que se está mirando (otra plantilla/demo), recarga
  // el carrito correspondiente a esa clave en vez de arrastrar el anterior.
  useEffect(() => {
    setItems(cartKey ? readCart(cartKey) : []);
  }, [cartKey]);

  useEffect(() => {
    if (cartKey) writeCart(cartKey, items);
  }, [cartKey, items]);

  const addItem = (producto) => {
    if (!producto?.id) return;
    setItems((prev) => {
      const existing = prev.find((i) => i.id === producto.id);
      if (existing) {
        return prev.map((i) => (i.id === producto.id ? { ...i, cantidad: i.cantidad + 1 } : i));
      }
      return [...prev, { id: producto.id, nombre: producto.nombre, precio: Number(producto.precio) || 0, cantidad: 1 }];
    });
  };

  const setQty = (id, cantidad) => {
    const qty = Math.max(0, Math.trunc(cantidad));
    setItems((prev) => (qty === 0 ? prev.filter((i) => i.id !== id) : prev.map((i) => (i.id === id ? { ...i, cantidad: qty } : i))));
  };

  const increment = (id) => setItems((prev) => prev.map((i) => (i.id === id ? { ...i, cantidad: i.cantidad + 1 } : i)));
  const decrement = (id) =>
    setItems((prev) =>
      prev.flatMap((i) => (i.id === id ? (i.cantidad <= 1 ? [] : [{ ...i, cantidad: i.cantidad - 1 }]) : [i]))
    );
  const removeItem = (id) => setItems((prev) => prev.filter((i) => i.id !== id));
  const clear = () => setItems([]);

  const count = items.reduce((acc, i) => acc + i.cantidad, 0);
  const total = items.reduce((acc, i) => acc + i.cantidad * i.precio, 0);

  return { items, addItem, setQty, increment, decrement, removeItem, clear, count, total };
}
