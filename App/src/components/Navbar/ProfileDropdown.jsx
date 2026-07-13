import React, { useEffect, useId, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronDown,
  LayoutDashboard,
  LogOut,
  UserCircle,
} from 'lucide-react';

const menuItems = [
  {
    label: 'Dashboard',
    type: 'link',
    to: '/student/profile',
    icon: LayoutDashboard,
    className: 'profile-dropdown__item',
  },
  {
    label: 'Logout',
    type: 'button',
    icon: LogOut,
    className: 'profile-dropdown__item profile-dropdown__item--danger',
  },
];

const ProfileDropdown = ({
  username = 'Profile',
  onLogout,
  variant = 'desktop',
  isDashboardActive = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef(null);
  const buttonRef = useRef(null);
  const menuRef = useRef(null);
  const menuId = useId();
  const profileName = String(username || '').trim() || 'Profile';

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handlePointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        buttonRef.current?.focus();
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const focusMenuItem = (nextIndex) => {
    const items = menuRef.current?.querySelectorAll('[role="menuitem"]');
    const item = items?.[nextIndex];
    if (item) {
      item.focus();
    }
  };

  const handleButtonKeyDown = (event) => {
    if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setIsOpen(true);
      window.requestAnimationFrame(() => focusMenuItem(0));
    }
  };

  const handleMenuKeyDown = (event) => {
    const items = Array.from(menuRef.current?.querySelectorAll('[role="menuitem"]') || []);
    const currentIndex = items.indexOf(document.activeElement);

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      focusMenuItem((currentIndex + 1) % items.length);
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      focusMenuItem((currentIndex - 1 + items.length) % items.length);
    }

    if (event.key === 'Home') {
      event.preventDefault();
      focusMenuItem(0);
    }

    if (event.key === 'End') {
      event.preventDefault();
      focusMenuItem(items.length - 1);
    }
  };

  const handleItemSelect = () => {
    setIsOpen(false);
  };

  const handleLogout = () => {
    handleItemSelect();
    onLogout?.();
  };

  return (
    <div
      className={`profile-dropdown profile-dropdown--${variant}${isOpen ? ' is-open' : ''}${isDashboardActive ? ' is-dashboard-active' : ''}`}
      ref={rootRef}
    >
      <button
        ref={buttonRef}
        type="button"
        className="profile-dropdown__trigger"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={menuId}
        aria-label={`Open profile menu for ${profileName}`}
        aria-current={isDashboardActive ? 'page' : undefined}
        onClick={() => setIsOpen((prev) => !prev)}
        onKeyDown={handleButtonKeyDown}
      >
        <span className="profile-dropdown__avatar" aria-hidden="true">
          <UserCircle size={variant === 'mobile' ? 16 : 18} strokeWidth={2.2} />
        </span>
        <span className="profile-dropdown__copy">
          <span className="profile-dropdown__greeting">
            {isDashboardActive ? 'Dashboard' : 'Welcome !'}
          </span>
          <span className="profile-dropdown__name">{profileName}</span>
        </span>
        <ChevronDown className="profile-dropdown__chevron" size={18} strokeWidth={2.2} />
      </button>

      <div
        id={menuId}
        ref={menuRef}
        className="profile-dropdown__menu"
        role="menu"
        aria-label="Profile menu"
        aria-hidden={!isOpen}
        onKeyDown={handleMenuKeyDown}
      >
        {menuItems.map((item, index) => {
          const Icon = item.icon;
          const isLast = index === menuItems.length - 1;

          return (
            <React.Fragment key={item.label}>
              {item.type === 'link' ? (
                <Link
                  to={item.to}
                  className={`${item.className}${isDashboardActive ? ' profile-dropdown__item--active' : ''}`}
                  role="menuitem"
                  tabIndex={isOpen ? 0 : -1}
                  onClick={handleItemSelect}
                  aria-current={isDashboardActive ? 'page' : undefined}
                >
                  <Icon size={18} strokeWidth={2.1} aria-hidden="true" />
                  <span>{item.label}</span>
                </Link>
              ) : (
                <button
                  type="button"
                  className={item.className}
                  role="menuitem"
                  tabIndex={isOpen ? 0 : -1}
                  onClick={handleLogout}
                >
                  <Icon size={18} strokeWidth={2.1} aria-hidden="true" />
                  <span>{item.label}</span>
                </button>
              )}
              {!isLast && <span className="profile-dropdown__divider" aria-hidden="true" />}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

export default ProfileDropdown;
