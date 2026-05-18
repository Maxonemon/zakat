export const formatMoney = (amount: number) =>
  new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(amount);
