import { useState } from 'react';
import { toast } from 'sonner';
import Select from '../../../shared/components/Select';
import type { Branch, EmployeeRole } from '../models/branchTypes';
import { employeeSchema, firstZodMessage } from '../../../shared/validation/schemas';

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
}

const EmployeeForm: React.FC<EmployeeFormProps> = ({ branches, onSubmit, isOwner }) => {
  const [role, setRole] = useState<EmployeeRole>('cashier');
  const [name, setName] = useState('');
  const [branchId, setBranchId] = useState(branches[0]?.id ?? '');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!isOwner) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const check = employeeSchema.safeParse({
      name,
      role,
      branchId,
      pin,
      email: role === 'branch_manager' ? email : undefined,
      password: role === 'branch_manager' ? password : undefined,
    });
    if (!check.success) {
      const message = firstZodMessage(check.error);
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
        email: role === 'branch_manager' ? email : undefined,
        password: role === 'branch_manager' ? password : undefined,
        pin,
      });
      setName('');
      setEmail('');
      setPassword('');
      setPin('');
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
        />
      </div>
      {role === 'branch_manager' && (
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
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1 w-full rounded border border-line px-3 py-2"
            />
          </div>
        </>
      )}
      <div>
        <label className="block text-sm text-ink-secondary">Set PIN</label>
        <input
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          maxLength={4}
          inputMode="numeric"
          required
          className="mt-1 w-full rounded border border-line px-3 py-2"
        />
        <p className="text-xs text-ink-muted mt-1">Exactly 4 digits, unique per branch.</p>
      </div>
      {error && <p className="text-sm text-error">{error}</p>}
      <button
        type="submit"
        disabled={submitting}
        className="bg-brand text-white px-4 py-2 rounded hover:bg-brand-dark disabled:opacity-50"
      >
        {submitting ? 'Adding…' : 'Add Employee'}
      </button>
    </form>
  );
};

export default EmployeeForm;
