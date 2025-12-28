import { Navbar, NavbarBrand, Nav, NavItem, NavLink, Button } from "reactstrap";
import { Link } from "react-router-dom";
import styles from "./styles.module.scss";
import { useTheme } from "../../context/ThemeContext";
import { useAuthContext } from "../../context/AuthContext";

const Header = () => {
  const { theme, toggleTheme } = useTheme();
  const { isAuthenticated, scopes, logout } = useAuthContext();

  const hasScope = (scope) => scopes && scopes.includes(scope);

  const handleLogout = async () => {
    await logout();
  };

  return (
    <Navbar className={styles.navBar}>
      <div className={styles.leftSection}>
        <img src="/logo192.png" alt="Logo" className={styles.logo} />
        <NavbarBrand tag="span" className={styles.brand}>Box APP</NavbarBrand>
      </div>
      <Nav className={styles.rightSection} navbar>
        {!isAuthenticated && (
          <>
            <NavItem>
              <NavLink tag={Link} to="/" className={styles.navLink}>
                Login
              </NavLink>
            </NavItem>
            <NavItem>
              <NavLink tag={Link} to="/register" className={styles.navLink}>
                Register
              </NavLink>
            </NavItem>
          </>
        )}
        {isAuthenticated && (
          <>
            {hasScope("admin") && (
              <NavItem>
                <NavLink tag={Link} to="/admin" className={styles.navLink}>
                  Admin
                </NavLink>
              </NavItem>
            )}
            {hasScope("personal_trainer") && (
              <NavItem>
                <NavLink tag={Link} to="/trainer" className={styles.navLink}>
                  PT Dashboard
                </NavLink>
              </NavItem>
            )}
            {hasScope("client") && (
              <NavItem>
                <NavLink tag={Link} to="/user" className={styles.navLink}>
                  Cliente
                </NavLink>
              </NavItem>
            )}
            <NavItem>
              <Button 
                color="link" 
                className={styles.logoutButton}
                onClick={handleLogout}
              >
                Logout
              </Button>
            </NavItem>
          </>
        )}
        <NavItem>
          <Button color="link" className={styles.themeToggle} onClick={toggleTheme}>
            {theme === "dark" ? "☀️" : "🌙"}
          </Button>
        </NavItem>
      </Nav>
    </Navbar>
  );
};

export default Header;
