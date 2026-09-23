interface OwnerOnlyBadgeProps {
  label?: string;
}

const OwnerOnlyBadge: React.FC<OwnerOnlyBadgeProps> = ({ label = 'Owner only' }) => {
  return (
    <span className="text-xs px-2 py-1 rounded bg-warning/10 text-warning inline-flex items-center gap-1">
      {label}
    </span>
  );
};

export default OwnerOnlyBadge;
