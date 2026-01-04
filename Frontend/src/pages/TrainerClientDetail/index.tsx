import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, CardBody, CardTitle, Button, Spinner, Badge, Alert, Table } from 'reactstrap';
import { toast } from 'react-toastify';
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

interface WorkoutLog {
  _id: string;
  date: string;
  status: string;
  reason?: string;
  workoutPlanId?: {
    _id: string;
    name: string;
  };
  photo?: string;
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
  const [missedWorkouts, setMissedWorkouts] = useState<WorkoutLog[]>([]);
  const [allWorkoutLogs, setAllWorkoutLogs] = useState<WorkoutLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingLogs, setLoadingLogs] = useState(false);

  useEffect(() => {
    if (id) {
      fetchClient();
      fetchStats();
      fetchMissedWorkouts();
      fetchAllWorkoutLogs();
    }
  }, [id]);

  const fetchClient = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get(`/clients/${id}`);
      if (response.data.success) {
        setClient(response.data.data);
      }
    } catch (error: any) {
      console.error('Error fetching client:', error);
      toast.error('Erro ao carregar dados do cliente', {
        position: 'top-right',
        autoClose: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      // Calculate stats from all workout logs instead of using stats API
      // This ensures accuracy and we're already fetching all logs anyway
      const response = await apiClient.get('/workout-logs', {
        params: { clientId: id, limit: 200 },
      });
      if (response.data.success && response.data.data) {
        const logs = response.data.data || [];
        const calculatedStats = logs.reduce(
          (acc: ComplianceStats, log: WorkoutLog) => {
            acc.total++;
            if (log.status === 'completed') acc.completed++;
            else if (log.status === 'missed') acc.missed++;
            else if (log.status === 'partial') acc.partial++;
            return acc;
          },
          { total: 0, completed: 0, missed: 0, partial: 0 }
        );
        setStats(calculatedStats);
      }
    } catch (error: any) {
      console.error('Error fetching stats:', error);
      toast.error('Erro ao carregar estatísticas', {
        position: 'top-right',
        autoClose: 3000,
      });
    }
  };

  const fetchMissedWorkouts = async () => {
    try {
      const response = await apiClient.get('/workout-logs', {
        params: { clientId: id, limit: 100 },
      });
      if (response.data.success && response.data.data) {
        // Filter only missed workouts
        const missed = response.data.data.filter((log: WorkoutLog) => log.status === 'missed');
        setMissedWorkouts(missed);
      }
    } catch (error: any) {
      console.error('Error fetching missed workouts:', error);
      toast.error('Erro ao carregar treinos perdidos', {
        position: 'top-right',
        autoClose: 3000,
      });
    }
  };

  const fetchAllWorkoutLogs = async () => {
    setLoadingLogs(true);
    try {
      const response = await apiClient.get('/workout-logs', {
        params: { clientId: id, limit: 200 },
      });
      if (response.data.success && response.data.data) {
        // Sort by date descending (most recent first)
        const sortedLogs = [...response.data.data].sort((a: WorkoutLog, b: WorkoutLog) => {
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        });
        setAllWorkoutLogs(sortedLogs);
      }
    } catch (error: any) {
      console.error('Error fetching workout logs:', error);
      toast.error('Erro ao carregar histórico de treinos', {
        position: 'top-right',
        autoClose: 3000,
      });
    } finally {
      setLoadingLogs(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge color="success">Completo</Badge>;
      case 'missed':
        return <Badge color="danger">Perdido</Badge>;
      case 'partial':
        return <Badge color="warning">Parcial</Badge>;
      default:
        return <Badge>{status}</Badge>;
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
            onClick={() => navigate(`/trainer/plans/new`)}
            className="me-2"
          >
            New Training Plans
          </Button>
          <Button
            color="info"
            onClick={() => {
              if (client?.userId?._id) {
                navigate(`/chat?userId=${client.userId._id}`);
              } else {
                navigate(`/chat`);
              }
            }}
            className="me-2"
          >
            Abrir Chat
          </Button>

        </Col>
      </Row>

      {stats.missed > 0 && (
        <Row className="mt-4">
          <Col>
            <Card>
              <CardBody>
                <CardTitle tag="h4">Treinos Perdidos</CardTitle>
                {missedWorkouts.length === 0 ? (
                  <p>Nenhum treino perdido encontrado.</p>
                ) : (
                  <>
                    <Alert color="warning" className="mb-3" fade={false}>
                      Este cliente tem {stats.missed} treino(s) perdido(s).
                      Você pode enviar um alerta para discutir a situação.
                    </Alert>

                    <div className="table-responsive">
                      <table className="table table-sm">
                        <thead>
                          <tr>
                            <th>Data</th>
                            <th>Motivo</th>
                            <th>Ações</th>
                          </tr>
                        </thead>
                        <tbody>
                          {missedWorkouts.map((workout) => (
                            <tr key={workout._id}>
                              <td>{new Date(workout.date).toLocaleDateString('pt-PT')}</td>
                              <td>{workout.reason || 'Sem motivo especificado'}</td>
                              <td>
                                <Button
                                  color="warning"
                                  onClick={() => {
                                    if (client?.userId?._id) {
                                      navigate(`/chat?userId=${client.userId._id}`);
                                    } else {
                                      navigate(`/chat`);
                                    }
                                  }}
                                  className="me-2"
                                >
                                  Send Message
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </CardBody>
            </Card>
          </Col>
        </Row>
      )}

      <Row className="mt-4">
        <Col>
          <Card>
            <CardBody>
              <CardTitle tag="h4">Histórico de Treinos</CardTitle>
              {loadingLogs ? (
                <div className="text-center">
                  <Spinner>Carregando...</Spinner>
                </div>
              ) : allWorkoutLogs.length === 0 ? (
                <p className="text-muted">Nenhum treino registrado ainda.</p>
              ) : (
                <div className="table-responsive">
                  <Table striped hover responsive>
                    <thead>
                      <tr>
                        <th>Data</th>
                        <th>Plano de Treino</th>
                        <th>Status</th>
                        <th>Motivo</th>
                        <th>Foto</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allWorkoutLogs.map((log) => (
                        <tr key={log._id}>
                          <td>
                            {new Date(log.date).toLocaleDateString('pt-PT', {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                            })}
                          </td>
                          <td>
                            {log.workoutPlanId?.name || 'N/A'}
                          </td>
                          <td>{getStatusBadge(log.status)}</td>
                          <td>{log.reason || '-'}</td>
                          <td>
                            {log.photo ? (
                              <a
                                href={log.photo.startsWith('http') ? log.photo : log.photo.startsWith('/') ? log.photo : `/${log.photo}`}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <Button size="sm" color="link">
                                  Ver Foto
                                </Button>
                              </a>
                            ) : (
                              '-'
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}
            </CardBody>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default TrainerClientDetail;

