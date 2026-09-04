interface ErrorStateProps {
  message: string;
}

const ErrorState: React.FC<ErrorStateProps> = ({ message }) => {
  return (
    <div className="flex items-center justify-center py-16 text-red-500">{message}</div>
  );
};

export default ErrorState;
