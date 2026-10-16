import { useState } from 'react';
import { toast } from 'sonner';
import LoadingButton from '../../../shared/components/LoadingButton';
import type { Branch } from '../models/branchTypes';
import { branchSchema, firstZodMessage } from '../../../shared/validation/schemas';
import { sanitizeInteger } from '../../../shared/utils/numeric';

interface BranchFormProps {
  onSubmit: (data: { name: string; address: string; contact: string }) => void | Promise<void>;
  initial?: Branch;
  isOwner: boolean;
}

const BranchForm: React.FC<BranchFormProps> = ({ onSubmit, initial, isOwner }) => {
  const [name, setName] = useState(initial?.name ?? '');
  const [address, setAddress] = useState(initial?.address ?? '');
  const [contact, setContact] = useState(initial?.contact ?? '');
  const [submitting, setSubmitting] = useState(false);

  if (!isOwner) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const check = branchSchema.safeParse({ name, address, contactNumber: contact });
    if (!check.success) {
      toast.error(firstZodMessage(check.error));
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit({ name, address, contact });
      if (!initial) {
        setName('');
        setAddress('');
        setContact('');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      className="space-y-4"
      onSubmit={submit}
    >
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
        <label className="block text-sm text-ink-secondary">Address</label>
        <input
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          required
          className="mt-1 w-full rounded border border-line px-3 py-2"
        />
      </div>
      <div>
        <label className="block text-sm text-ink-secondary">Contact</label>
        <input
          value={contact}
          onChange={(e) => setContact(sanitizeInteger(e.target.value).slice(0, 11))}
          inputMode="numeric"
          maxLength={11}
          placeholder="e.g. 09171234567"
          required
          className="mt-1 w-full rounded border border-line px-3 py-2"
        />
        <p className="text-xs text-ink-muted mt-1">Exactly 11 digits.</p>
      </div>
      <LoadingButton loading={submitting} loadingLabel={initial ? 'Saving…' : 'Creating…'}>
        {initial ? 'Save Branch' : 'Create Branch'}
      </LoadingButton>
    </form>
  );
};

export default BranchForm;
