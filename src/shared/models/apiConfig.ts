const configuredBase = import.meta.env.VITE_API_BASE_URL?.trim().replace(/\/+$/, '');

export const API_BASE_URL = configuredBase || '/api';
