import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import api, { errorMessage } from "../api/client.js";

export default function VerifyEmail() {
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const { refreshUser } = useAuth();

  const [status, setStatus] = useState(token ? "loading" : "error"); // loading | success | error
  const [message, setMessage] = useState(
    token ? "" : "This verification link is not valid.",
  );

  // The token works once, so make sure React's dev double-run does not call twice.
  const ran = useRef(false);

  useEffect(() => {
    if (!token || ran.current) return;
    ran.current = true;
    api
      .post("/auth/verify-email", { token })
      .then(async () => {
        await refreshUser();
        setStatus("success");
      })
      .catch((err) => {
        setMessage(errorMessage(err));
        setStatus("error");
      });
  }, [token, refreshUser]);

  return (
    <div className="flex min-h-screen items-center justify-center px-5">
      <div className="w-full max-w-sm">
        {status === "loading" && (
          <p className="text-muted">Verifying your email...</p>
        )}

        {status === "success" && (
          <>
            <h1 className="font-serif text-4xl font-semibold text-brand-dark">
              Email verified
            </h1>
            <p className="mt-3 text-lg">
              Thank you. Your email address is confirmed.
            </p>
            <Link
              to="/"
              className="mt-6 inline-block rounded-md bg-brand px-5 py-2.5 font-medium text-white hover:bg-brand-dark"
            >
              Continue
            </Link>
          </>
        )}

        {status === "error" && (
          <>
            <h1 className="font-serif text-3xl font-semibold text-brand-dark">
              Could not verify your email
            </h1>
            <p role="alert" className="mt-3 text-risk">
              {message}
            </p>
            <p className="mt-3 text-muted">
              Log in and use "Resend email" on your dashboard to get a new link.
            </p>
            <Link
              to="/login"
              className="mt-4 inline-block text-brand underline"
            >
              Go to log in
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
