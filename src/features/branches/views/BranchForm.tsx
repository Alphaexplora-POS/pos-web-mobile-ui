import { useState } from 'react';
import type { Branch } from '../models/branchTypes';

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
      className="bg-white rounded-lg shadow p-6 space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({ name, address, contact });
        if (!initial) {
          setName('');
          setAddress('');
          setContact('');
        }
      }}
    >
      <h3 className="text-lg font-semibold text-gray-900">
        {initial ? 'Edit Branch' : 'Add Branch'}
      </h3>
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
