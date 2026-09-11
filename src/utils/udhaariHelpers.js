// Centralizes paid/remaining/status logic so Dashboard and Udhaari
// pages can never drift out of sync with each other.

export const getPaidAmount = (item) => {
  if (item.paidAmount !== undefined && item.paidAmount !== null) {
    return Number(item.paidAmount);
  }
  // Legacy records created before paidAmount existed - approximate
  // from the old manually-set status field so nothing breaks.
  const amount = Number(item.amount || 0);
  if (item.status === "Settled") return amount;
  if (item.status === "Half Paid") return amount / 2;
  return 0;
};

export const getRemainingAmount = (item) => {
  const remaining = Number(item.amount || 0) - getPaidAmount(item);
  return remaining > 0 ? remaining : 0;
};

export const deriveStatus = (item) => {
  const paid = getPaidAmount(item);
  const amount = Number(item.amount || 0);
  if (paid <= 0) return "Pending";
  if (paid >= amount) return "Settled";
  return "Half Paid";
};

export const sumRemainingByType = (udhaariList, type) =>
  udhaariList
    .filter((i) => i.type === type && deriveStatus(i) !== "Settled")
    .reduce((acc, curr) => acc + getRemainingAmount(curr), 0);