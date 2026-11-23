import React, { forwardRef, useId } from 'react';
import styles from './Form.module.scss';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, className = '', id, ...props }, ref) => {
    const autoId = useId();
    const textareaId = id || autoId;
    const noteId = `${textareaId}-note`;
    return (
      <div className={`${styles.formGroup} ${className}`}>
        {label && (
          <label className={styles.label} htmlFor={textareaId}>
            {label}
            {props.required && <span className={styles.required} aria-hidden>*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          aria-invalid={error ? true : undefined}
          aria-describedby={error || hint ? noteId : undefined}
          className={`${styles.input} ${error ? styles.error : ''}`}
          {...props}
        />
        {error && <span id={noteId} className={styles.errorMessage} role="alert">{error}</span>}
        {hint && !error && <span id={noteId} className={styles.hint}>{hint}</span>}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
