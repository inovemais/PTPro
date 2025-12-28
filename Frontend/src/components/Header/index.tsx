import React from 'react';
import { Navbar, NavbarBrand, Nav, NavItem, NavLink, Button } from 'reactstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import scopes from '../../data/users/scopes';
import styles from './styles.module.scss';

const Header: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { isAuthenticated, scopes: userScopes, logout, user } = useAuth();
  const navigate = useNavigate();

  const hasScope = (scope: string) => userScopes && userScopes.includes(scope);

  const handleLogout = async () => {
    await logout();
  };

  return (
    <Navbar className={styles.navBar}>
      <div className={styles.leftSection}>
        <img src="/logo192.png" alt="Logo" className={styles.logo} />
        <NavbarBrand tag="span" className={styles.brand}>
          PTPro
        </NavbarBrand>
      </div>
      <Nav className={styles.rightSection} navbar>
        {!isAuthenticated && (
          <>
            <NavItem>
              <NavLink tag={Link} to="/login" className={styles.navLink}>
                Login
              </NavLink>
            </NavItem>
          </>
        )}
        {isAuthenticated && (
          <>
            {hasScope(scopes.Admin) && (
              <>
                <NavItem>
                  <NavLink tag={Link} to="/admin/trainers" className={styles.navLink}>
                    Trainers
                  </NavLink>
                </NavItem>
                <NavItem>
                  <NavLink tag={Link} to="/admin/requests" className={styles.navLink}>
                    Requests
                  </NavLink>
                </NavItem>
              </>
            )}
            {hasScope(scopes.PersonalTrainer) && (
              <>
                <NavItem>
                  <NavLink tag={Link} to="/trainer/clients" className={styles.navLink}>
                    My Clients
                  </NavLink>
                </NavItem>
              </>
            )}
            {hasScope(scopes.Client) && (
              <>
                <NavItem>
                  <NavLink tag={Link} to="/client/dashboard" className={styles.navLink}>
                    Dashboard
                  </NavLink>
                </NavItem>
                <NavItem>
                  <NavLink tag={Link} to="/client/calendar" className={styles.navLink}>
                    Calendar
                  </NavLink>
                </NavItem>
                <NavItem>
                  <NavLink tag={Link} to="/client/compliance" className={styles.navLink}>
                    Log Workout
                  </NavLink>
                </NavItem>
              </>
            )}
            <NavItem>
              <NavLink tag={Link} to="/chat" className={styles.navLink}>
                Chat
              </NavLink>
            </NavItem>
            <NavItem>
              <Button color="link" className={styles.logoutButton} onClick={handleLogout}>
                Logout
              </Button>
            </NavItem>
          </>
        )}
        <NavItem>
          <Button color="link" className={styles.themeToggle} onClick={toggleTheme}>
            {theme === 'dark' ? '☀️' : '🌙'}
          </Button>
        </NavItem>
      </Nav>
    </Navbar>
  );
};

export default Header;

