import React from 'react';
import PageLayout from './PageLayout';

const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div aria-hidden="true" className={`skeleton ${className}`} />
);

export const SkeletonList: React.FC<{ rows?: number }> = ({ rows = 3 }) => (
  <ul className="divide-y divide-line rounded-lg border border-line">
    {Array.from({ length: rows }).map((_, i) => (
      <li key={i} className="flex items-center justify-between gap-3 px-3 py-2">
        <Skeleton className="h-3 w-24 rounded" />
        <Skeleton className="h-3 w-16 rounded" />
      </li>
    ))}
  </ul>
);

export const SkeletonTable: React.FC<{ headers: string[]; rows?: number; className?: string }> = ({
  headers,
  rows = 4,
  className = '',
}) => (
  <table className={`w-full text-base ${className}`}>
    <thead>
      <tr className="text-left border-b border-line">
        {headers.map((h) => (
          <th key={h} className="py-3">
            <Skeleton className="h-3 w-16 rounded" />
          </th>
        ))}
      </tr>
    </thead>
    <tbody>
      {Array.from({ length: rows }).map((_, r) => (
        <tr key={r} className="border-b border-line">
          {headers.map((h, i) => (
            <td key={h} className="py-4">
              <Skeleton
                className={`h-3 rounded ${
                  i === 0 ? 'w-3/5' : i === headers.length - 1 ? 'w-12' : 'w-20'
                }`}
              />
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  </table>
);

const SkeletonSection: React.FC<{ action?: boolean; children?: React.ReactNode }> = ({
  action = false,
  children,
}) => (
  <div className="bg-white rounded-lg border border-line p-6">
    <div className="flex items-center justify-between mb-4">
      <Skeleton className="h-5 w-32 rounded" />
      {action && <Skeleton className="h-9 w-28 rounded-md" />}
    </div>
    {children}
  </div>
);



export const ProductsSkeleton: React.FC<{ isOwner?: boolean }> = ({ isOwner = false }) => (
  <PageLayout title="Product Management">
    <div className="mb-6 inline-flex items-center gap-1 rounded-lg border border-line bg-white p-1">
      {['Products', 'Categories', 'Promotions'].map((t) => (
        <Skeleton key={t} className="h-8 w-24 rounded-md" />
      ))}
    </div>
    <SkeletonSection action={isOwner}>
      <SkeletonTable
        headers={
          isOwner
            ? ['Name', 'Category', 'Price', 'Variant', 'Attributes', 'Status', '', 'Summarize']
            : ['Name', 'Category', 'Price', 'Variant', 'Attributes', 'Status', 'Summarize']
        }
        rows={5}
      />
    </SkeletonSection>
  </PageLayout>
);

export const BranchesSkeleton: React.FC<{ isOwner?: boolean }> = ({ isOwner = false }) => (
  <PageLayout title={isOwner ? 'Branch and Employees' : 'Employees'}>
    <div className="mb-6 bg-white rounded-lg border border-line p-4 flex items-center gap-3">
      <Skeleton className="h-3 w-20 rounded" />
      <Skeleton className="h-3 w-40 rounded" />
    </div>
    {isOwner && (
      <div className="mb-6 inline-flex items-center gap-1 rounded-lg border border-line bg-white p-1">
        {['Branches', 'Employees'].map((t) => (
          <Skeleton key={t} className="h-8 w-24 rounded-md" />
        ))}
      </div>
    )}
    {isOwner ? (
      <SkeletonSection action>
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="p-4 rounded-lg border border-line">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-32 rounded" />
                <div className="flex items-center gap-2">
                  <Skeleton className="h-5 w-14 rounded" />
                  <Skeleton className="h-6 w-11 rounded-md" />
                  <Skeleton className="h-6 w-14 rounded-md" />
                </div>
              </div>
              <Skeleton className="h-3 w-2/3 mt-3 rounded" />
              <Skeleton className="h-3 w-1/2 mt-2 rounded" />
            </div>
          ))}
        </div>
      </SkeletonSection>
    ) : (
      <SkeletonSection>
        <SkeletonTable headers={['Name', 'Role', 'Branch', 'Status']} rows={5} />
      </SkeletonSection>
    )}
  </PageLayout>
);

export const ConfigurationSkeleton: React.FC = () => (
  <PageLayout title="Configuration">
    <div className="mb-6 inline-flex items-center gap-1 rounded-lg border border-line bg-white p-1">
      {['Payment Methods', 'Reason Codes'].map((t) => (
        <Skeleton key={t} className="h-8 w-28 rounded-md" />
      ))}
    </div>
    <SkeletonSection action>
      <SkeletonTable headers={['Name', 'Type', 'Status', '']} rows={4} />
    </SkeletonSection>
  </PageLayout>
);

export const InventorySkeleton: React.FC<{ title: string }> = ({ title }) => {
  const isOwnerView = title === 'Global Inventory';
  return (
    <PageLayout title={title}>
      <div className="space-y-6">
        {isOwnerView && (
          <div className="bg-white rounded-lg border border-line p-4">
            <Skeleton className="h-3 w-20 rounded mb-2" />
            <Skeleton className="h-9 w-64 rounded-md" />
          </div>
        )}
        <div className="inline-flex items-center gap-1 rounded-lg border border-line bg-white p-1">
          {['Stock', 'Audit Log'].map((t) => (
            <Skeleton key={t} className="h-8 w-24 rounded-md" />
          ))}
        </div>
        <SkeletonSection action>
          <SkeletonTable
            headers={isOwnerView ? ['Product', 'SKU', 'Branch', 'Quantity', 'Origin'] : ['Product', 'SKU', 'Quantity', 'Origin']}
            rows={5}
          />
        </SkeletonSection>
      </div>
    </PageLayout>
  );
};

export const TransactionsSkeleton: React.FC = () => (
  <PageLayout title="Transaction History">
    <div className="mb-6 bg-white rounded-lg border border-line p-4">
      <div className="inline-flex items-center gap-1 rounded-lg bg-canvas p-1">
        {['Today', 'Week', 'Month', 'Custom'].map((t) => (
          <Skeleton key={t} className="h-8 w-16 rounded-md" />
        ))}
      </div>
    </div>
    <div className="mb-6 inline-flex items-center gap-1 rounded-lg border border-line bg-white p-1">
      {['Transactions', 'Refund History'].map((t) => (
        <Skeleton key={t} className="h-8 w-28 rounded-md" />
      ))}
    </div>
    <SkeletonSection>
      <SkeletonTable headers={['Branch', 'Cashier', 'Items', 'Payment', 'Date', 'Total']} rows={5} />
    </SkeletonSection>
  </PageLayout>
);

export const AnalyticsSkeleton: React.FC<{ title: string; owner?: boolean }> = ({ title, owner }) => (
  <PageLayout title={title}>
    {!owner && (
      <div className="mb-6 bg-white rounded-lg border border-line p-4 flex items-center gap-2">
        <Skeleton className="h-3 w-20 rounded" />
        <Skeleton className="h-3 w-40 rounded" />
      </div>
    )}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {Array.from({ length: 2 }).map((_, i) => (
        <div key={i} className="bg-white rounded-lg border border-line p-6">
          <Skeleton className="h-3 w-24 rounded" />
          <Skeleton className="h-8 w-32 mt-2 rounded" />
          <Skeleton className="h-3 w-28 mt-2 rounded" />
        </div>
      ))}
    </div>
    <div className={`grid grid-cols-1 ${owner ? 'xl:grid-cols-3 gap-6 mt-6' : 'mt-6'}`}>
      <div className={`bg-white rounded-lg border border-line p-6 ${owner ? 'xl:col-span-2' : ''}`}>
        {owner && (
          <>
            <Skeleton className="h-4 w-16 rounded" />
            <Skeleton className="h-9 w-56 rounded-md mt-1" />
            <div className="flex items-center justify-between mt-5">
              <Skeleton className="h-4 w-32 rounded" />
              <Skeleton className="h-4 w-24 rounded" />
            </div>
            <Skeleton className="h-3 w-48 rounded mt-2 mb-5" />
          </>
        )}
        {!owner && (
          <>
            <Skeleton className="h-4 w-32 rounded mb-5" />
          </>
        )}
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Skeleton className="h-3 w-40 rounded" />
                <Skeleton className="h-3 w-16 rounded" />
              </div>
              <Skeleton className="h-2 w-full rounded" />
            </div>
          ))}
        </div>
      </div>
      {owner && (
        <div className="bg-white rounded-lg border border-line p-6">
          <Skeleton className="h-4 w-40 rounded" />
          <Skeleton className="h-3 w-32 rounded mt-1 mb-4" />
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="p-3 rounded-lg border border-line">
                <Skeleton className="h-4 w-32 rounded" />
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <Skeleton className="h-3 w-20 rounded" />
                  <Skeleton className="h-3 w-20 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  </PageLayout>
);