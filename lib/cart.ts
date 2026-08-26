export type CartItem = {
  productId: string;
  name: string;
  slug: string;
  qty: number;
  image: string;
  price: string;
};

export function round2(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function calcPrice(items: CartItem[]) {
  const itemsPrice = round2(
    items.reduce((acc, item) => acc + Number(item.price) * item.qty, 0),
  );
  const shippingPrice = round2(itemsPrice > 200 ? 0 : 20);
  const taxPrice = 0;
  const totalPrice = round2(itemsPrice + taxPrice + shippingPrice);

  return {
    itemsPrice: itemsPrice.toFixed(2),
    shippingPrice: shippingPrice.toFixed(2),
    taxPrice: taxPrice.toFixed(2),
    totalPrice: totalPrice.toFixed(2),
  };
}

export function cartQty(items: CartItem[]) {
  return items.reduce((acc, item) => acc + item.qty, 0);
}
