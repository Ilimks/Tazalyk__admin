import React, { forwardRef, useId } from 'react';
import styles from './Form.module.scss';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: SelectOption[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, placeholder, className = '', id, ...props }, ref) => {
    const autoId = useId();
    const selectId = id || autoId;
    const noteId = `${selectId}-note`;
    return (
      <div className={`${styles.formGroup} ${className}`}>
        {label && (
          <label className={styles.label} htmlFor={selectId}>
            {label}
            {props.required && <span className={styles.required} aria-hidden>*</span>}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? noteId : undefined}
          className={`${styles.input} ${error ? styles.error : ''}`}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && <span id={noteId} className={styles.errorMessage} role="alert">{error}</span>}
      </div>
    );
  }
);

Select.displayName = 'Select';
