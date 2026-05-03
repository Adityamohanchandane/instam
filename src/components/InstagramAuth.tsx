import { useState } from 'react';
import { Camera } from 'lucide-react';

interface Props {
  onConnect: (accessToken: string) => void;
}

export default function InstagramAuth({ onConnect }: Props) {
  const [loading, setLoading] = useState(false);

  function handleInstagramConnect() {
    setLoading(true);
    
    // Simulate Instagram connection for demo
    setTimeout(() => {
      // Mock successful connection
      const mockAccessToken = 'mock_instagram_token_' + Date.now();
      onConnect(mockAccessToken);
      setLoading(false);
    }, 2000);
  }

  return (
    <div className="instagram-auth">
      <button
        onClick={handleInstagramConnect}
        disabled={loading}
        className="instagram-connect-btn"
      >
        <Camera size={20} />
        {loading ? 'Connecting...' : 'Connect Instagram'}
      </button>
      <p className="auth-note">
        Demo mode - Simulated connection
      </p>
    </div>
  );
}
