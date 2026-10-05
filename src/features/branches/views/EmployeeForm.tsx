import { useState } from 'react';
import { toast } from 'sonner';
import Select from '../../../shared/components/Select';
import LoadingButton from '../../../shared/components/LoadingButton';
import type { Branch, EmployeeRole } from '../models/branchTypes';
import { employeeSchema, firstZodMessage } from '../../../shared/validation/schemas';
import { sanitizeInteger } from '../../../shared/utils/numeric';

interface EmployeeFormProps {
  branches: Branch[];
  onSubmit: (data: {
    name: string;
    role: EmployeeRole;
    branchId: string;
    email?: string;
    password?: string;
    pin: string;
  }) => void;
  isOwner: boolean;
  initial?: {
    name: string;
    role: EmployeeRole;
    branchId: string;
    pin: string;
  };
}

const EmployeeForm: React.FC<EmployeeFormProps> = ({ branches, onSubmit, isOwner, initial }) => {
  const [role, setRole] = useState<EmployeeRole>(initial?.role ?? 'cashier');
  const [name, setName] = useState(initial?.name ?? '');
  const [branchId, setBranchId] = useState(initial?.branchId ?? branches[0]?.id ?? '');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pin, setPin] = useState(initial?.pin ?? '');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const isEditing = Boolean(initial);

  if (!isOwner) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEditing && role === 'branch_manager' && (!email || !password)) {
      const message = 'Email and password are required for a Branch Manager';
      setError(message);
      toast.error(message);
      return;
    }
    if (!isEditing && role === 'branch_manager' && password.length < 6) {
      const message = 'Password too short — must be at least 6 characters';
      setError(message);
      toast.error(message);
      return;
    }
    const check = employeeSchema.safeParse({
      name,
      role,
      branchId,
      pin,
    });
    if (!check.success) {
      const message = firstZodMessage(check.error);
      setError(message);
      toast.error(message);
      return;
    }
    if (isEditing && initial?.role === 'branch_manager' && role !== 'branch_manager') {
      const message = 'A branch manager cannot be changed to another role.';
      setError(message);
      toast.error(message);
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await onSubmit({
        name,
        role,
        branchId,
        email: isEditing ? undefined : role === 'branch_manager' ? email : undefined,
        password: isEditing ? undefined : role === 'branch_manager' ? password : undefined,
        pin,
      });
      if (!isEditing) {
        setName('');
        setEmail('');
        setPassword('');
        setPin('');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add employee');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      className="space-y-4"
      onSubmit={submit}
    >
      {error && <p className="text-sm text-error">{error}</p>}
      {isEditing ? (
        <p className="text-sm text-ink-muted">
          Editing employee — name and PIN can change. Role and branch are fixed.
        </p>
      ) : (
        <div className="flex gap-4">
          {(['branch_manager', 'cashier', 'staff'] as EmployeeRole[]).map((r) => (
            <label key={r} className="flex items-center gap-2 text-sm text-ink-secondary">
              <input
                type="radio"
                checked={role === r}
                onChange={() => setRole(r)}
              />
              {r === 'branch_manager' ? 'Branch Manager' : r === 'cashier' ? 'Cashier' : 'Staff'}
            </label>
          ))}
        </div>
      )}
      <div>
        <label className="block text-sm text-ink-secondary">Name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="mt-1 w-full rounded border border-line px-3 py-2"
        />
      </div>
      <div>
        <label className="block text-sm text-ink-secondary">Assign Branch</label>
        <Select
          value={branchId}
          onChange={(v) => setBranchId(v)}
          options={branches.map((b) => ({ value: b.id, label: b.name }))}
          placeholder={branches.length === 0 ? 'No branches' : 'Select branch'}
          className="mt-1 w-full"
          disabled={isEditing}
        />
        {isEditing && (
          <p className="text-xs text-ink-muted mt-1">Branch is permanent and cannot be changed.</p>
        )}
      </div>
      {!isEditing && role === 'branch_manager' && (
        <>
          <div>
            <label className="block text-sm text-ink-secondary">Email</label>
            <p className="text-xs text-ink-muted mb-1">Account is active immediately — no invite email is sent.</p>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 w-full rounded border border-line px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm text-ink-secondary">Password</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="mt-1 w-full rounded border border-line px-3 py-2 pr-10"
              />
              <button
                type="button"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                onClick={() => setShowPassword((s) => !s)}
                className="absolute inset-y-0 right-0 mt-1 flex items-center pr-3 text-ink-muted hover:text-ink-secondary"
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0 1 12 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 0 1 1.563-3.029m5.858.908a3 3 0 1 1-4.243-4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0 1 12 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 0 1-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
            {email && password && password.length < 6 && (
              <p className="text-xs text-error mt-1">Password too short — must be at least 6 characters.</p>
            )}
          </div>
        </>
      )}
      <div>
        <label className="block text-sm text-ink-secondary">Set PIN</label>
        <input
          value={pin}
          onChange={(e) => setPin(sanitizeInteger(e.target.value).slice(0, 4))}
          maxLength={4}
          inputMode="numeric"
          required
          className="mt-1 w-full rounded border border-line px-3 py-2"
        />
        <p className="text-xs text-ink-muted mt-1">Exactly 4 digits, unique per branch.</p>
      </div>
      <LoadingButton loading={submitting} loadingLabel={isEditing ? 'Saving…' : 'Adding…'}>
        {isEditing ? 'Save Changes' : 'Add Employee'}
      </LoadingButton>
    </form>
  );
};

export default EmployeeForm;
