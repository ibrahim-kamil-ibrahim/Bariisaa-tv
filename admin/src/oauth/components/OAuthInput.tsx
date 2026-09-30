import { forwardRef, InputHTMLAttributes, ReactNode, useState } from 'react';

export interface OAuthInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: ReactNode;
  helpText?: string;
}

export const OAuthInput = forwardRef<HTMLInputElement, OAuthInputProps>(
  ({ label, error, icon, helpText, className = '', type = 'text', ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === 'password';
    const inputType = isPassword && showPassword ? 'text' : type;
    const withIcon = icon ? 'oauth-input-with-icon' : '';
    const withToggle = isPassword ? 'oauth-input-with-toggle' : '';

    return (
      <div className="oauth-field">
        {label && (
          <label className="oauth-label">
            {label}
            {props.required && <span className="oauth-label-star">*</span>}
          </label>
        )}
        <div className="oauth-input-wrap">
          {icon && <span className="oauth-icon">{icon}</span>}
          <input
            ref={ref}
            type={inputType}
            className={`oauth-input ${withIcon} ${withToggle} ${error ? 'oauth-input-error' : ''} ${className}`}
            {...props}
          />
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="oauth-input-toggle"
              tabIndex={-1}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          )}
        </div>
        {helpText && !error && <p className="oauth-help">{helpText}</p>}
        {error && <p className="oauth-help" style={{ color: 'var(--playful-red)', fontWeight: 700 }}>{error}</p>}
      </div>
    );
  }
);
OAuthInput.displayName = 'OAuthInput';
