interface TableEmptyStateProps {
  message: string;
}

const TableEmptyState: React.FC<TableEmptyStateProps> = ({ message }) => (
  <div className="flex min-h-96 items-center justify-center py-12">
    <p className="text-sm text-ink-muted">{message}</p>
  </div>
);

export default TableEmptyState;