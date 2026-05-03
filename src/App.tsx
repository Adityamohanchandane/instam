import { useEffect, useState } from 'react';
import { getSessionId } from './lib/session';
import Onboarding from './components/Onboarding';
import RecommendationView from './components/RecommendationView';
import type { UserProfile } from './lib/types';

const PROFILE_KEY = 'vibesync_profile';

export default function App() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);

  const sessionId = getSessionId();

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    const cached = localStorage.getItem(PROFILE_KEY);
    if (cached) {
      try {
        setProfile(JSON.parse(cached) as UserProfile);
        setLoading(false);
        return;
      } catch {
        // ignore
      }
    }

    const { data } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('session_id', sessionId)
      .maybeSingle();

    if (data) {
      setProfile(data as UserProfile);
      localStorage.setItem(PROFILE_KEY, JSON.stringify(data));
    }

    setLoading(false);
  }

  async function handleOnboardingComplete(p: UserProfile) {
    await supabase.from('user_profiles').upsert(
      { ...p, updated_at: new Date().toISOString() },
      { onConflict: 'session_id' }
    );
    localStorage.setItem(PROFILE_KEY, JSON.stringify(p));
    setProfile(p);
    setEditMode(false);
  }

  if (loading) {
    return (
      <div className="splash-screen">
        <div className="splash-logo">
          <span className="splash-icon">🎵</span>
          <span className="splash-text">Instam</span>
        </div>
        <div className="splash-dots">
          <span /><span /><span />
        </div>
      </div>
    );
  }

  if (!profile || editMode) {
    return <Onboarding sessionId={sessionId} onComplete={handleOnboardingComplete} />;
  }

  return <RecommendationView userProfile={profile} onEditProfile={() => setEditMode(true)} />;
}
