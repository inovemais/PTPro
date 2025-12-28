import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, CardBody, CardTitle } from 'reactstrap';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import apiClient from '../../lib/axios';
import styles from './styles.module.scss';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface ComplianceStats {
  period: string;
  completed: number;
  missed: number;
  partial: number;
  total: number;
}

const ClientDashboard: React.FC = () => {
  const [weeklyStats, setWeeklyStats] = useState<ComplianceStats[]>([]);
  const [monthlyStats, setMonthlyStats] = useState<ComplianceStats[]>([]);
  const [loading, setLoading] = useState(false);
  const [period, setPeriod] = useState<'week' | 'month'>('week');

  useEffect(() => {
    fetchStats('week');
    fetchStats('month');
  }, []);

  const fetchStats = async (periodType: 'week' | 'month') => {
    setLoading(true);
    try {
      const response = await apiClient.get('/compliance/stats', {
        params: { period: periodType },
      });
      if (response.data.success) {
        const stats = response.data.data || [];
        if (periodType === 'week') {
          setWeeklyStats(stats);
        } else {
          setMonthlyStats(stats);
        }
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const currentStats = period === 'week' ? weeklyStats : monthlyStats;

  const barData = {
    labels: currentStats.map((stat) => stat.period),
    datasets: [
      {
        label: 'Completed',
        data: currentStats.map((stat) => stat.completed),
        backgroundColor: 'rgba(40, 167, 69, 0.6)',
        borderColor: 'rgba(40, 167, 69, 1)',
        borderWidth: 1,
      },
      {
        label: 'Missed',
        data: currentStats.map((stat) => stat.missed),
        backgroundColor: 'rgba(220, 53, 69, 0.6)',
        borderColor: 'rgba(220, 53, 69, 1)',
        borderWidth: 1,
      },
      {
        label: 'Partial',
        data: currentStats.map((stat) => stat.partial),
        backgroundColor: 'rgba(255, 193, 7, 0.6)',
        borderColor: 'rgba(255, 193, 7, 1)',
        borderWidth: 1,
      },
    ],
  };

  const totalCompleted = currentStats.reduce((sum, stat) => sum + stat.completed, 0);
  const totalMissed = currentStats.reduce((sum, stat) => sum + stat.missed, 0);
  const totalPartial = currentStats.reduce((sum, stat) => sum + stat.partial, 0);
  const total = totalCompleted + totalMissed + totalPartial;

  const doughnutData = {
    labels: ['Completed', 'Missed', 'Partial'],
    datasets: [
      {
        data: [totalCompleted, totalMissed, totalPartial],
        backgroundColor: [
          'rgba(40, 167, 69, 0.6)',
          'rgba(220, 53, 69, 0.6)',
          'rgba(255, 193, 7, 0.6)',
        ],
        borderColor: [
          'rgba(40, 167, 69, 1)',
          'rgba(220, 53, 69, 1)',
          'rgba(255, 193, 7, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  return (
    <Container className={styles.container}>
      <Row>
        <Col>
          <h2>Dashboard</h2>
          <div className="mb-3">
            <button
              className={`btn ${period === 'week' ? 'btn-primary' : 'btn-outline-primary'} me-2`}
              onClick={() => setPeriod('week')}
            >
              Weekly
            </button>
            <button
              className={`btn ${period === 'month' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => setPeriod('month')}
            >
              Monthly
            </button>
          </div>
        </Col>
      </Row>

      <Row className="mt-4">
        <Col md={8}>
          <Card>
            <CardBody>
              <CardTitle tag="h4">
                Workouts by {period === 'week' ? 'Week' : 'Month'}
              </CardTitle>
              {loading ? (
                <div>Loading...</div>
              ) : currentStats.length === 0 ? (
                <p>No data available</p>
              ) : (
                <Bar
                  data={barData}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: {
                        position: 'top',
                      },
                      title: {
                        display: true,
                        text: `Workout Compliance - ${period === 'week' ? 'Weekly' : 'Monthly'} View`,
                      },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                      },
                    },
                  }}
                />
              )}
            </CardBody>
          </Card>
        </Col>

        <Col md={4}>
          <Card>
            <CardBody>
              <CardTitle tag="h4">Overall Summary</CardTitle>
              {loading ? (
                <div>Loading...</div>
              ) : total === 0 ? (
                <p>No data available</p>
              ) : (
                <>
                  <Doughnut
                    data={doughnutData}
                    options={{
                      responsive: true,
                      plugins: {
                        legend: {
                          position: 'bottom',
                        },
                      },
                    }}
                  />
                  <div className="mt-3">
                    <p><strong>Total:</strong> {total}</p>
                    <p><strong>Completed:</strong> {totalCompleted}</p>
                    <p><strong>Missed:</strong> {totalMissed}</p>
                    <p><strong>Partial:</strong> {totalPartial}</p>
                    {total > 0 && (
                      <p>
                        <strong>Completion Rate:</strong>{' '}
                        {Math.round((totalCompleted / total) * 100)}%
                      </p>
                    )}
                  </div>
                </>
              )}
            </CardBody>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default ClientDashboard;

