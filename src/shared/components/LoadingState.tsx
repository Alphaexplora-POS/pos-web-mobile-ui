interface LoadingStateProps {
  label?: string;
}

const LoadingState: React.FC<LoadingStateProps> = ({ label = 'Loading...' }) => {
  return (
    <div className="flex items-center justify-center py-16 text-ink-muted">{label}</div>
  );
};

export default LoadingState;
