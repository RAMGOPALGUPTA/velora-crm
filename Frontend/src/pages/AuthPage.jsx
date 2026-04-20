import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import VeloraLogo from "../components/VeloraLogo";
import { useAuth } from "../context/AuthContext";

const getErrorMessage = (error) =>
  error.response?.data?.msg || "Something went wrong. Please try again.";

function AuthPage() {
  const navigate = useNavigate();
  const { login, register } = useAuth();
  const [mode, setMode] = useState("login");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: ""
  });

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: value
    }));
  };

  useEffect(() => {
    document.title = mode === "login" ? "Velora CRM | Sign In" : "Velora CRM | Register";
  }, [mode]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      if (mode === "register") {
        await register(form);
        toast.success("Account created and logged in.");
        navigate("/dashboard");
      } else {
        await login({
          email: form.email,
          password: form.password
        });
        toast.success("Welcome back.");
        navigate("/dashboard");
      }
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-layout">
      <section className="brand-panel auth-brand-panel">
        <div className="brand-panel-top">
          <VeloraLogo
            variant="hero"
            subtitle="Revenue operations workspace"
          />
        </div>
        <h1 className="display-title">A cleaner way to manage leads, follow-ups, and revenue activity.</h1>
        <p className="lead-text">
          Velora CRM brings your sales pipeline, account activity, and follow-up discipline
          into one professional workspace built on top of your existing backend.
        </p>

        <div className="auth-feature-list">
          <div className="auth-feature-item">
            <span className="feature-bullet">01</span>
            <div>
              <strong>Pipeline visibility</strong>
              <p>Track every opportunity from first contact to closed deal.</p>
            </div>
          </div>
          <div className="auth-feature-item">
            <span className="feature-bullet">02</span>
            <div>
              <strong>Team accountability</strong>
              <p>Keep ownership, reminders, and deal progress visible across the team.</p>
            </div>
          </div>
          <div className="auth-feature-item">
            <span className="feature-bullet">03</span>
            <div>
              <strong>Revenue focus</strong>
              <p>Monitor active pipeline value, follow-ups, and forecasting in one place.</p>
            </div>
          </div>
        </div>

        <div className="brand-metrics auth-metric-grid">
          <div className="metric-chip">
            <strong>Lead Control</strong>
            <span>Organize contacts, companies, and active opportunities clearly.</span>
          </div>
          <div className="metric-chip">
            <strong>Pipeline Motion</strong>
            <span>Move deals through the funnel and keep stage progress updated.</span>
          </div>
          <div className="metric-chip">
            <strong>Commercial Insight</strong>
            <span>Review live metrics, reminders, and revenue performance at a glance.</span>
          </div>
        </div>
      </section>

      <section className="auth-card auth-card-premium">
        <div className="auth-card-head">
          <span className="eyebrow auth-access-pill">Secure Access</span>
          <span className="auth-note">Built for sales teams and account managers</span>
        </div>
        <h2 className="section-title">
          {mode === "login" ? "Welcome to Velora CRM" : "Create your Velora CRM account"}
        </h2>
        <p className="section-subtitle auth-copy">
          {mode === "login"
            ? "Sign in to review pipeline activity, manage follow-ups, and keep customer work organized."
            : "Set up your workspace access and start managing leads, accounts, and deal activity."}
        </p>

        <div className="auth-tabs auth-tabs-premium">
          <button
            className={mode === "login" ? "active" : ""}
            type="button"
            onClick={() => setMode("login")}
          >
            Login
          </button>
          <button
            className={mode === "register" ? "active" : ""}
            type="button"
            onClick={() => setMode("register")}
          >
            Register
          </button>
        </div>

        <form className="form-grid auth-form-shell" onSubmit={handleSubmit}>
          {mode === "register" && (
            <label className="field-label">
              Full name
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Ram Gopal"
                required
              />
            </label>
          )}

          <label className="field-label">
            Email
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder="you@company.com"
              required
            />
          </label>

          <label className="field-label">
            Password
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Enter secure password"
              minLength={6}
              required
            />
          </label>

          <button className="primary-button" type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? "Please wait..."
              : mode === "login"
                ? "Access workspace"
                : "Create workspace account"}
          </button>
        </form>

        <p className="helper-text auth-helper">
          New users are created with the Sales role by default and can be upgraded later
          when you expand permissions and team management.
        </p>
      </section>
    </div>
  );
}

export default AuthPage;
