interface LoadingButtonProps {
  loading: boolean;
  loadingLabel: string;
  children: string;
  className?: string;
  type?: 'submit' | 'button';
  onClick?: () => void;
}

const LoadingButton: React.FC<LoadingButtonProps> = ({ loading, loadingLabel, children, className = '', type = 'submit', onClick }) => {
  return (
    <button
      type={type}
      disabled={loading}
      onClick={onClick}
      className={`bg-brand text-white px-4 py-2 rounded-md hover:bg-brand-dark transition-colors disabled:opacity-70 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2 ${className}`}
    >
      {loading && (
        <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      )}
      {loading ? loadingLabel : children}
    </button>
  );
};

export default LoadingButton;