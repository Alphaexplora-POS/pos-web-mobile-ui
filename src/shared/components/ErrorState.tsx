interface ErrorStateProps {
  message: string;
}

const ErrorState: React.FC<ErrorStateProps> = ({ message }) => {
  return (
    <div className="flex items-center justify-center py-16 text-error">{message}</div>
  );
};

export default ErrorState;
