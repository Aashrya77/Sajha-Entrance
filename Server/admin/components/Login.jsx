import React from "react";
import { Button, FormGroup, Input, Label, MessageBox } from "@adminjs/design-system";
import { useTranslation } from "adminjs";
import { useSelector } from "react-redux";
import { buildAdminPath } from "../config/paths.js";
import { adminBrandMeta } from "../config/theme.js";

export default function Login() {
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
            <Input
              type="password"
              name="password"
              autoComplete="current-password"
              placeholder="Password"
            />
          </FormGroup>

          <Button type="submit" variant="contained" className="sajha-login-card__submit">
            Login
          </Button>
        </form>
      </section>
    </div>
  );
}
