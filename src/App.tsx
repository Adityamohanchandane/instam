import { useEffect, useState } from "react";
import { mongodb } from "./lib/mongodb";
import { getSessionId } from "./lib/session";
import Onboarding from "./components/Onboarding";
import RecommendationView from "./components/RecommendationView";
import { securityMonitor } from "./lib/security-monitor";
import type { UserProfile } from "./lib/types";

const PROFILE_KEY = "instam_profile";

type AppView = "onboarding" | "recommendations";

export default function App() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [view, setView] = useState<AppView>("onboarding");

  const sessionId = getSessionId();

  useEffect(() => {
    loadProfile();
    securityMonitor.startMonitoring();

    return () => {
      securityMonitor.stopMonitoring();
    };
  }, []);

  async function loadProfile() {
    const stored = localStorage.getItem(PROFILE_KEY);
    if (stored) {
      const storedProfile = JSON.parse(stored);
      setProfile(storedProfile);
      setView(storedProfile.editMode ? "onboarding" : "recommendations");
      setLoading(false);
      return;
    }

    try {
      console.log("Loading profile from API/local fallback...");
      await mongodb.connect();
      const data = await mongodb.getProfile(sessionId);

      if (data) {
        setProfile(data);
        localStorage.setItem(PROFILE_KEY, JSON.stringify(data));
        setView("recommendations");
      } else {
        setView("onboarding");
      }
    } catch (error) {
      console.log(
        "Could not load profile, showing onboarding:",
        error instanceof Error ? error.message : "Unknown error",
      );
      setView("onboarding");
    }

    setLoading(false);
  }

  async function handleOnboardingComplete(profileData: UserProfile) {
    try {
      await mongodb.connect();
      await mongodb.saveProfile(profileData);
    } catch (error) {
      console.log(
        "Profile saved locally because API save failed:",
        error instanceof Error ? error.message : "Unknown error",
      );
    }

    localStorage.setItem(PROFILE_KEY, JSON.stringify(profileData));
    setProfile(profileData);
    setEditMode(false);
    setView("recommendations");
  }

  if (loading) {
    return (
      <div className="splash-screen">
        <div className="splash-logo">
          <span className="splash-icon">🎵</span>
          <span className="splash-text">Instam</span>
        </div>
        <div className="splash-dots">
          <span />
          <span />
          <span />
        </div>
      </div>
    );
  }

  if (view === "onboarding" || !profile || editMode) {
    return (
      <Onboarding sessionId={sessionId} onComplete={handleOnboardingComplete} />
    );
  }

  return (
    <RecommendationView
      userProfile={profile}
      onEditProfile={() => setEditMode(true)}
    />
  );
}
