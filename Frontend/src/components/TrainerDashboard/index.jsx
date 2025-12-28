import { Container, Row, Col } from "reactstrap";
import TrainerPlans from "../TrainerPlans";

const TrainerDashboard = () => {
  return (
    <Container>
      <Row>
        <Col>
          <h1>Dashboard do Personal Trainer</h1>
        </Col>
      </Row>
      <Row>
        <Col>
          <TrainerPlans />
        </Col>
      </Row>
    </Container>
  );
};

export default TrainerDashboard;


