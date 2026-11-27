import { formatters } from '@/utils/formatters';

export const formatSalary = (from: number | null, to: number | null): string => {
  if (from !== null && to !== null) {
    return from === to ? formatters.currency(from) : `${formatters.amount(from)} – ${formatters.currency(to)}`;
  }
  if (from !== null) return `от ${formatters.currency(from)}`;
  if (to !== null) return `до ${formatters.currency(to)}`;
  return 'по договорённости';
};
