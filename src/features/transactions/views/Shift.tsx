import { useState } from 'react';
import { usePosViewModel } from '../viewModels/usePosViewModel';
import PageLayout from '../../../shared/components/PageLayout';
import LoadingState from '../../../shared/components/LoadingState';
import ErrorState from '../../../shared/components/ErrorState';
import Select from '../../../shared/components/Select';
import { formatAmount } from '../../../shared/utils/formatCurrency';

const Shift: React.FC = () => {
  const vm = usePosViewModel();
  const [error, setError] = useState<string | null>(null);

  if (vm.isLoading) return <LoadingState />;
  if (vm.error) return <ErrorState message={vm.error} />;

  const open = async () => {
    setError(null);
    try {
      await vm.openShift();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to open shift');
    }
  };

  const close = async (id: string) => {
    setError(null);
    try {
      await vm.closeShift(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to close shift');
    }
  };

  return (
    <PageLayout title="Shift Management">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Shift Details</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600">Branch</label>
              <Select
                value={vm.selectedBranchId}
                onChange={(v) => vm.setSelectedBranchId(v)}
                options={vm.branches.map((b) => ({ value: b.id, label: b.name }))}
                className="mt-1 w-full"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600">Staff on Shift</label>
              <Select
                value={vm.selectedEmployeeId}
                onChange={(v) => vm.setSelectedEmployeeId(v)}
                options={vm.employees.map((e) => ({ value: e.id, label: e.name }))}
                className="mt-1 w-full"
              />
            </div>
          </div>
          {vm.openSession ? (
            <button className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700" onClick={() => close(vm.openSession!.id)}>
              Close Shift
            </button>
          ) : (
            <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700" onClick={open}>
              Open Shift
            </button>
          )}
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {vm.openSession ? `Open Shift — ${vm.openSession.branchName}` : 'No Open Shift'}
          </h2>
          {vm.openSession ? (
            <div className="space-y-2 text-sm text-gray-600">
              <p>Staff: <span className="font-medium text-gray-900">{vm.openSession.employeeName}</span></p>
              <p>Opened: {new Date(vm.openSession.openedAt).toLocaleString()}</p>
              <div className="grid grid-cols-2 gap-4 mt-4 border-t pt-4">
                <div className="bg-gray-50 rounded p-4 text-center">
                  <p className="text-xs text-gray-500 uppercase">Sales</p>
                  <p className="text-2xl font-semibold text-gray-900">{vm.summary?.transactionCount ?? 0}</p>
                </div>
                <div className="bg-gray-50 rounded p-4 text-center">
                  <p className="text-xs text-gray-500 uppercase">Gross Sales</p>
                  <p className="text-2xl font-semibold text-gray-900">${formatAmount(vm.summary?.grossSales ?? 0)}</p>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-gray-400 text-sm">
              Open a shift to track sales per session. Sales recorded through the POS will attach to the open shift automatically.
            </p>
          )}
        </div>
      </div>
    </PageLayout>
  );
};

export default Shift;