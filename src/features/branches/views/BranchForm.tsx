import { useState } from 'react';
import { toast } from 'sonner';
import type { Branch } from '../models/branchTypes';
import { branchSchema, firstZodMessage } from '../../../shared/validation/schemas';

interface BranchFormProps {
  onSubmit: (data: { name: string; address: string; contact: string }) => void;
  initial?: Branch;
  isOwner: boolean;
}

const BranchForm: React.FC<BranchFormProps> = ({ onSubmit, initial, isOwner }) => {
  const [name, setName] = useState(initial?.name ?? '');
  const [address, setAddress] = useState(initial?.address ?? '');
  const [contact, setContact] = useState(initial?.contact ?? '');

  if (!isOwner) return null;

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        const check = branchSchema.safeParse({ name, address, contactNumber: contact });
        if (!check.success) {
          toast.error(firstZodMessage(check.error));
          return;
        }
        onSubmit({ name, address, contact });
        if (!initial) {
          setName('');
          setAddress('');
          setContact('');
        }
      }}
    >
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
        <label className="block text-sm text-gray-600">Address</label>
        <input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          required
          className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
        />
      </div>
      <div>
        <label className="block text-sm text-gray-600">Contact</label>
        <input
          value={contact}
          onChange={(e) => setContact(e.target.value)}
          required
          className="mt-1 w-full rounded border border-gray-300 px-3 py-2"
        />
      </div>
      <button
        type="submit"
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        {initial ? 'Save Branch' : 'Create Branch'}
      </button>
    </form>
  );
};

export default BranchForm;
