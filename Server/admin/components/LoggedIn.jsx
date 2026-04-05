import React, { useEffect, useRef, useState } from "react";
import { Box, Icon } from "@adminjs/design-system";
import { useTranslation } from "adminjs";

export default function LoggedIn({ session, paths }) {
  const { translateButton } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef(null);

  const email = session?.email || "Admin";
  const role = session?.title || "Administrator";
  const avatarLetter = email.slice(0, 1).toUpperCase();

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handlePointerDown = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <Box
      ref={rootRef}
      data-css="logged-in"
      className="sajha-admin-logged-in"
      style={{ position: "relative" }}
    >
      <button
        type="button"
        className="sajha-admin-logged-in__trigger"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((current) => !current)}
        title={email}
      >
        <span
          className="sajha-admin-logged-in__avatar"
          aria-hidden="true"
          style={
            session?.avatarUrl
              ? { backgroundImage: `url(${session.avatarUrl})`, color: "transparent" }
              : undefined
          }
        >
          {avatarLetter}
        </span>
      </button>

      {isOpen ? (
        <Box as="div" className="sajha-admin-logged-in__menu" role="menu">
          <Box as="div" className="sajha-admin-logged-in__menuProfile">
            <span
              className="sajha-admin-logged-in__menuAvatar"
              aria-hidden="true"
              style={
                session?.avatarUrl
                  ? { backgroundImage: `url(${session.avatarUrl})`, color: "transparent" }
                  : undefined
              }
            >
              {avatarLetter}
            </span>

            <Box as="div" className="sajha-admin-logged-in__menuIdentity">
              <span className="sajha-admin-logged-in__email" title={email}>
                {email}
              </span>
              <span className="sajha-admin-logged-in__role">{role}</span>
            </Box>
          </Box>

          <a
            href={paths.logoutPath}
            role="menuitem"
            className="sajha-admin-logged-in__menuItem"
            onClick={() => setIsOpen(false)}
          >
            <Icon icon="LogOut" size={14} />
            <span>{translateButton("logout")}</span>
          </a>
        </Box>
      ) : null}
    </Box>
  );
}
