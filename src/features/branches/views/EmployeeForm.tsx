import { useState } from 'react';
import type { Branch, EmployeeRole } from '../models/branchTypes';

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

  if (!isOwner) return null;

  return (
    <form
      className="bg-white rounded-lg shadow p-6 space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({
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
      }}
    >
      <h3 className="text-lg font-semibold text-gray-900">Add Employee</h3>
      <div className="flex gap-4">
        {(['branch_manager', 'cashier', 'staff'] as EmployeeRole[]).map((r) => (
          <label key={r} className="flex items-center gap-2 text-sm text-gray-700">
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
        <label className="block text-sm text-gray-600">Name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
        />
      </div>
      <div>
        <label className="block text-sm text-gray-600">Assign Branch</label>
        <select
          value={branchId}
          onChange={(e) => setBranchId(e.target.value)}
          className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
        >
          {branches.map((b) => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
      </div>
      {role === 'branch_manager' && (
        <>
          <div>
            <label className="block text-sm text-gray-600">Email Invite</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
            />
          </div>
        </>
      )}
      <div>
        <label className="block text-sm text-gray-600">Set PIN</label>
        <input
          value={pin}
          onChange={(e) => setPin(e.target.value)}
          required
          className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
        />
      </div>
      <button
        type="submit"
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Add Employee
      </button>
    </form>
  );
};

export default EmployeeForm;
