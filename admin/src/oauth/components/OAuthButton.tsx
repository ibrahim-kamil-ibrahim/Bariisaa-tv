import { ButtonHTMLAttributes, ReactNode } from 'react';

export interface OAuthButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'outline' | 'google' | 'danger';
  fullWidth?: boolean;
}

const variantClass: Record<NonNullable<OAuthButtonProps['variant']>, string> = {
  primary: 'oauth-btn-primary',
  secondary: 'oauth-btn-secondary',
  outline: 'oauth-btn-outline',
  google: 'oauth-btn-google',
  danger: 'oauth-btn-danger',
};

export function OAuthButton({
  children,
  loading = false,
  variant = 'primary',
  fullWidth = true,
  className = '',
  disabled,
  ...props
}: OAuthButtonProps) {
  return (
    <button
      className={`oauth-btn ${variantClass[variant]} ${fullWidth ? '' : 'oauth-btn-auto'} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <>
          <svg className="oauth-spinner" width="20" height="20" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25" />
            <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span>Processing...</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}
