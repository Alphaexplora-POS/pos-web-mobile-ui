import type { Transaction } from '../models/transactionTypes';
import { formatAmount } from '../../../shared/utils/formatCurrency';

interface TransactionDetailProps {
  transaction: Transaction;
}

const TransactionDetail: React.FC<TransactionDetailProps> = ({ transaction }) => {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-ink-primary">Transaction Details</h3>
        <span className="text-sm text-ink-muted">
          {new Date(transaction.timestamp).toLocaleString()}
        </span>
      </div>
      <p className="text-sm text-ink-secondary mb-4">Branch: {transaction.branchName}</p>
      <div className="flex-1 overflow-x-auto">
        <table className="w-full text-base">
          <thead>
            <tr className="bg-canvas border-b border-line">
              <th className="py-3 pl-4 text-left font-semibold text-ink-muted">Item</th>
              <th className="py-3 text-left font-semibold text-ink-muted">SKU</th>
              <th className="py-3 text-left font-semibold text-ink-muted">Qty</th>
              <th className="py-3 text-left font-semibold text-ink-muted">Unit Price</th>
              <th className="py-3 pr-4 text-left font-semibold text-ink-muted">Discount</th>
            </tr>
          </thead>
          <tbody>
            {transaction.items.map((item, i) => (
              <tr key={i} className="border-b border-line last:border-0 hover:bg-canvas transition-colors">
                <td className="py-3.5 pl-4">{item.productName}</td>
                <td className="py-3.5">{item.variantSku}</td>
                <td className="py-3.5">{item.quantity}</td>
                <td className="py-3.5">${formatAmount(item.unitPrice)}</td>
                <td className="py-3.5 pr-4">${formatAmount(item.discount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-4 border-t border-line pt-4 grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
        <div>
          <p className="text-ink-muted">Subtotal</p>
          <p className="font-medium text-ink-primary">${formatAmount(transaction.subtotal)}</p>
        </div>
        <div>
          <p className="text-ink-muted">Discounts</p>
          <p className="font-medium text-ink-primary">-${formatAmount(transaction.discountTotal)}</p>
        </div>
        <div>
          <p className="text-ink-muted">Payment</p>
          <p className="font-medium text-ink-primary">{transaction.paymentMethod}</p>
        </div>
        <div>
          <p className="text-ink-muted">Total</p>
          <p className="font-semibold text-ink-primary">${formatAmount(transaction.total)}</p>
        </div>
      </div>
    </div>
  );
};

export default TransactionDetail;