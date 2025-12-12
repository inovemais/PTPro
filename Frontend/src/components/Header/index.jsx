import { Navbar, NavbarBrand, Nav, NavItem, NavLink } from "reactstrap";
import { Link } from "react-router-dom";
import styles from "./styles.module.scss";

const Header = () => {
  return (
    <Navbar className={styles.navBar}>
      <div className={styles.leftSection}>
        <img src="/logo192.png" alt="Logo" className={styles.logo} />
        <NavbarBrand tag="span" className={styles.brand}>PWD</NavbarBrand>
      </div>
      <Nav className={styles.rightSection} navbar>
        <NavItem>
          <NavLink tag={Link} to="/" className={styles.navLink}>
            Login
          </NavLink>
        </NavItem>
        <NavItem>
          <NavLink tag={Link} to="/" className={styles.navLink}>
            Register
          </NavLink>
        </NavItem>
      </Nav>
    </Navbar>
  );
};

export default Header;
