import { ReactNode } from 'react';
import '../theme/oauth.css';

interface OAuthAuthLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
}

export function OAuthAuthLayout({ children, title = 'Bariisaa Tv', subtitle = "Your kid's reading companion" }: OAuthAuthLayoutProps) {
  return (
    <div className="oauth-root">
      <div style={{ width: '100%', maxWidth: 440 }}>
        <div className="oauth-brand">
          <div className="oauth-logo">B</div>
          <h1 className="oauth-title">{title}</h1>
          <p className="oauth-sub">{subtitle}</p>
        </div>
        <div className="oauth-card oauth-enter">{children}</div>
      </div>
    </div>
  );
}
