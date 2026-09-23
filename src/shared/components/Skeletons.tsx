import React from 'react';
import PageLayout from './PageLayout';

const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div aria-hidden="true" className={`skeleton ${className}`} />
);

const SkeletonTable: React.FC<{ headers: string[]; rows?: number; className?: string }> = ({
  headers,
  rows = 4,
  className = '',
}) => (
  <table className={`w-full text-sm ${className}`}>
    <thead>
      <tr className="text-left border-b border-line">
        {headers.map((h) => (
          <th key={h} className="py-2">
            <Skeleton className="h-3 w-16 rounded" />
          </th>
        ))}
      </tr>
    </thead>
    <tbody>
      {Array.from({ length: rows }).map((_, r) => (
        <tr key={r} className="border-b border-line">
          {headers.map((h, i) => (
            <td key={h} className="py-3">
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
  <div className="bg-white rounded-lg shadow p-6">
    <div className="flex items-center justify-between mb-4">
      <Skeleton className="h-4 w-32 rounded" />
      {action && <Skeleton className="h-8 w-24 rounded" />}
    </div>
    {children}
  </div>
);

const SkeletonListRows: React.FC<{ rows?: number; twoLine?: boolean }> = ({
  rows = 4,
  twoLine = true,
}) => (
  <div className="space-y-2">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="flex items-center justify-between border border-line rounded p-3">
        <div className="space-y-2 w-2/5">
          <Skeleton className="h-3 rounded" />
          {twoLine && <Skeleton className="h-3 w-3/5 rounded" />}
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-14 rounded" />
          <Skeleton className="h-5 w-14 rounded" />
        </div>
      </div>
    ))}
  </div>
);

const SkeletonStatCard: React.FC = () => (
  <div className="bg-white rounded-lg shadow p-6">
    <Skeleton className="h-3 w-24 rounded" />
    <Skeleton className="h-10 w-32 mt-3 rounded" />
    <Skeleton className="h-3 w-28 mt-3 rounded" />
  </div>
);

export const ProductsSkeleton: React.FC = () => (
  <PageLayout title="Product Management">
    <div className="flex gap-4 mb-6">
      <Skeleton className="h-9 w-40 rounded" />
      <Skeleton className="h-9 w-32 rounded" />
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <SkeletonSection action>
          <SkeletonTable headers={['Name', 'Category', 'Price', 'Status']} rows={5} />
        </SkeletonSection>
        <SkeletonSection action>
          <SkeletonListRows rows={4} />
        </SkeletonSection>
      </div>
    </div>
  </PageLayout>
);

export const BranchesSkeleton: React.FC = () => (
  <PageLayout title="Branch and Employees">
    <div className="mb-6 bg-white rounded-lg shadow p-4">
      <Skeleton className="h-3 w-1/3 rounded" />
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <SkeletonSection action>
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="p-4 rounded-lg border border-line">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-4 w-32 rounded" />
                  <Skeleton className="h-5 w-14 rounded" />
                </div>
                <Skeleton className="h-3 w-2/3 mt-3 rounded" />
                <Skeleton className="h-3 w-1/2 mt-2 rounded" />
              </div>
            ))}
          </div>
        </SkeletonSection>
        <SkeletonSection action>
          <SkeletonTable headers={['Name', 'Role', 'Branch', 'Status', 'Actions']} rows={5} />
        </SkeletonSection>
      </div>
    </div>
  </PageLayout>
);

export const ConfigurationSkeleton: React.FC = () => (
  <PageLayout title="Configuration">
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <SkeletonSection>
        <div className="flex gap-2 mb-4">
          <Skeleton className="flex-1 h-10 rounded" />
          <Skeleton className="h-10 w-24 rounded" />
          <Skeleton className="h-10 w-16 rounded" />
        </div>
        <SkeletonListRows rows={4} />
      </SkeletonSection>
      <SkeletonSection>
        <div className="flex gap-2 mb-4">
          <Skeleton className="flex-1 h-10 rounded" />
          <Skeleton className="h-10 w-24 rounded" />
          <Skeleton className="h-10 w-16 rounded" />
        </div>
        <SkeletonListRows rows={4} />
      </SkeletonSection>
    </div>
  </PageLayout>
);

export const InventorySkeleton: React.FC<{ title: string }> = ({ title }) => (
  <PageLayout title={title}>
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-4">
        <Skeleton className="h-3 w-20 rounded mb-2" />
        <Skeleton className="h-9 w-64 rounded" />
      </div>
      <Skeleton className="h-9 w-32 rounded" />
      <SkeletonSection>
        <SkeletonTable headers={['Product', 'SKU', 'Branch', 'Quantity', 'Origin']} rows={6} />
      </SkeletonSection>
      <SkeletonSection>
        <SkeletonTable headers={['Product', 'SKU', 'Branch', 'Action', 'Delta', 'Timestamp']} rows={4} />
      </SkeletonSection>
    </div>
  </PageLayout>
);

export const TransactionsSkeleton: React.FC = () => (
  <PageLayout title="Transaction History">
    <div className="flex flex-wrap items-center gap-4 mb-6 bg-white rounded-lg shadow p-4">
      <Skeleton className="h-4 w-10 rounded" />
      <Skeleton className="h-8 w-16 rounded" />
      <Skeleton className="h-8 w-16 rounded" />
      <Skeleton className="h-8 w-20 rounded" />
      <Skeleton className="h-8 w-16 rounded" />
    </div>
    <div className="flex gap-4 mb-6">
      <Skeleton className="h-9 w-32 rounded" />
      <Skeleton className="h-9 w-36 rounded" />
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1 space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="p-3 rounded-lg border border-line">
            <div className="flex items-center justify-between gap-2">
              <Skeleton className="h-3 w-24 rounded" />
              <Skeleton className="h-3 w-14 rounded" />
            </div>
            <Skeleton className="h-3 w-3/5 mt-2 rounded" />
          </div>
        ))}
      </div>
      <div className="lg:col-span-2">
        <div className="bg-white rounded-lg shadow p-6 space-y-3">
          <Skeleton className="h-6 w-40 rounded" />
          <Skeleton className="h-3 rounded" />
          <Skeleton className="h-3 w-4/5 rounded" />
          <Skeleton className="h-3 w-3/5 rounded" />
          <Skeleton className="h-10 w-32 rounded" />
        </div>
      </div>
    </div>
  </PageLayout>
);

export const AnalyticsSkeleton: React.FC<{ title: string }> = ({ title }) => (
  <PageLayout title={title}>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <SkeletonStatCard />
      <SkeletonStatCard />
    </div>
    <div className="mt-6">
      <SkeletonSection>
        <SkeletonTable headers={['Product', 'Sold', 'Revenue']} rows={5} />
      </SkeletonSection>
    </div>
  </PageLayout>
);

export const RouteSkeleton: React.FC = () => (
  <div className="flex h-screen overflow-hidden bg-canvas">
    <div className="w-64 shrink-0 bg-navy" aria-hidden="true" />
    <div className="flex-1 overflow-hidden p-6 space-y-6">
      <Skeleton className="h-6 w-48 rounded" />
      <SkeletonSection>
        <SkeletonTable headers={['Name', 'Category', 'Price', 'Status']} rows={5} />
      </SkeletonSection>
      <SkeletonSection>
        <SkeletonListRows rows={4} />
      </SkeletonSection>
    </div>
  </div>
);