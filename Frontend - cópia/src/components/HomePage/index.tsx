import styles from "./styles.module.scss";
import { Row, Col, Container } from "reactstrap";
import LoginForm from "../LoginForm/index";

const HomePage = () => {
  return (
    <Container>
      <Row className={styles.row}>
        <Col className={styles.col}>
          <LoginForm title="Admin" role="admin" />
        </Col>
        <Col>
          <LoginForm title="User" role="user" />
        </Col>
      </Row>
    </Container>
  );
};

export default HomePage;

