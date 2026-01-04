import { useEffect, useState, useCallback } from "react";
import { Container, Row, Col, Button } from "reactstrap";
import { useNavigate } from "react-router-dom";
import { buildApiUrl } from "../../config/api";
import Table from "../Table";
import styles from "./styles.module.scss";

interface Client {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
  };
  trainerId?: {
    _id: string;
  };
  heightCm?: number;
  weightKg?: number;
  goal?: string;
}

const TrainerClients = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const fetchClients = useCallback(async () => {
    setLoading(true);
    const token = localStorage.getItem("token");
    const headers: HeadersInit = {
      Accept: "application/json",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(
        buildApiUrl("/api/client-profiles?limit=100&skip=0"),
        {
          headers,
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.clients) {
        setClients(data.clients);
      }
    } catch (err) {
      console.error("Error fetching clients:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const tableData = clients.map((client) => ({
    _id: client._id,
    name: client.userId?.name || "N/A",
    email: client.userId?.email || "N/A",
    goal: client.goal || "-",
    actions: (
      <Button
        size="sm"
        color="primary"
        onClick={() => navigate(`/trainer/clients/${client._id}`)}
      >
        View Details
      </Button>
    ),
  }));

  return (
    <Container className={styles.container}>
      <Row>
        <Col>
          <h2>My Clients</h2>
          {loading ? (
            <p>Loading clients...</p>
          ) : clients.length === 0 ? (
            <p>No clients assigned yet.</p>
          ) : (
            <Table columns={["name", "email", "goal", "actions"]} rows={tableData} />
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default TrainerClients;

