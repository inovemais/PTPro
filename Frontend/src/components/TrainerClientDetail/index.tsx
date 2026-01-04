import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Container, Row, Col, Card, CardBody, CardTitle, Button } from "reactstrap";
import { buildApiUrl } from "../../config/api";
import styles from "./styles.module.scss";

interface Client {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
  };
  heightCm?: number;
  weightKg?: number;
  goal?: string;
  notes?: string;
}

const TrainerClientDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(false);
  const [complianceStats, setComplianceStats] = useState({
    total: 0,
    completed: 0,
    missed: 0,
  });

  useEffect(() => {
    if (id) {
      fetchClient();
      fetchComplianceStats();
    }
  }, [id]);

  const authHeaders = () => {
    const token = localStorage.getItem("token");
    const headers: HeadersInit = {
      Accept: "application/json",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    return headers;
  };

  const fetchClient = async () => {
    setLoading(true);
    try {
      const response = await fetch(buildApiUrl(`/api/client-profiles/${id}`), {
        headers: authHeaders(),
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setClient(data);
      }
    } catch (err) {
      console.error("Error fetching client:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchComplianceStats = async () => {
    try {
      const response = await fetch(
        buildApiUrl(`/api/workout-logs/stats?clientId=${id}&period=month`),
        {
          headers: authHeaders(),
          credentials: "include",
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.stats) {
          setComplianceStats({
            total: data.stats.total || 0,
            completed: data.stats.completed || 0,
            missed: data.stats.missed || 0,
          });
        }
      }
    } catch (err) {
      console.error("Error fetching compliance stats:", err);
    }
  };

  if (loading) {
    return (
      <Container>
        <p>Loading client details...</p>
      </Container>
    );
  }

  if (!client) {
    return (
      <Container>
        <p>Client not found</p>
      </Container>
    );
  }

  return (
    <Container className={styles.container}>
      <Row>
        <Col>
          <Button
            color="secondary"
            onClick={() => navigate("/trainer/clients")}
            className={styles.backButton}
          >
            ← Back to Clients
          </Button>
          <h2>Client Details: {client.userId?.name}</h2>
        </Col>
      </Row>

      <Row className={styles.section}>
        <Col md="6">
          <Card>
            <CardBody>
              <CardTitle tag="h4">Personal Information</CardTitle>
              <p>
                <strong>Name:</strong> {client.userId?.name}
              </p>
              <p>
                <strong>Email:</strong> {client.userId?.email}
              </p>
              <p>
                <strong>Height:</strong> {client.heightCm ? `${client.heightCm} cm` : "N/A"}
              </p>
              <p>
                <strong>Weight:</strong> {client.weightKg ? `${client.weightKg} kg` : "N/A"}
              </p>
              <p>
                <strong>Goal:</strong> {client.goal || "Not specified"}
              </p>
              {client.notes && (
                <p>
                  <strong>Notes:</strong> {client.notes}
                </p>
              )}
            </CardBody>
          </Card>
        </Col>

        <Col md="6">
          <Card>
            <CardBody>
              <CardTitle tag="h4">Compliance Statistics</CardTitle>
              <p>
                <strong>Total Workouts:</strong> {complianceStats.total}
              </p>
              <p>
                <strong>Completed:</strong> {complianceStats.completed}
              </p>
              <p>
                <strong>Missed:</strong> {complianceStats.missed}
              </p>
              {complianceStats.total > 0 && (
                <p>
                  <strong>Completion Rate:</strong>{" "}
                  {Math.round(
                    (complianceStats.completed / complianceStats.total) * 100
                  )}
                  %
                </p>
              )}
            </CardBody>
          </Card>
        </Col>
      </Row>

      <Row className={styles.section}>
        <Col>
          <Button
            color="primary"
            onClick={() => navigate(`/trainer/plans/${id}`)}
          >
            Manage Training Plans
          </Button>
        </Col>
      </Row>
    </Container>
  );
};

export default TrainerClientDetail;

