import React, { useState } from "react";
import { Button, FormGroup, Input, Label, MessageBox } from "@adminjs/design-system";
import { useTranslation } from "adminjs";
import { useSelector } from "react-redux";
import { buildAdminPath } from "../config/paths.js";
import { adminBrandMeta } from "../config/theme.js";

const PasswordVisibilityIcon = ({ visible }) =>
  visible ? (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="m3 3 18 18M10.6 10.7a2 2 0 0 0 2.7 2.7M9.9 4.2A10.8 10.8 0 0 1 12 4c5.5 0 9 5.9 9 5.9a14.7 14.7 0 0 1-2.1 2.8M6.6 6.6C4.4 8 3 9.9 3 9.9s3.5 5.9 9 5.9c1.2 0 2.3-.3 3.3-.7" />
    </svg>
  ) : (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M3 12s3.5-6 9-6 9 6 9 6-3.5 6-9 6-9-6-9-6Z" />
      <circle cx="12" cy="12" r="2.5" />
    </svg>
  );

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const props = window.__APP_STATE__ || {};
  const { action, errorMessage } = props;
  const { translateMessage } = useTranslation();
  const branding = useSelector((state) => state.branding);
  const companyName = branding?.companyName || adminBrandMeta.companyName;
  const logoSrc = branding?.logo;

  return (
    <div className="login__Wrapper sajha-login-shell">
      <section className="sajha-login-card" aria-label="Admin login">
        <div className="sajha-login-card__glow sajha-login-card__glow--orange" />
        <div className="sajha-login-card__glow sajha-login-card__glow--green" />

        <div className="sajha-login-card__brand">
          {logoSrc ? (
            <img
              src={logoSrc}
              alt={companyName}
              className="sajha-login-card__logo"
              onError={(event) => {
                event.currentTarget.onerror = null;
                event.currentTarget.src = buildAdminPath("/brand-logo.svg");
              }}
            />
          ) : (
            <div className="sajha-login-card__brandFallback">{companyName}</div>
          )}
        </div>

        <div className="sajha-login-card__header">
          <h1 className="sajha-login-card__title">Admin Login</h1>
          <p className="sajha-login-card__subtitle">
            Sign in with your administrator email and password.
          </p>
        </div>

        {errorMessage ? (
          <MessageBox
            variant="danger"
            message={
              errorMessage.split(" ").length > 1
                ? errorMessage
                : translateMessage(errorMessage)
            }
          />
        ) : null}

        <form action={action} method="POST" className="sajha-login-card__form">
          <FormGroup>
            <Label required>Email</Label>
            <Input
              name="email"
              type="email"
              autoComplete="email"
              placeholder="Email"
            />
          </FormGroup>

          <FormGroup>
            <Label required>Password</Label>
            <div className="sajha-login-card__password">
              <Input
                type={showPassword ? "text" : "password"}
                name="password"
                autoComplete="current-password"
                placeholder="Password"
              />
              <button
                type="button"
                className="sajha-login-card__password-toggle"
                onClick={() => setShowPassword((visible) => !visible)}
                aria-pressed={showPassword}
                aria-label={showPassword ? "Hide password" : "Show password"}
                title={showPassword ? "Hide password" : "Show password"}
              >
                <PasswordVisibilityIcon visible={showPassword} />
              </button>
            </div>
          </FormGroup>

          <a
            className="sajha-login-card__forgot"
            href="/forgot-password?account=admin"
          >
            Forgot password?
          </a>

          <Button type="submit" variant="contained" className="sajha-login-card__submit">
            Login
          </Button>
        </form>
      </section>
    </div>
  );
}
