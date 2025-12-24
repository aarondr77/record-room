import { SignInScene } from '../components/canvas/SignInScene';
import './LoginPage.css';

interface LoginPageProps {
  onLogin: () => void;
  onSceneReady?: () => void;
}

export function LoginPage({ onLogin, onSceneReady }: LoginPageProps) {
  return (
    <div className="login-page">
      <div className="login-scene-container">
        <SignInScene onEnter={onLogin} onReady={onSceneReady} />
      </div>
    </div>
  );
}

