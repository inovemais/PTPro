import { useEffect, useState } from "react";
import { Container, Row, Col, Card, CardBody, CardTitle } from "reactstrap";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler,
} from "chart.js";
import { Bar, Doughnut, Line } from "react-chartjs-2";
import apiClient from "../../lib/axios";
import styles from "./styles.module.scss";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
  Filler
);

interface PeriodStats {
  _id: {
    year?: number;
    month?: number;
    week?: number;
  };
  totalCompleted: number;
  totalMissed: number;
  totalPartial: number;
}

interface OverallStats {
  total: number;
  completed: number;
  missed: number;
  partial: number;
  completionRate: number;
}

const ClientDashboard = () => {
  const [weeklyStats, setWeeklyStats] = useState<PeriodStats[]>([]);
  const [monthlyStats, setMonthlyStats] = useState<PeriodStats[]>([]);
  const [loading, setLoading] = useState(false);
  const [period, setPeriod] = useState<"week" | "month">("week");

  useEffect(() => {
    fetchStats("week");
    fetchStats("month");
  }, []);

  const fetchStats = async (periodType: "week" | "month") => {
    setLoading(true);
    try {
      const response = await apiClient.get("/workout-logs/stats", {
        params: { period: periodType },
      });

      if (response.data.success) {
        const stats = response.data.data || [];
        if (periodType === "week") {
          setWeeklyStats(stats);
        } else {
          setMonthlyStats(stats);
        }
      }
    } catch (err) {
      console.error("Error fetching stats:", err);
    } finally {
      setLoading(false);
    }
  };

  const currentStats = period === "week" ? weeklyStats : monthlyStats;

  // Calculate overall stats
  const overallStats: OverallStats = currentStats.reduce(
    (acc, stat) => {
      acc.total +=
        stat.totalCompleted + stat.totalMissed + stat.totalPartial;
      acc.completed += stat.totalCompleted;
      acc.missed += stat.totalMissed;
      acc.partial += stat.totalPartial;
      return acc;
    },
    { total: 0, completed: 0, missed: 0, partial: 0, completionRate: 0 }
  );

  overallStats.completionRate =
    overallStats.total > 0
      ? Math.round((overallStats.completed / overallStats.total) * 100)
      : 0;

  // Format period labels
  const formatPeriodLabel = (stat: PeriodStats) => {
    if (period === "week") {
      return `Week ${stat._id.week}/${stat._id.year}`;
    } else {
      const monthNames = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      return `${monthNames[(stat._id.month || 1) - 1]} ${stat._id.year}`;
    }
  };

  // Bar chart data
  const barData = {
    labels: currentStats.map(formatPeriodLabel),
    datasets: [
      {
        label: "Completed",
        data: currentStats.map((stat) => stat.totalCompleted),
        backgroundColor: "rgba(40, 167, 69, 0.8)",
        borderColor: "rgba(40, 167, 69, 1)",
        borderWidth: 2,
        borderRadius: 6,
      },
      {
        label: "Missed",
        data: currentStats.map((stat) => stat.totalMissed),
        backgroundColor: "rgba(220, 53, 69, 0.8)",
        borderColor: "rgba(220, 53, 69, 1)",
        borderWidth: 2,
        borderRadius: 6,
      },
      {
        label: "Partial",
        data: currentStats.map((stat) => stat.totalPartial),
        backgroundColor: "rgba(255, 193, 7, 0.8)",
        borderColor: "rgba(255, 193, 7, 1)",
        borderWidth: 2,
        borderRadius: 6,
      },
    ],
  };

  // Doughnut chart data
  const doughnutData = {
    labels: ["Completed", "Missed", "Partial"],
    datasets: [
      {
        data: [
          overallStats.completed,
          overallStats.missed,
          overallStats.partial,
        ],
        backgroundColor: [
          "rgba(40, 167, 69, 0.8)",
          "rgba(220, 53, 69, 0.8)",
          "rgba(255, 193, 7, 0.8)",
        ],
        borderColor: [
          "rgba(40, 167, 69, 1)",
          "rgba(220, 53, 69, 1)",
          "rgba(255, 193, 7, 1)",
        ],
        borderWidth: 3,
      },
    ],
  };

  // Line chart data for trend
  const lineData = {
    labels: currentStats.map(formatPeriodLabel),
    datasets: [
      {
        label: "Total Workouts",
        data: currentStats.map(
          (stat) =>
            stat.totalCompleted + stat.totalMissed + stat.totalPartial
        ),
        borderColor: "rgba(0, 123, 255, 1)",
        backgroundColor: "rgba(0, 123, 255, 0.1)",
        fill: true,
        tension: 0.4,
        borderWidth: 3,
        pointRadius: 5,
        pointHoverRadius: 7,
      },
      {
        label: "Completed",
        data: currentStats.map((stat) => stat.totalCompleted),
        borderColor: "rgba(40, 167, 69, 1)",
        backgroundColor: "rgba(40, 167, 69, 0.1)",
        fill: true,
        tension: 0.4,
        borderWidth: 3,
        pointRadius: 5,
        pointHoverRadius: 7,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          padding: 15,
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        padding: 12,
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        titleFont: {
          size: 14,
        },
        bodyFont: {
          size: 13,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
        },
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: {
          padding: 15,
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        padding: 12,
        backgroundColor: "rgba(0, 0, 0, 0.8)",
      },
    },
  };

  if (loading && weeklyStats.length === 0 && monthlyStats.length === 0) {
    return (
      <Container className={styles.container}>
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>Loading dashboard...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container className={styles.container}>
      <Row className={styles.header}>
        <Col>
          <h1 className={styles.title}>My Dashboard</h1>
          <p className={styles.subtitle}>Track your workout progress and performance</p>
        </Col>
      </Row>

      {/* Period Selector */}
      <Row className={styles.periodSelector}>
        <Col>
          <div className={styles.tabs}>
            <button
              className={`${styles.tab} ${period === "week" ? styles.active : ""}`}
              onClick={() => setPeriod("week")}
            >
              Weekly View
            </button>
            <button
              className={`${styles.tab} ${period === "month" ? styles.active : ""}`}
              onClick={() => setPeriod("month")}
            >
              Monthly View
            </button>
          </div>
        </Col>
      </Row>

      {/* Stats Cards */}
      <Row className={styles.statsRow}>
        <Col lg={3} className={styles.statCol}>
          <Card className={`${styles.statCard} ${styles.totalCard}`}>
            <CardBody>
              <div className={styles.statIcon}>📊</div>
              <CardTitle tag="h6" className={styles.statLabel}>
                Total Workouts
              </CardTitle>
              <p className={styles.statNumber}>{overallStats.total}</p>
            </CardBody>
          </Card>
        </Col>

        <Col lg={3} className={styles.statCol}>
          <Card className={`${styles.statCard} ${styles.completedCard}`}>
            <CardBody>
              <div className={styles.statIcon}>✅</div>
              <CardTitle tag="h6" className={styles.statLabel}>
                Completed
              </CardTitle>
              <p className={styles.statNumber}>{overallStats.completed}</p>
            </CardBody>
          </Card>
        </Col>

        <Col lg={3} className={styles.statCol}>
          <Card className={`${styles.statCard} ${styles.missedCard}`}>
            <CardBody>
              <div className={styles.statIcon}>❌</div>
              <CardTitle tag="h6" className={styles.statLabel}>
                Missed
              </CardTitle>
              <p className={styles.statNumber}>{overallStats.missed}</p>
            </CardBody>
          </Card>
        </Col>

        <Col lg={3} className={styles.statCol}>
          <Card className={`${styles.statCard} ${styles.rateCard}`}>
            <CardBody>
              <div className={styles.statIcon}>🎯</div>
              <CardTitle tag="h6" className={styles.statLabel}>
                Completion Rate
              </CardTitle>
              <p className={styles.statNumber}>{overallStats.completionRate}%</p>
              <div className={styles.progressBar}>
                <div
                  className={styles.progressFill}
                  style={{ width: `${overallStats.completionRate}%` }}
                ></div>
              </div>
            </CardBody>
          </Card>
        </Col>
      </Row>

      {/* Charts Row */}
      <Row className={styles.chartsRow}>
        <Col lg={8} className={styles.chartCol}>
          <Card className={styles.chartCard}>
            <CardBody>
              <CardTitle tag="h5" className={styles.chartTitle}>
                Workouts by {period === "week" ? "Week" : "Month"}
              </CardTitle>
              {currentStats.length > 0 ? (
                <div className={styles.chartWrapper}>
                  <Bar data={barData} options={chartOptions} />
                </div>
              ) : (
                <div className={styles.noData}>No data available for this period</div>
              )}
            </CardBody>
          </Card>
        </Col>

        <Col lg={4} className={styles.chartCol}>
          <Card className={styles.chartCard}>
            <CardBody>
              <CardTitle tag="h5" className={styles.chartTitle}>
                Overall Summary
              </CardTitle>
              {overallStats.total > 0 ? (
                <>
                  <div className={styles.chartWrapper}>
                    <Doughnut data={doughnutData} options={doughnutOptions} />
                  </div>
                  <div className={styles.summaryStats}>
                    <div className={styles.summaryItem}>
                      <span className={styles.summaryLabel}>Total:</span>
                      <span className={styles.summaryValue}>{overallStats.total}</span>
                    </div>
                    <div className={styles.summaryItem}>
                      <span className={styles.summaryLabel}>Completed:</span>
                      <span className={`${styles.summaryValue} ${styles.completed}`}>
                        {overallStats.completed}
                      </span>
                    </div>
                    <div className={styles.summaryItem}>
                      <span className={styles.summaryLabel}>Missed:</span>
                      <span className={`${styles.summaryValue} ${styles.missed}`}>
                        {overallStats.missed}
                      </span>
                    </div>
                    <div className={styles.summaryItem}>
                      <span className={styles.summaryLabel}>Partial:</span>
                      <span className={`${styles.summaryValue} ${styles.partial}`}>
                        {overallStats.partial}
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <div className={styles.noData}>No data available</div>
              )}
            </CardBody>
          </Card>
        </Col>
      </Row>

      {/* Trend Chart */}
      <Row className={styles.chartsRow}>
        <Col>
          <Card className={styles.chartCard}>
            <CardBody>
              <CardTitle tag="h5" className={styles.chartTitle}>
                Progress Trend
              </CardTitle>
              {currentStats.length > 0 ? (
                <div className={styles.chartWrapper}>
                  <Line data={lineData} options={chartOptions} />
                </div>
              ) : (
                <div className={styles.noData}>No trend data available</div>
              )}
            </CardBody>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default ClientDashboard;

