import { useState } from 'react';
import LoadingButton from '../../../shared/components/LoadingButton';
import FieldError from '../../../shared/components/FieldError';
import type { Branch } from '../models/branchTypes';
import { branchSchema } from '../../../shared/validation/schemas';
import { routeFieldError } from '../../../shared/validation/routeFieldError';
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
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!isOwner) return null;

  const clearError = (field: string) => {
    if (!errors[field]) return;
    setErrors((prev) => {
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const check = branchSchema.safeParse({ name, address, contactNumber: contact });
    if (!check.success) {
      setErrors(
        Object.fromEntries(
          Object.entries(check.error.flatten().fieldErrors).map(([k, v]) => [k, v?.[0] ?? '']),
        ),
      );
      return;
    }
    setErrors({});
    setError(null);
    setSubmitting(true);
    try {
      await onSubmit({ name, address, contact });
      if (!initial) {
        setName('');
        setAddress('');
        setContact('');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save branch';
      const field = routeFieldError(message, ['name', 'contactNumber']);
      if (field) setErrors({ ...errors, [field]: message });
      else setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form
      className="space-y-4"
      onSubmit={submit}
      noValidate
    >
      <div>
        <label className="block text-sm text-ink-secondary">Name</label>
        <input
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            clearError('name');
          }}
          required
          className={`mt-1 w-full rounded border px-3 py-2 ${errors.name ? 'border-error' : 'border-line'}`}
        />
        <FieldError message={errors.name} />
      </div>
      <div>
        <label className="block text-sm text-ink-secondary">Address</label>
        <input
          value={address}
          onChange={(e) => {
            setAddress(e.target.value);
            clearError('address');
          }}
          required
          className={`mt-1 w-full rounded border px-3 py-2 ${errors.address ? 'border-error' : 'border-line'}`}
        />
        <FieldError message={errors.address} />
      </div>
      <div>
        <label className="block text-sm text-ink-secondary">Contact</label>
        <input
          value={contact}
          onChange={(e) => {
            setContact(sanitizeInteger(e.target.value).slice(0, 11));
            clearError('contactNumber');
          }}
          inputMode="numeric"
          maxLength={11}
          placeholder="e.g. 09171234567"
          required
          className={`mt-1 w-full rounded border px-3 py-2 ${errors.contactNumber ? 'border-error' : 'border-line'}`}
        />
        <FieldError message={errors.contactNumber} />
        <p className="text-xs text-ink-muted mt-1">Exactly 11 digits.</p>
      </div>
      <LoadingButton loading={submitting} loadingLabel={initial ? 'Saving…' : 'Creating…'}>
        {initial ? 'Save Branch' : 'Create Branch'}
      </LoadingButton>
      <FieldError message={error} />
    </form>
  );
};

export default BranchForm;