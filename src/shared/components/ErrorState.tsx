interface ErrorStateProps {
  message: string;
}

const ErrorState: React.FC<ErrorStateProps> = ({ message }) => {
  return (
    <div className="w-full border border-error bg-error/5 rounded-lg px-5 py-4 text-sm text-error">
      {message}
    </div>
  );
};

export default ErrorState;