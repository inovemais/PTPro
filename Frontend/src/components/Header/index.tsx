import React from 'react';
import { Navbar, NavbarBrand, Nav, NavItem, NavLink, Button } from 'reactstrap';
import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import scopes from '../../data/users/scopes';
import styles from './styles.module.scss';

const Header: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { isAuthenticated, scopes: userScopes, logout } = useAuth();
  const location = useLocation();

  const hasScope = (scope: string) => userScopes && userScopes.includes(scope);

  const handleLogout = async () => {
    await logout();
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <Navbar className={styles.navBar}>
      <Link to="/" className={styles.leftSection}>
        <img src="/logo192.png" alt="Logo" className={styles.logo} />
        <NavbarBrand tag="span" className={styles.brand}>
          PTPro
        </NavbarBrand>
      </Link>
      <Nav className={styles.rightSection} navbar>
        {!isAuthenticated && (
          <>
            <NavItem className={styles.navItem}>
              <NavLink 
                tag={Link} 
                to="/login" 
                className={`${styles.navLink} ${isActive('/login') ? styles.active : ''}`}
              >
                Login
              </NavLink>
            </NavItem>
          </>
        )}
        {isAuthenticated && (
          <>
            {hasScope(scopes.Admin) && (
              <>
                <NavItem className={styles.navItem}>
                  <NavLink 
                    tag={Link} 
                    to="/admin/users" 
                    className={`${styles.navLink} ${isActive('/admin/users') ? styles.active : ''}`}
                  >
                    Users
                  </NavLink>
                </NavItem>
              </>
            )}
            {hasScope(scopes.PersonalTrainer) && (
              <>
                <NavItem className={styles.navItem}>
                  <NavLink 
                    tag={Link} 
                    to="/trainer/clients" 
                    className={`${styles.navLink} ${isActive('/trainer/clients') ? styles.active : ''}`}
                  >
                    My Clients
                  </NavLink>
                </NavItem>
                <NavItem className={styles.navItem}>
                  <NavLink 
                    tag={Link} 
                    to="/trainer/plans" 
                    className={`${styles.navLink} ${isActive('/trainer/plans') ? styles.active : ''}`}
                  >
                    Training Plans
                  </NavLink>
                </NavItem>
              </>
            )}
            {hasScope(scopes.Client) && (
              <>
                <NavItem className={styles.navItem}>
                  <NavLink 
                    tag={Link} 
                    to="/client/dashboard" 
                    className={`${styles.navLink} ${isActive('/client/dashboard') ? styles.active : ''}`}
                  >
                    Dashboard
                  </NavLink>
                </NavItem>
                <NavItem className={styles.navItem}>
                  <NavLink 
                    tag={Link} 
                    to="/client/calendar" 
                    className={`${styles.navLink} ${isActive('/client/calendar') ? styles.active : ''}`}
                  >
                    Calendar
                  </NavLink>
                </NavItem>
              </>
            )}
            <NavItem className={styles.navItem}>
              <NavLink 
                tag={Link} 
                to="/chat" 
                className={`${styles.navLink} ${isActive('/chat') ? styles.active : ''}`}
              >
                Chat
              </NavLink>
            </NavItem>
            <NavItem className={styles.navItem}>
              <NavLink 
                tag={Link} 
                to="/profile" 
                className={`${styles.navLink} ${isActive('/profile') ? styles.active : ''}`}
              >
                Profile
              </NavLink>
            </NavItem>
            <NavItem className={styles.navItem}>
              <Button color="link" className={styles.logoutButton} onClick={handleLogout}>
                Logout
              </Button>
            </NavItem>
          </>
        )}
        <NavItem className={styles.navItem}>
          <Button color="link" className={styles.themeToggle} onClick={toggleTheme} aria-label="Toggle theme">
            {theme === 'dark' ? '☀️' : '🌙'}
          </Button>
        </NavItem>
      </Nav>
    </Navbar>
  );
};

export default Header;

