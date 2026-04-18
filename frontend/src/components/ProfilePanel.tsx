import { useEffect, useState } from "react";
import { getAvatarUrl } from "../utils/avatar";
import "../style/profilePanel.css";

type HistoryItem = {
  attemptId: number;
  title: string;
  score: number;
  finishedAt: string;
};

type Profile = {
  id: number;
  username: string;
  avatar: string;
  bestScore: number;
  averageScore: number;
  testsCompleted: number;
  rank: number;
  history: HistoryItem[];
};

type ProfilePanelProps = {
  onClose: () => void;
};

const ProfilePanel = ({ onClose }: ProfilePanelProps) => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/profile`, {
          credentials: "include",
        });

        const data: { message?: string; profile?: Profile } = await res.json();

        if (!res.ok) {
          throw new Error(data.message || "Failed to load profile");
        }

        if (!data.profile) {
          throw new Error("No profile data");
        }

        setProfile({
          ...data.profile,
          history: data.profile.history ?? [],
        });
      } catch (error: unknown) {
        if (error instanceof Error) {
          setError(error.message);
        } else {
          setError("Something went wrong");
        }
      }
    };

    fetchProfile();
  }, []);

  if (error) {
    return (
      <div className="profile-panel-overlay" onClick={onClose}>
        <aside className="profile-panel" onClick={(e) => e.stopPropagation()}>
          <button className="profile-panel__close" onClick={onClose}>
            ×
          </button>

          <p className="profile-panel__error">{error}</p>
        </aside>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="profile-panel-overlay" onClick={onClose}>
        <aside className="profile-panel" onClick={(e) => e.stopPropagation()}>
          <button className="profile-panel__close" onClick={onClose}>
            ×
          </button>

          <p className="profile-panel__loading">Loading profile...</p>
        </aside>
      </div>
    );
  }

  return (
    <div className="profile-panel-overlay" onClick={onClose}>
      <aside className="profile-panel" onClick={(e) => e.stopPropagation()}>
        <button className="profile-panel__close" onClick={onClose}>
          ×
        </button>

        <div className="profile-panel__header">
          <img
            className="profile-panel__avatar"
            src={getAvatarUrl(profile.avatar || "default-avatar")}
            alt={profile.username}
          />

          <div>
            <h2 className="profile-panel__username">{profile.username}</h2>
            <p className="profile-panel__rank">Rank #{profile.rank}</p>
          </div>
        </div>

        <div className="profile-panel__stats">
          <div className="profile-panel__stat-card">
            <p className="profile-panel__stat-label">Best Score</p>
            <p className="profile-panel__stat-value">{profile.bestScore}</p>
          </div>

          <div className="profile-panel__stat-card">
            <p className="profile-panel__stat-label">Average Score</p>
            <p className="profile-panel__stat-value">{profile.averageScore}</p>
          </div>

          <div className="profile-panel__stat-card">
            <p className="profile-panel__stat-label">Tests Completed</p>
            <p className="profile-panel__stat-value">
              {profile.testsCompleted}
            </p>
          </div>
        </div>

        <div className="profile-panel__history">
          <h3 className="profile-panel__history-title">Recent Tests</h3>

          {(profile.history ?? []).length === 0 ? (
            <p className="profile-panel__empty">No completed tests yet.</p>
          ) : (
            <div className="profile-panel__history-list">
              {(profile.history ?? []).map((item) => (
                <div
                  key={item.attemptId}
                  className="profile-panel__history-card"
                >
                  <p className="profile-panel__history-test">{item.title}</p>
                  <p className="profile-panel__history-score">
                    Score: {item.score}
                  </p>
                  <p className="profile-panel__history-date">
                    {new Date(item.finishedAt).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
};

export default ProfilePanel;
