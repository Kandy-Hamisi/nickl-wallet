export const formatDate = (dateString: string) => {
  // format date nicely
  // example: from this 👉 2025-05-20 to this 👉 May 20, 2025
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

export const formatAmount = (amount: number) => {
  return Math.abs(amount).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};
