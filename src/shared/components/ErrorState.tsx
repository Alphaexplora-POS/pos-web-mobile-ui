interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

const ErrorState: React.FC<ErrorStateProps> = ({ message, onRetry }) => {
  return (
    <div role="alert" className="w-full border border-error bg-error/5 rounded-lg px-5 py-4 text-sm text-error">
      {message}
      {onRetry && (
        <button type="button" onClick={onRetry} className="ml-4 rounded-md border border-error px-3 py-1.5 font-medium hover:bg-error/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-error">
          Try again
        </button>
      )}
    </div>
  );
};

export default ErrorState;
