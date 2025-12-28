import { useEffect, useState } from "react";
import { Container, Row, Col, Card, CardBody, CardTitle } from "reactstrap";
import { buildApiUrl } from "../../config/api";
import styles from "./styles.module.scss";

interface Stats {
  total: number;
  completed: number;
  missed: number;
  partial: number;
  completionRate: number;
}

const ClientDashboard = () => {
  const [stats, setStats] = useState<Stats>({
    total: 0,
    completed: 0,
    missed: 0,
    partial: 0,
    completionRate: 0,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
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

  const fetchStats = async () => {
    setLoading(true);
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
          const total = statsData.stats.total || 0;
          const completed = statsData.stats.completed || 0;
          const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

          setStats({
            total,
            completed,
            missed: statsData.stats.missed || 0,
            partial: statsData.stats.partial || 0,
            completionRate,
          });
        }
      }
    } catch (err) {
      console.error("Error fetching stats:", err);
    } finally {
      setLoading(false);
    }
  };

  // Simple bar chart component
  const BarChart = ({ data }: { data: Stats }) => {
    const maxValue = Math.max(data.total, 1);
    const completedPercent = (data.completed / maxValue) * 100;
    const missedPercent = (data.missed / maxValue) * 100;
    const partialPercent = (data.partial / maxValue) * 100;

    return (
      <div className={styles.chartContainer}>
        <div className={styles.chart}>
          <div className={styles.barContainer}>
            <div
              className={`${styles.bar} ${styles.barCompleted}`}
              style={{ height: `${completedPercent}%` }}
            >
              <span className={styles.barLabel}>{data.completed}</span>
            </div>
            <div
              className={`${styles.bar} ${styles.barMissed}`}
              style={{ height: `${missedPercent}%` }}
            >
              <span className={styles.barLabel}>{data.missed}</span>
            </div>
            <div
              className={`${styles.bar} ${styles.barPartial}`}
              style={{ height: `${partialPercent}%` }}
            >
              <span className={styles.barLabel}>{data.partial}</span>
            </div>
          </div>
          <div className={styles.chartLabels}>
            <span>Completed</span>
            <span>Missed</span>
            <span>Partial</span>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <Container>
        <p>Loading dashboard...</p>
      </Container>
    );
  }

  return (
    <Container className={styles.container}>
      <Row>
        <Col>
          <h2>My Dashboard</h2>
        </Col>
      </Row>

      <Row className={styles.section}>
        <Col md="4">
          <Card>
            <CardBody>
              <CardTitle tag="h5">Total Workouts</CardTitle>
              <p className={styles.statNumber}>{stats.total}</p>
            </CardBody>
          </Card>
        </Col>
        <Col md="4">
          <Card>
            <CardBody>
              <CardTitle tag="h5">Completed</CardTitle>
              <p className={styles.statNumber}>{stats.completed}</p>
            </CardBody>
          </Card>
        </Col>
        <Col md="4">
          <Card>
            <CardBody>
              <CardTitle tag="h5">Completion Rate</CardTitle>
              <p className={styles.statNumber}>{stats.completionRate}%</p>
            </CardBody>
          </Card>
        </Col>
      </Row>

      <Row className={styles.section}>
        <Col>
          <Card>
            <CardBody>
              <CardTitle tag="h4">Workout Statistics</CardTitle>
              <BarChart data={stats} />
            </CardBody>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default ClientDashboard;

