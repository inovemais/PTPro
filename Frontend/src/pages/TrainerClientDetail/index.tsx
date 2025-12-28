import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, CardBody, CardTitle, Button, Spinner } from 'reactstrap';
import apiClient from '../../lib/axios';
import styles from './styles.module.scss';

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

interface ComplianceStats {
  total: number;
  completed: number;
  missed: number;
  partial: number;
}

const TrainerClientDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [client, setClient] = useState<Client | null>(null);
  const [stats, setStats] = useState<ComplianceStats>({
    total: 0,
    completed: 0,
    missed: 0,
    partial: 0,
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (id) {
      fetchClient();
      fetchStats();
    }
  }, [id]);

  const fetchClient = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get(`/clients/${id}`);
      if (response.data.success) {
        setClient(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching client:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await apiClient.get('/compliance/stats', {
        params: { clientId: id, period: 'month' },
      });
      if (response.data.success && response.data.data) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  if (loading) {
    return (
      <Container>
        <Spinner>Loading...</Spinner>
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
          <Button color="secondary" onClick={() => navigate('/trainer/clients')} className="mb-3">
            ← Back to Clients
          </Button>
          <h2>Client Details: {client.userId?.name}</h2>
        </Col>
      </Row>

      <Row className="mt-4">
        <Col md={6}>
          <Card>
            <CardBody>
              <CardTitle tag="h4">Personal Information</CardTitle>
              <p><strong>Name:</strong> {client.userId?.name}</p>
              <p><strong>Email:</strong> {client.userId?.email}</p>
              <p><strong>Height:</strong> {client.heightCm ? `${client.heightCm} cm` : 'N/A'}</p>
              <p><strong>Weight:</strong> {client.weightKg ? `${client.weightKg} kg` : 'N/A'}</p>
              <p><strong>Goal:</strong> {client.goal || 'Not specified'}</p>
              {client.notes && <p><strong>Notes:</strong> {client.notes}</p>}
            </CardBody>
          </Card>
        </Col>

        <Col md={6}>
          <Card>
            <CardBody>
              <CardTitle tag="h4">Compliance Statistics</CardTitle>
              <p><strong>Total Workouts:</strong> {stats.total}</p>
              <p><strong>Completed:</strong> {stats.completed}</p>
              <p><strong>Missed:</strong> {stats.missed}</p>
              {stats.total > 0 && (
                <p>
                  <strong>Completion Rate:</strong>{' '}
                  {Math.round((stats.completed / stats.total) * 100)}%
                </p>
              )}
            </CardBody>
          </Card>
        </Col>
      </Row>

      <Row className="mt-4">
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

