interface ErrorStateProps {
  message: string;
}

const ErrorState: React.FC<ErrorStateProps> = ({ message }) => {
  return (
    <div className="mt-6 mb-6 border border-error bg-error/5 rounded-lg px-4 py-10 flex items-center justify-center text-error text-sm">
      {message}
    </div>
  );
};

export default ErrorState;
