import { useEffect, useState, useCallback } from "react";
import { Container, Row, Col, Button, Badge } from "reactstrap";
import { buildApiUrl } from "../../config/api";
import Table from "../Table";
import styles from "./styles.module.scss";

interface Trainer {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
  };
  bio?: string;
  specialties?: string[];
  isValidated: boolean;
  createdAt: string;
}

const AdminTrainers = () => {
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  const fetchTrainers = useCallback(async (page = 1, pageSize = 10) => {
    setLoading(true);
    const skip = (page - 1) * pageSize;
    const queryParams = new URLSearchParams({
      limit: pageSize.toString(),
      skip: skip.toString(),
    });

    const token = localStorage.getItem("token");
    const headers: HeadersInit = {
      Accept: "application/json",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(
        buildApiUrl(`/api/trainer-profiles?${queryParams}`),
        {
          headers,
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.trainers) {
        setTrainers(data.trainers);
        setPagination({
          current: page,
          pageSize,
          total: data.pagination?.total || data.trainers.length,
        });
      }
    } catch (err) {
      console.error("Error fetching trainers:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTrainers();
  }, [fetchTrainers]);

  const handleValidate = async (trainerId: string) => {
    const token = localStorage.getItem("token");
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(
        buildApiUrl(`/api/trainer-profiles/${trainerId}`),
        {
          method: "PUT",
          headers,
          credentials: "include",
          body: JSON.stringify({ isValidated: true }),
        }
      );

      if (response.ok) {
        fetchTrainers(pagination.current, pagination.pageSize);
      }
    } catch (err) {
      console.error("Error validating trainer:", err);
    }
  };

  const tableData = trainers.map((trainer) => ({
    _id: trainer._id,
    name: trainer.userId?.name || "N/A",
    email: trainer.userId?.email || "N/A",
    validated: trainer.isValidated ? (
      <Badge color="success">Validated</Badge>
    ) : (
      <Badge color="warning">Pending</Badge>
    ),
    actions: trainer.isValidated ? (
      <span>-</span>
    ) : (
      <Button
        size="sm"
        color="primary"
        onClick={() => handleValidate(trainer._id)}
      >
        Validate
      </Button>
    ),
  }));

  return (
    <Container className={styles.container}>
      <Row>
        <Col>
          <h2>Trainers Management</h2>
          {loading ? (
            <p>Loading trainers...</p>
          ) : (
            <Table
              columns={["name", "email", "validated", "actions"]}
              rows={tableData}
            />
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default AdminTrainers;

