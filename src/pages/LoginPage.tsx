import { SignInScene } from '../components/canvas/SignInScene';
import './LoginPage.css';

interface LoginPageProps {
  onLogin: () => void;
}

export function LoginPage({ onLogin }: LoginPageProps) {
  return (
    <div className="login-page">
      <div className="login-scene-container">
        <SignInScene onEnter={onLogin} />
      </div>
    </div>
  );
}

