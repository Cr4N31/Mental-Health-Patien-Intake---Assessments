import { useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import api, { errorMessage } from "../api/client.js";

export default function VerifyBanner() {
  const { user } = useAuth();
  const [state, setState] = useState("idle"); // idle | sending | sent | error
  const [error, setError] = useState("");

  if (!user || user.emailVerified) return null;

  async function resend() {
    setState("sending");
    setError("");
    try {
      await api.post("/auth/resend-verification");
      setState("sent");
    } catch (err) {
      setError(errorMessage(err));
      setState("error");
    }
  }

  return (
    <div className="mt-6 rounded-md border border-line bg-paper px-4 py-3 text-sm">
      <p>
        Please verify your email address. We sent a link to{" "}
        <span className="font-medium">{user.email}</span>.
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={resend}
          disabled={state === "sending" || state === "sent"}
          className="text-brand underline disabled:opacity-60"
        >
          {state === "sending" ? "Sending..." : "Resend email"}
        </button>
        {state === "sent" && (
          <span className="text-muted">
            Sent. Check your inbox and spam folder.
          </span>
        )}
        {state === "error" && (
          <span role="alert" className="text-risk">
            {error}
          </span>
        )}
      </div>
    </div>
  );
}
