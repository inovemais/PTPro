import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Container, Row, Col, Card, CardBody, CardTitle, Button, Form, FormGroup, Label, Input, Spinner } from 'reactstrap';
import apiClient from '../../lib/axios';
import styles from './styles.module.scss';

interface ComplianceFormData {
  workoutPlanId: string;
  date: string;
  status: 'completed' | 'missed' | 'partial';
  reason?: string;
  photo?: FileList;
}

interface Plan {
  _id: string;
  name: string;
  isActive: boolean;
}

const ClientCompliance: React.FC = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, watch, formState: { errors } } = useForm<ComplianceFormData>();

  const status = watch('status');

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/plans', {
        params: { isActive: true, limit: 50 },
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

  const onSubmit = async (data: ComplianceFormData) => {
    const formData = new FormData();
    formData.append('workoutPlanId', data.workoutPlanId);
    formData.append('date', data.date);
    formData.append('status', data.status);
    if (data.reason) {
      formData.append('reason', data.reason);
    }
    if (data.photo && data.photo[0]) {
      formData.append('photo', data.photo[0]);
    }

    try {
      await apiClient.post('/compliance', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      alert('Workout logged successfully!');
    } catch (error) {
      console.error('Error logging workout:', error);
      alert('Failed to log workout');
    }
  };

  return (
    <Container className={styles.container}>
      <Row>
        <Col>
          <h2>Log Workout</h2>
        </Col>
      </Row>

      <Row className="mt-4">
        <Col md={8}>
          <Card>
            <CardBody>
              <CardTitle tag="h4">Workout Compliance</CardTitle>
              <Form onSubmit={handleSubmit(onSubmit)}>
                <FormGroup>
                  <Label for="workoutPlanId">Training Plan</Label>
                  <Input
                    id="workoutPlanId"
                    type="select"
                    {...register('workoutPlanId', { required: 'Plan is required' })}
                    invalid={!!errors.workoutPlanId}
                  >
                    <option value="">Select a plan</option>
                    {plans.map((plan) => (
                      <option key={plan._id} value={plan._id}>
                        {plan.name}
                      </option>
                    ))}
                  </Input>
                  {errors.workoutPlanId && (
                    <div className="text-danger small">{errors.workoutPlanId.message}</div>
                  )}
                </FormGroup>

                <FormGroup>
                  <Label for="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    {...register('date', { required: 'Date is required' })}
                    invalid={!!errors.date}
                  />
                  {errors.date && (
                    <div className="text-danger small">{errors.date.message}</div>
                  )}
                </FormGroup>

                <FormGroup>
                  <Label for="status">Status</Label>
                  <Input
                    id="status"
                    type="select"
                    {...register('status', { required: 'Status is required' })}
                    invalid={!!errors.status}
                  >
                    <option value="">Select status</option>
                    <option value="completed">Completed</option>
                    <option value="missed">Missed</option>
                    <option value="partial">Partial</option>
                  </Input>
                  {errors.status && (
                    <div className="text-danger small">{errors.status.message}</div>
                  )}
                </FormGroup>

                {status === 'missed' && (
                  <FormGroup>
                    <Label for="reason">Reason (Required for missed workouts)</Label>
                    <Input
                      id="reason"
                      type="textarea"
                      {...register('reason', {
                        required: status === 'missed' ? 'Reason is required for missed workouts' : false,
                      })}
                      invalid={!!errors.reason}
                    />
                    {errors.reason && (
                      <div className="text-danger small">{errors.reason.message}</div>
                    )}
                  </FormGroup>
                )}

                <FormGroup>
                  <Label for="photo">Photo (Optional)</Label>
                  <Input
                    id="photo"
                    type="file"
                    accept="image/*"
                    {...register('photo')}
                  />
                </FormGroup>

                <Button color="primary" type="submit" disabled={loading}>
                  {loading ? 'Submitting...' : 'Log Workout'}
                </Button>
              </Form>
            </CardBody>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default ClientCompliance;

