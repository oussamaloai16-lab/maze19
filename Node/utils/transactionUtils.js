// utils/transactionUtils.js
export const generateTransactionId = () => {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  
  return `TRX-${year}${month}${day}-${random}`;
};

export const formatAmount = (amount) => {
  return new Intl.NumberFormat('fr-DZ', {
    style: 'currency',
    currency: 'DZD',
    minimumFractionDigits: 2
  }).format(amount);
};

export const isPositiveAmount = (amount) => {
  return amount >= 0;
};

// Calculate remaining balance for installment transactions
export const calculateRemainingBalance = (transactions) => {
  if (!transactions || !transactions.length) return 0;
  
  // Get total of all completed transactions
  const totalPaid = transactions
    .filter(t => t.status === 'completed')
    .reduce((sum, t) => sum + t.amount, 0);
    
  // Get the first transaction to determine total expected amount
  // (Assuming first transaction has the total amount in its notes or metadata)
  const firstTransaction = transactions.sort((a, b) => 
    new Date(a.date) - new Date(b.date)
  )[0];
  
  // If we can't determine total, return just total paid amount
  if (!firstTransaction || !firstTransaction.totalAmount) {
    return totalPaid;
  }
  
  return firstTransaction.totalAmount - totalPaid;
};