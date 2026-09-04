import type { Transaction } from '../models/transactionTypes';

interface TransactionDetailProps {
  transaction: Transaction;
}

const TransactionDetail: React.FC<TransactionDetailProps> = ({ transaction }) => {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Transaction Details</h3>
        <span className="text-sm text-gray-500">
          {new Date(transaction.timestamp).toLocaleString()}
        </span>
      </div>
      <p className="text-sm text-gray-600 mb-4">Branch: {transaction.branchName}</p>
      <table className="w-full text-sm mb-4">
        <thead>
          <tr className="text-left text-gray-500 border-b">
            <th className="py-2">Item</th>
            <th>SKU</th>
            <th>Qty</th>
            <th>Unit Price</th>
            <th>Discount</th>
          </tr>
        </thead>
        <tbody>
          {transaction.items.map((item, i) => (
            <tr key={i} className="border-b">
              <td className="py-2">{item.productName}</td>
              <td>{item.variantSku}</td>
              <td>{item.quantity}</td>
              <td>${item.unitPrice}</td>
              <td>${item.discount}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="space-y-1 text-sm text-gray-600">
        <p>Subtotal: ${transaction.subtotal}</p>
        <p>Discounts: -${transaction.discountTotal}</p>
        <p>Payment: {transaction.paymentMethod}</p>
        <p className="font-semibold text-gray-900">Total: ${transaction.total}</p>
      </div>
    </div>
  );
};

export default TransactionDetail;
