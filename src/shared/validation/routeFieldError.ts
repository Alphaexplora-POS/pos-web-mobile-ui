const KEYWORD_MAP: [keyword: string, field: string][] = [
  ['email', 'email'],
  ['pin', 'pin'],
  ['sku', 'sku'],
  ['workspace', 'businessName'],
  ['name', 'name'],
];

export const routeFieldError = (message: string, fields: readonly string[]): string | null => {
  const lower = message.toLowerCase();
  for (const [keyword, field] of KEYWORD_MAP) {
    if (lower.includes(keyword) && fields.includes(field)) return field;
  }
  return null;
};