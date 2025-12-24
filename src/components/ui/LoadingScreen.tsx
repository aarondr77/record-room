import './LoadingScreen.css';

interface LoadingScreenProps {
  message?: string;
}

export function LoadingScreen({ message = 'Loading...' }: LoadingScreenProps) {
  return (
    <div className="loading-screen">
      <div className="loading-screen-content">
        <div className="loading-heart">{'<3'}</div>
      </div>
    </div>
  );
}

