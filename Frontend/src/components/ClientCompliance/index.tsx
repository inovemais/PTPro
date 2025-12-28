import { useEffect, useState } from "react";
import { Container, Row, Col, Card, CardBody, CardTitle, Badge } from "reactstrap";
import { buildApiUrl } from "../../config/api";
import Table from "../Table";
import styles from "./styles.module.scss";

interface ComplianceLog {
  _id: string;
  date: string;
  status: "completed" | "missed" | "partial";
  reason?: string;
  workoutPlanId: {
    _id: string;
    name: string;
  };
}

const ClientCompliance = () => {
  const [logs, setLogs] = useState<ComplianceLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    missed: 0,
    partial: 0,
  });

  useEffect(() => {
    fetchCompliance();
    fetchStats();
  }, []);

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

  const fetchCompliance = async () => {
    setLoading(true);
    try {
      // First get client ID
      const clientRes = await fetch(buildApiUrl("/api/client-profiles/me"), {
        headers: authHeaders(),
        credentials: "include",
      });
      const clientData = await clientRes.json();

      if (clientData && clientData._id) {
        const logsRes = await fetch(
          buildApiUrl(`/api/compliance?clientId=${clientData._id}&limit=100&skip=0`),
          {
            headers: authHeaders(),
            credentials: "include",
          }
        );
        const logsData = await logsRes.json();
        setLogs(logsData.logs || []);
      }
    } catch (err) {
      console.error("Error fetching compliance:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const clientRes = await fetch(buildApiUrl("/api/client-profiles/me"), {
        headers: authHeaders(),
        credentials: "include",
      });
      const clientData = await clientRes.json();

      if (clientData && clientData._id) {
        const statsRes = await fetch(
          buildApiUrl(`/api/compliance/stats?clientId=${clientData._id}&period=month`),
          {
            headers: authHeaders(),
            credentials: "include",
          }
        );
        const statsData = await statsRes.json();
        if (statsData.stats) {
          setStats({
            total: statsData.stats.total || 0,
            completed: statsData.stats.completed || 0,
            missed: statsData.stats.missed || 0,
            partial: statsData.stats.partial || 0,
          });
        }
      }
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge color="success">Completed</Badge>;
      case "missed":
        return <Badge color="danger">Missed</Badge>;
      case "partial":
        return <Badge color="warning">Partial</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const tableData = logs.map((log) => ({
    _id: log._id,
    date: new Date(log.date).toLocaleDateString(),
    plan: log.workoutPlanId?.name || "N/A",
    status: getStatusBadge(log.status),
    reason: log.reason || "-",
  }));

  return (
    <Container className={styles.container}>
      <Row>
        <Col>
          <h2>Compliance History</h2>
        </Col>
      </Row>

      <Row className={styles.section}>
        <Col md="3">
          <Card>
            <CardBody>
              <CardTitle tag="h5">Total</CardTitle>
              <p className={styles.statNumber}>{stats.total}</p>
            </CardBody>
          </Card>
        </Col>
        <Col md="3">
          <Card>
            <CardBody>
              <CardTitle tag="h5">Completed</CardTitle>
              <p className={styles.statNumber}>{stats.completed}</p>
            </CardBody>
          </Card>
        </Col>
        <Col md="3">
          <Card>
            <CardBody>
              <CardTitle tag="h5">Missed</CardTitle>
              <p className={styles.statNumber}>{stats.missed}</p>
            </CardBody>
          </Card>
        </Col>
        <Col md="3">
          <Card>
            <CardBody>
              <CardTitle tag="h5">Partial</CardTitle>
              <p className={styles.statNumber}>{stats.partial}</p>
            </CardBody>
          </Card>
        </Col>
      </Row>

      <Row className={styles.section}>
        <Col>
          {loading ? (
            <p>Loading compliance history...</p>
          ) : logs.length === 0 ? (
            <p>No compliance records yet.</p>
          ) : (
            <Table
              columns={["date", "plan", "status", "reason"]}
              rows={tableData}
            />
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default ClientCompliance;

