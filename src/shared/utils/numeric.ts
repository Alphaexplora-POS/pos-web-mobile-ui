export const sanitizeInteger = (value: string): string => value.replace(/\D/g, '');

export const sanitizeDecimal = (value: string): string =>
  value
    .replace(/[^0-9.]/g, '')
    .replace(/(\..*)\./g, '$1')
    .replace(/^\./, '');