import { useEffect, useState } from 'react';
import { mongodb } from './lib/mongodb';
import { getSessionId } from './lib/session';
import Onboarding from './components/Onboarding';
import RecommendationView from './components/RecommendationView';
import { SecurityDashboard } from './components/SecurityDashboard';
import AIFeaturesDemo from './components/AIFeaturesDemo';
import APIStatusDashboard from './components/APIStatusDashboard';
import AdvancedAIDashboard from './components/AdvancedAIDashboard';
import MusicSearch from './components/MusicSearch';
import SmartPhotoUpload from './components/SmartPhotoUpload';
import { securityMonitor } from './lib/security-monitor';
import type { UserProfile } from './lib/types';

const PROFILE_KEY = 'instam_profile';

export default function App() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [view, setView] = useState<'onboarding' | 'recommendations' | 'security' | 'ai-demo' | 'api-status' | 'advanced-ai' | 'music-search' | 'smart-photo'>('onboarding');

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
      console.log('⚠️ Could not load profile from MongoDB:', error instanceof Error ? error.message : 'Unknown error');
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
      console.error('❌ Error saving profile to MongoDB:', error instanceof Error ? error.message : 'Unknown error');
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

  if (view === 'advanced-ai') {
    return <AdvancedAIDashboard />;
  }

  if (view === 'music-search') {
    return (
      <div className="app">
        <nav className="app-nav">
          <button onClick={() => setView('recommendations')} className="nav-button">
            ← Back to Recommendations
          </button>
        </nav>
        <MusicSearch 
          language={profile?.preferred_languages?.[0]}
          onSelectSong={(song) => {
            console.log('Selected song:', song);
            setView('recommendations');
          }}
        />
      </div>
    );
  }

  if (view === 'smart-photo') {
    return (
      <div className="app">
        <nav className="app-nav">
          <button onClick={() => setView('recommendations')} className="nav-button">
            ← Back to Recommendations
          </button>
        </nav>
        <SmartPhotoUpload 
          onSongsFound={(songs) => {
            console.log('Found songs from photo:', songs);
            // Store in localStorage for later use
            localStorage.setItem('photo_songs', JSON.stringify(songs));
            setView('recommendations');
          }}
          onAnalysisComplete={(analysis) => {
            console.log('Photo analysis complete:', analysis);
            // Store analysis for recommendations
            localStorage.setItem('photo_analysis', JSON.stringify(analysis));
          }}
        />
      </div>
    );
  }

  return (
    <>
      <div className="fixed top-4 right-4 z-50 space-y-2">
        <button 
          onClick={() => setView('smart-photo')}
          className="block w-full px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 shadow-lg font-semibold"
        >
          📸 Smart Photo
        </button>
        <button 
          onClick={() => setView('music-search')}
          className="block w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 shadow-lg"
        >
          🎵 Search Music
        </button>
      </div>
      <RecommendationView userProfile={profile} onEditProfile={() => setEditMode(true)} />
    </>
  );
}
