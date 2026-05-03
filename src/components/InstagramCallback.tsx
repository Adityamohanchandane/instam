import { useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';

export default function InstagramCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      console.error('Instagram auth error:', error);
      window.opener?.postMessage({ type: 'INSTAGRAM_AUTH_ERROR', error }, window.location.origin);
      window.close();
      return;
    }

    if (code) {
      // Exchange code for access token
      exchangeCodeForToken(code);
    }
  }, [searchParams]);

  async function exchangeCodeForToken(code: string) {
    try {
      const response = await fetch('/api/instagram-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });

      const data = await response.json();
      
      if (data.access_token) {
        window.opener?.postMessage(
          { type: 'INSTAGRAM_AUTH_SUCCESS', accessToken: data.access_token },
          window.location.origin
        );
      } else {
        window.opener?.postMessage(
          { type: 'INSTAGRAM_AUTH_ERROR', error: 'Failed to get access token' },
          window.location.origin
        );
      }
    } catch (error) {
      console.error('Token exchange failed:', error);
      window.opener?.postMessage(
        { type: 'INSTAGRAM_AUTH_ERROR', error: 'Token exchange failed' },
        window.location.origin
      );
    }
    
    window.close();
  }

  return (
    <div className="callback-container">
      <p>Connecting to Instagram...</p>
    </div>
  );
}
