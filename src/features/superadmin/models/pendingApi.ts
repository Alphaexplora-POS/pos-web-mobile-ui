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
  limit: number = SERVER_PAGE_SIZE,
): Promise<ServerPage<PendingOwner>> => {
  const data = await apiRequest<{ items: PendingOwner[] }>(
    `/identity/profiles?status=${status}&role=owner&sortField=createdAt&sortDirection=asc&page=${page}&limit=${limit}`,
  );
  return toServerPage<PendingOwner>(data, 'items');
};

export const approveOwner = async (id: string): Promise<void> => {
  await apiRequest<unknown>(`/identity/profiles/${id}/approve`, { method: 'POST' });
};

export const rejectOwner = async (id: string): Promise<void> => {
  await apiRequest<unknown>(`/identity/profiles/${id}`, { method: 'DELETE' });
};

export const activateOwner = async (id: string): Promise<void> => {
  await apiRequest<unknown>(`/identity/profiles/${id}/activate`, { method: 'POST' });
};

export const deactivateOwner = async (id: string): Promise<void> => {
  await apiRequest<unknown>(`/identity/profiles/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ isActive: false }),
  });
};