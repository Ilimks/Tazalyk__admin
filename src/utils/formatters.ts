export const formatters = {
  date: (date: string | Date): string => {
    const d = new Date(date);
    return d.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  },

  datetime: (date: string | Date): string => {
    const d = new Date(date);
    return d.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  },

  currency: (amount: number): string => {
    return new Intl.NumberFormat('ru-RU').format(amount) + ' сом';
  },

  fileSize: (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  truncate: (text: string, length: number = 100): string => {
    if (text.length <= length) return text;
    return text.substring(0, length) + '...';
  },
};