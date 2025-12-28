import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Container, Row, Col, Card, CardBody, CardTitle, Button, Form, FormGroup, Label, Input, Spinner } from 'reactstrap';
import apiClient from '../../lib/axios';
import styles from './styles.module.scss';

interface Plan {
  _id: string;
  name: string;
  description?: string;
  frequencyPerWeek: number;
  startDate: string;
  isActive: boolean;
  sessions?: any[];
}

interface PlanFormData {
  name: string;
  description: string;
  frequencyPerWeek: 3 | 4 | 5;
  startDate: string;
}

const TrainerPlans: React.FC = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<PlanFormData>();

  useEffect(() => {
    if (clientId) {
      fetchPlans();
    }
  }, [clientId]);

  const fetchPlans = async () => {
    if (!clientId) return;
    setLoading(true);
    try {
      const response = await apiClient.get('/plans', {
        params: { clientId, limit: 50 },
      });
      if (response.data.success) {
        setPlans(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: PlanFormData) => {
    if (!clientId) return;

    try {
      await apiClient.post('/plans', {
        ...data,
        clientId,
        // trainerId will be set by backend based on auth
      });
      reset();
      fetchPlans();
    } catch (error) {
      console.error('Error creating plan:', error);
    }
  };

  return (
    <Container className={styles.container}>
      <Row>
        <Col>
          <Button color="secondary" onClick={() => navigate(-1)} className="mb-3">
            ← Back
          </Button>
          <h2>Training Plans for Client</h2>
        </Col>
      </Row>

      <Row className="mt-4">
        <Col md={6}>
          <Card>
            <CardBody>
              <CardTitle tag="h4">Create New Plan</CardTitle>
              <Form onSubmit={handleSubmit(onSubmit)}>
                <FormGroup>
                  <Label for="name">Name</Label>
                  <Input
                    id="name"
                    {...register('name', { required: 'Name is required' })}
                    invalid={!!errors.name}
                  />
                  {errors.name && <div className="text-danger small">{errors.name.message}</div>}
                </FormGroup>

                <FormGroup>
                  <Label for="description">Description</Label>
                  <Input
                    id="description"
                    type="textarea"
                    {...register('description')}
                  />
                </FormGroup>

                <FormGroup>
                  <Label for="frequencyPerWeek">Frequency per Week</Label>
                  <Input
                    id="frequencyPerWeek"
                    type="select"
                    {...register('frequencyPerWeek', { required: true })}
                  >
                    <option value={3}>3x per week</option>
                    <option value={4}>4x per week</option>
                    <option value={5}>5x per week</option>
                  </Input>
                </FormGroup>

                <FormGroup>
                  <Label for="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    {...register('startDate')}
                  />
                </FormGroup>

                <Button color="primary" type="submit">
                  Create Plan
                </Button>
              </Form>
            </CardBody>
          </Card>
        </Col>

        <Col md={6}>
          <Card>
            <CardBody>
              <CardTitle tag="h4">Existing Plans</CardTitle>
              {loading ? (
                <Spinner>Loading...</Spinner>
              ) : plans.length === 0 ? (
                <p>No plans created yet.</p>
              ) : (
                <ul>
                  {plans.map((plan) => (
                    <li key={plan._id}>
                      <strong>{plan.name}</strong>
                      {plan.description && ` – ${plan.description}`}
                      <br />
                      <small>
                        Frequency: {plan.frequencyPerWeek}x/week | Status:{' '}
                        {plan.isActive ? 'Active' : 'Inactive'}
                      </small>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default TrainerPlans;

