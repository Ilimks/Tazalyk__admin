import React, { forwardRef } from 'react';
import styles from './Form.module.scss';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, className = '', ...props }, ref) => {
    return (
      <div className={`${styles.formGroup} ${className}`}>
        {label && <label className={styles.label}>{label}</label>}
        <textarea
          ref={ref}
          className={`${styles.input} ${error ? styles.error : ''}`}
          {...props}
        />
        {error && <span className={styles.errorMessage}>{error}</span>}
        {hint && !error && <span className={styles.hint}>{hint}</span>}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';