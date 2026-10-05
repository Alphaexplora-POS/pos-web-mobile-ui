import { apiRequest } from '../../../shared/models/apiClient';
import { SERVER_PAGE_SIZE, toServerPage, type ServerPage } from '../../../shared/hooks/useServerPagination';

export interface PendingOwner {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  tenantName: string;
  status: string;
  createdAt: string;
}

export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export const fetchOwnersPage = async (
  status: ApprovalStatus,
  page: number,
): Promise<ServerPage<PendingOwner>> => {
  const data = await apiRequest<{ items: PendingOwner[] }>(
    `/identity/profiles?status=${status}&page=${page}&limit=${SERVER_PAGE_SIZE}&sortDirection=asc`,
  );
  return toServerPage<PendingOwner>(data, 'items');
};

export const approveOwner = async (id: string): Promise<void> => {
  await apiRequest<unknown>(`/identity/profiles/${id}/approve`, { method: 'POST' });
};

export const rejectOwner = async (id: string): Promise<void> => {
  await apiRequest<unknown>(`/identity/profiles/${id}`, { method: 'DELETE' });
};