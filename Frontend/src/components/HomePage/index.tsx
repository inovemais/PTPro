import styles from "./styles.module.scss";
import LoginForm from "../LoginForm/index";

const HomePage = () => {
  return (
    <div className={styles.homePage}>
      <LoginForm title="Admin" role="admin" />
    </div>
  );
};

export default HomePage;

