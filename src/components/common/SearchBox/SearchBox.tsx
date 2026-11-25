import { Search, X } from 'lucide-react';
import { Input } from '../Form';
import styles from './SearchBox.module.scss';

interface SearchBoxProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  // полное название для программ экранного чтения
  label: string;
}

// Поиск над списком. Один вид во всех разделах
export const SearchBox: React.FC<SearchBoxProps> = ({ value, onChange, placeholder, label }) => (
  <div className={styles.box} role="search">
    <Input
      className={styles.field}
      type="search"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === 'Escape' && value) onChange('');
      }}
      placeholder={placeholder}
      aria-label={label}
      icon={<Search />}
      maxLength={100}
      enterKeyHint="search"
      autoComplete="off"
    />
    {value && (
      <button type="button" className={styles.clear} onClick={() => onChange('')} aria-label="Очистить поиск" title="Очистить поиск">
        <X size={18} />
      </button>
    )}
  </div>
);
