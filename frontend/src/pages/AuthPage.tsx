
import { useState, type FormEvent } from "react";
import { supabase } from "../lib/supabase";
import "./AuthPage.css";

type AuthMode = "login" | "signup" | "forgot";

export default function AuthPage() {
  const [mode, setMode] = useState<AuthMode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const clearFeedback = () => {
    setError("");
    setMessage("");
  };

  const handleEmailAuth = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    clearFeedback();

    if (mode === "signup" && !name.trim()) {
      setError("Please enter your full name.");
      return;
    }

    if (password.length < 6 && mode !== "forgot") {
      setError("Password must contain at least 6 characters.");
      return;
    }

    setLoading(true);

    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: { full_name: name.trim() },
            emailRedirectTo: `${window.location.origin}/`,
          },
        });

        if (error) throw error;

        if (data.session) {
          setMessage("Account created successfully. Welcome to TalentPilot!");
        } else {
          setMessage(
            "Account created! Please check your email and verify your account before signing in."
          );
        }
      } else if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

        if (error) throw error;
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(
          email.trim(),
          {
            redirectTo: `${window.location.origin}/reset-password`,
          }
        );

        if (error) throw error;

        setMessage("Password reset instructions have been sent to your email.");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong. Try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    clearFeedback();
    setLoading(true);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });

      if (error) throw error;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Google sign-in failed."
      );
      setLoading(false);
    }
  };

  const heading =
    mode === "signup"
      ? "Create your account"
      : mode === "forgot"
        ? "Reset your password"
        : "Welcome back";

  const description =
    mode === "signup"
      ? "Start discovering opportunities that match your career."
      : mode === "forgot"
        ? "Enter your email and we'll send you reset instructions."
        : "Sign in to continue your career journey.";

  return (
    <main className="auth-page">
      <section className="auth-visual">
        <div className="auth-brand">
          <div className="auth-brand-icon">✦</div>
          <div>
            <strong>TalentPilot</strong>
            <span>AI JOB HUNTER</span>
          </div>
        </div>

        <div className="visual-content">
          <div className="visual-tag">
            <span className="visual-dot" />
            YOUR CAREER, ACCELERATED
          </div>

          <h1>
            Find work that
            <br />
            moves you <span>forward.</span>
          </h1>

          <p>
            Let AI help you discover relevant opportunities, understand your
            career fit and manage your job applications in one place.
          </p>

          <div className="visual-stats">
            <div>
              <strong>AI</strong>
              <span>Powered matching</span>
            </div>
            <div>
              <strong>6+</strong>
              <span>Job platforms planned</span>
            </div>
            <div>
              <strong>100%</strong>
              <span>Application control</span>
            </div>
          </div>
        </div>

        <div className="visual-bottom">
          <span>✦</span> Your next opportunity starts here.
          <span>Secure access · Private workspace</span>
        </div>

        <div className="visual-decoration decoration-one" />
        <div className="visual-decoration decoration-two" />
      </section>

      <section className="auth-form-section">
        <div className="auth-form-container">
          <div className="mobile-brand">
            <div className="auth-brand-icon">✦</div>
            <strong>TalentPilot</strong>
          </div>

          <div className="auth-heading">
            <div className="auth-eyebrow">
              {mode === "signup" ? "GET STARTED" : "YOUR WORKSPACE"}
            </div>
            <h2>{heading}</h2>
            <p>{description}</p>
          </div>

          {mode !== "forgot" && (
            <>
              <button
                type="button"
                className="google-button"
                onClick={handleGoogleLogin}
                disabled={loading}
              >
                <svg viewBox="0 0 48 48" width="19" height="19">
                  <path
                    fill="#EA4335"
                    d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                    transform="translate(0 0) scale(1)"
                  />
                  <path
                    fill="#4285F4"
                    d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.25 5.48-4.71 7.18l7.27 5.64c4.25-3.93 7.48-9.72 7.48-17.29z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M10.53 28.59A14.5 14.5 0 0 1 9.75 24c0-1.59.27-3.13.76-4.59l-7.98-6.2A23.9 23.9 0 0 0 0 24c0 3.87.93 7.53 2.56 10.78z"
                  />
                  <path
                    fill="#34A853"
                    d="M24 48c6.48 0 11.93-2.13 15.5-5.79l-7.27-5.64c-2.02 1.36-4.6 2.17-8.23 2.17-6.26 0-11.57-4.22-13.46-9.91l-7.98 6.2C6.51 42.62 14.62 48 24 48z"
                  />
                </svg>
                Continue with Google
              </button>

              <div className="auth-divider">
                <span />
                <small>OR CONTINUE WITH EMAIL</small>
                <span />
              </div>
            </>
          )}

          <form onSubmit={handleEmailAuth} className="auth-form">
            {mode === "signup" && (
              <label>
                Full name
                <input
                  type="text"
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                  required
                />
              </label>
            )}

            <label>
              Email address
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </label>

            {mode !== "forgot" && (
              <label>
                Password
                <div className="password-wrapper">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete={
                      mode === "signup" ? "new-password" : "current-password"
                    }
                    minLength={6}
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </label>
            )}

            {mode === "login" && (
              <div className="forgot-row">
                <button
                  type="button"
                  onClick={() => {
                    clearFeedback();
                    setMode("forgot");
                  }}
                >
                  Forgot password?
                </button>
              </div>
            )}

            {error && <div className="auth-error">{error}</div>}
            {message && <div className="auth-message">{message}</div>}

            <button
              className="auth-submit"
              type="submit"
              disabled={loading}
            >
              {loading
                ? "Please wait..."
                : mode === "signup"
                  ? "Create account"
                  : mode === "forgot"
                    ? "Send reset instructions"
                    : "Sign in"}
              {!loading && <span>→</span>}
            </button>
          </form>

          <div className="auth-switch">
            {mode === "forgot" ? (
              <button
                type="button"
                onClick={() => {
                  clearFeedback();
                  setMode("login");
                }}
              >
                ← Back to sign in
              </button>
            ) : (
              <>
                {mode === "login"
                  ? "Don't have an account?"
                  : "Already have an account?"}
                <button
                  type="button"
                  onClick={() => {
                    clearFeedback();
                    setMode(mode === "login" ? "signup" : "login");
                  }}
                >
                  {mode === "login" ? "Create account" : "Sign in"}
                </button>
              </>
            )}
          </div>

          <div className="auth-terms">
            By continuing, you agree to TalentPilot's Terms of Service
            and Privacy Policy.
          </div>
        </div>
      </section>
    </main>
  );
}
