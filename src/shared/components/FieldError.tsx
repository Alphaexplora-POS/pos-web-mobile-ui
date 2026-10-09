interface FieldErrorProps {
  message?: string | null;
}

const FieldError: React.FC<FieldErrorProps> = ({ message }) => {
  if (!message) return null;
  return <p className="mt-1 text-sm text-error">{message}</p>;
};

export default FieldError;