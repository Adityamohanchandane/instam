import { useEffect, useState } from "react";
import { connectSpotifyCallback } from "../lib/spotify-client";
import { getSessionId } from "../lib/session";

export default function SpotifyCallback() {
  const [status, setStatus] = useState<"loading" | "ok" | "error">("loading");
  const [message, setMessage] = useState("Connecting Spotify…");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const error = params.get("error");

    if (error) {
      setStatus("error");
      setMessage(`Spotify connection cancelled: ${error}`);
      return;
    }

    if (!code) {
      setStatus("error");
      setMessage("Missing authorization code.");
      return;
    }

    const redirectUri = `${window.location.origin}${window.location.pathname}`;
    const sessionId = getSessionId();

    connectSpotifyCallback(code, redirectUri, sessionId)
      .then((ok) => {
        if (ok) {
          setStatus("ok");
          setMessage("Spotify connected! Redirecting…");
          localStorage.setItem("instam_spotify_connected", "1");
          setTimeout(() => {
            window.location.href = "/";
          }, 1500);
        } else {
          setStatus("error");
          setMessage("Could not complete Spotify connection.");
        }
      })
      .catch(() => {
        setStatus("error");
        setMessage("Spotify connection failed.");
      });
  }, []);

  return (
    <div className="spotify-callback-page">
      <div className="spotify-callback-card">
        <h1>Spotify</h1>
        <p className={status === "error" ? "error-text" : ""}>{message}</p>
        {status === "error" && (
          <a href="/" style={{ display: "inline-block", marginTop: 16 }}>
            Back to Instam
          </a>
        )}
      </div>
    </div>
  );
}
