import { useEffect, useState } from 'react';
import { mongodb } from './lib/mongodb';
import { getSessionId } from './lib/session';
import Onboarding from './components/Onboarding';
import RecommendationView from './components/RecommendationView';
import { SecurityDashboard } from './components/SecurityDashboard';
import AIFeaturesDemo from './components/AIFeaturesDemo';
import APIStatusDashboard from './components/APIStatusDashboard';
import { securityMonitor } from './lib/security-monitor';
import type { UserProfile } from './lib/types';

const PROFILE_KEY = 'instam_profile';

export default function App() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [view, setView] = useState<'onboarding' | 'recommendations' | 'security' | 'ai-demo' | 'api-status'>('onboarding');

  const sessionId = getSessionId();

  useEffect(() => {
    loadProfile();
    // Start security monitoring
    securityMonitor.startMonitoring();
    
    return () => {
      // Cleanup on unmount
      securityMonitor.stopMonitoring();
    };
  }, []);

  async function loadProfile() {
    const stored = localStorage.getItem(PROFILE_KEY);
    if (stored) {
      const profile = JSON.parse(stored);
      setProfile(profile);
      if (profile.editMode) {
        setView('onboarding');
      } else {
        setView('recommendations');
      }
      setLoading(false);
      return;
    }

    // Try to load from MongoDB
    try {
      console.log('Loading profile from MongoDB...');
      await mongodb.connect();
      const data = await mongodb.getProfile(sessionId);
      
      if (data) {
        setProfile(data);
        localStorage.setItem('userProfile', JSON.stringify(data));
        setView('recommendations');
        console.log('✅ Profile loaded from MongoDB');
      } else {
        setView('onboarding');
        console.log('No profile in MongoDB, showing onboarding');
      }
    } catch (error) {
      console.log('⚠️ Could not load profile from MongoDB:', error.message);
      setView('onboarding');
    }
    setLoading(false);
  }

  async function handleOnboardingComplete(p: UserProfile) {
    console.log('=== APP: ONBOARDING COMPLETE STARTED ===');
    console.log('Received profile:', p);
    console.log('PROFILE_KEY:', PROFILE_KEY);
    
    try {
      console.log('Saving profile to MongoDB...');
      await mongodb.connect();
      await mongodb.saveProfile(p);
      console.log('✅ Profile saved to MongoDB');
    } catch (error) {
      console.log('⚠️ Could not save profile to MongoDB:', error.message);
    }
    
    console.log('Saving to localStorage...');
    localStorage.setItem(PROFILE_KEY, JSON.stringify(p));
    console.log('localStorage updated');
    
    console.log('Setting profile state...');
    setProfile(p);
    console.log('Profile state set');
    
    console.log('Changing view to recommendations...');
    setView('recommendations');
    console.log('✅ View changed to recommendations');
    
    console.log('=== APP: ONBOARDING COMPLETE FINISHED ===');
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

  if (view === 'onboarding' || !profile || editMode) {
    return <Onboarding sessionId={sessionId} onComplete={handleOnboardingComplete} />;
  }

  if (view === 'security') {
    return <SecurityDashboard />;
  }

  if (view === 'ai-demo') {
    return <AIFeaturesDemo />;
  }

  if (view === 'api-status') {
    return <APIStatusDashboard />;
  }

  return <RecommendationView userProfile={profile} onEditProfile={() => setEditMode(true)} />;
}
