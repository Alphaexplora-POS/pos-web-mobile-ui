const formatPeso = new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
});

export const formatCurrency = (amount: number): string => {
  return formatPeso.format(amount);
};

export const formatAmount = (amount: number): string => formatCurrency(amount);