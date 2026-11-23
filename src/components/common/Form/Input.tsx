import React, { forwardRef, useId } from 'react';
import styles from './Form.module.scss';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, icon, className = '', id, ...props }, ref) => {
    const autoId = useId();
    const inputId = id || autoId;
    const noteId = `${inputId}-note`;
    return (
      <div className={`${styles.formGroup} ${className}`}>
        {label && (
          <label className={styles.label} htmlFor={inputId}>
            {label}
            {props.required && <span className={styles.required} aria-hidden>*</span>}
          </label>
        )}
        <div className={styles.inputWrapper}>
          {icon && <span className={styles.icon}>{icon}</span>}
          <input
            ref={ref}
            id={inputId}
            aria-invalid={error ? true : undefined}
            aria-describedby={error || hint ? noteId : undefined}
            className={`${styles.input} ${error ? styles.error : ''} ${
              icon ? styles.withIcon : ''
            }`}
            {...props}
          />
        </div>
        {error && <span id={noteId} className={styles.errorMessage} role="alert">{error}</span>}
        {hint && !error && <span id={noteId} className={styles.hint}>{hint}</span>}
      </div>
    );
  }
);

Input.displayName = 'Input';
