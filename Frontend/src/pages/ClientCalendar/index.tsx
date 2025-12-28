import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, CardBody, CardTitle, Button, Badge } from 'reactstrap';
import apiClient from '../../lib/axios';
import styles from './styles.module.scss';

interface WorkoutLog {
  _id: string;
  date: string;
  status: 'completed' | 'missed' | 'partial';
  reason?: string;
  photo?: string;
}

const ClientCalendar: React.FC = () => {
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/compliance', {
        params: { limit: 100 },
      });
      if (response.data.success) {
        setLogs(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge color="success">Completed</Badge>;
      case 'missed':
        return <Badge color="danger">Missed</Badge>;
      case 'partial':
        return <Badge color="warning">Partial</Badge>;
      default:
        return null;
    }
  };

  const logsByDate = logs.reduce((acc, log) => {
    const date = new Date(log.date).toISOString().split('T')[0];
    if (!acc[date]) acc[date] = [];
    acc[date].push(log);
    return acc;
  }, {} as Record<string, WorkoutLog[]>);

  return (
    <Container className={styles.container}>
      <Row>
        <Col>
          <h2>Workout Calendar</h2>
        </Col>
      </Row>

      <Row className="mt-4">
        <Col>
          <Card>
            <CardBody>
              <CardTitle tag="h4">Recent Workouts</CardTitle>
              {logs.length === 0 ? (
                <p>No workouts logged yet.</p>
              ) : (
                <div className={styles.logsList}>
                  {logs.slice(0, 10).map((log) => (
                    <div key={log._id} className={styles.logItem}>
                      <div>
                        <strong>{new Date(log.date).toLocaleDateString()}</strong>
                        {getStatusBadge(log.status)}
                      </div>
                      {log.reason && <p className="text-muted small">{log.reason}</p>}
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default ClientCalendar;

