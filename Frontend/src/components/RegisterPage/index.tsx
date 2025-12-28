import { Container, Row, Col } from "reactstrap";
import RegisterForm from "../RegisterForm";

const RegisterPage = () => {
  return (
    <Container>
      <Row className="justify-content-center mt-4">
        <Col md={10} lg={8}>
          <RegisterForm />
        </Col>
      </Row>
    </Container>
  );
};

export default RegisterPage;


