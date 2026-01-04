import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, CardBody, CardTitle, Button, Form, FormGroup, Label, Input, Alert, Spinner } from 'reactstrap';
import { toast } from 'react-toastify';
import apiClient from '../../lib/axios';
import ExerciseForm, { Exercise } from '../../components/ExerciseForm';
import styles from './styles.module.scss';

interface Client {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
  };
}

interface Workout {
  date: string; // Data do treino
  exercises: Exercise[];
}

interface Plan {
  _id?: string;
  name: string;
  description?: string;
  frequencyPerWeek: 3 | 4 | 5;
  startDate: string;
  clientId: string;
  trainerId?: string;
  workouts: Workout[]; // Lista de treinos (um por data)
}

const TrainerPlanDetail: React.FC = () => {
  const { planId } = useParams<{ planId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [plan, setPlan] = useState<Plan>({
    name: '',
    description: '',
    frequencyPerWeek: 3,
    startDate: new Date().toISOString().split('T')[0],
    clientId: '',
    workouts: [],
  });
  const [errors, setErrors] = useState<string[]>([]);
  const [occupiedDates, setOccupiedDates] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchClients();
    if (planId) {
      fetchPlan();
    }
  }, [planId]);

  // Fetch occupied dates when client is selected
  useEffect(() => {
    if (plan.clientId) {
      fetchOccupiedDates(plan.clientId);
    } else {
      setOccupiedDates(new Set());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan.clientId, planId]);

  const fetchClients = async () => {
    try {
      const response = await apiClient.get('/clients');
      const clientsList = response.data.success && response.data.data 
        ? response.data.data 
        : [];
      setClients(clientsList);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const fetchOccupiedDates = async (clientId: string) => {
    try {
      const response = await apiClient.get('/plans', {
        params: { clientId, isActive: true, limit: 100 },
      });
      const plansList = response.data.success && response.data.data 
        ? response.data.data 
        : [];
      
      const dates = new Set<string>();
      plansList.forEach((existingPlan: any) => {
        // Exclude current plan if editing
        if (planId && existingPlan._id === planId) {
          return;
        }
        
        // Add all workout dates from this plan
        if (existingPlan.workoutDates && Array.isArray(existingPlan.workoutDates)) {
          existingPlan.workoutDates.forEach((date: string | Date) => {
            const dateStr = new Date(date).toISOString().split('T')[0];
            dates.add(dateStr);
          });
        }
      });
      
      setOccupiedDates(dates);
    } catch (error) {
      console.error('Error fetching occupied dates:', error);
    }
  };

  const fetchPlan = async () => {
    if (!planId) return;
    setLoading(true);
    try {
      const response = await apiClient.get(`/plans/${planId}`);
      const planData = response.data.success ? response.data.data : response.data;
      
      // Converter sessions do backend para workouts simplificados
      const workouts: Workout[] = [];
      if (planData.workoutDates && planData.workoutDates.length > 0) {
        planData.workoutDates.forEach((date: string | Date, index: number) => {
          const dateStr = new Date(date).toISOString().split('T')[0];
          // Encontrar sessões que correspondem a esta data (por ordem/index)
          const sessionForDate = planData.sessions?.find((s: any) => s.order === index);
          workouts.push({
            date: dateStr,
            exercises: sessionForDate?.exercises || [],
          });
        });
      }

      setPlan({
        _id: planData._id,
        name: planData.name || '',
        description: planData.description || '',
        frequencyPerWeek: planData.frequencyPerWeek || 3,
        startDate: planData.startDate ? new Date(planData.startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        clientId: planData.clientId?._id || planData.clientId || '',
        trainerId: planData.trainerId?._id || planData.trainerId,
        workouts: workouts,
      });
    } catch (error: any) {
      console.error('Error fetching plan:', error);
      toast.error('Erro ao carregar plano. Redirecionando...', {
        position: 'top-right',
        autoClose: 3000,
      });
      navigate('/trainer/plans');
    } finally {
      setLoading(false);
    }
  };

  const handlePlanChange = (field: keyof Plan, value: any) => {
    setPlan((prev) => {
      if (field === 'frequencyPerWeek') {
        const newFrequency = value as 3 | 4 | 5;
        // Ajustar workouts baseado na nova frequência
        const currentWorkouts = prev.workouts || [];
        const newWorkouts = Array(newFrequency).fill(null).map((_, index) => 
          currentWorkouts[index] || { date: '', exercises: [] }
        );
        return {
          ...prev,
          [field]: value,
          workouts: newWorkouts,
        };
      }
      return {
        ...prev,
        [field]: value,
      };
    });
  };

  const handleWorkoutDateChange = (index: number, value: string) => {
    // Check if date is already occupied
    if (value && occupiedDates.has(value)) {
      const dateObj = new Date(value);
      const formattedDate = dateObj.toLocaleDateString('pt-PT');
      toast.warning(`Esta data (${formattedDate}) já está ocupada por outro treino para este cliente. Por favor, escolha outra data.`, {
        position: 'top-right',
        autoClose: 5000,
      });
      return;
    }

    setPlan((prev) => {
      const newWorkouts = [...prev.workouts];
      if (!newWorkouts[index]) {
        newWorkouts[index] = { date: '', exercises: [] };
      }
      newWorkouts[index] = {
        ...newWorkouts[index],
        date: value,
      };
      return {
        ...prev,
        workouts: newWorkouts,
      };
    });
  };

  const handleAddExercise = (workoutIndex: number) => {
    setPlan((prev) => {
      const newWorkouts = [...prev.workouts];
      if (!newWorkouts[workoutIndex]) {
        newWorkouts[workoutIndex] = { date: '', exercises: [] };
      }
      const newExercise: Exercise = {
        name: '',
        sets: 0,
        reps: 0,
        restSeconds: undefined,
        instructions: '',
        videoUrl: '',
      };
      newWorkouts[workoutIndex] = {
        ...newWorkouts[workoutIndex],
        exercises: [...newWorkouts[workoutIndex].exercises, newExercise],
      };
      return {
        ...prev,
        workouts: newWorkouts,
      };
    });
  };

  const handleExerciseChange = (workoutIndex: number, exerciseIndex: number, updatedExercise: Exercise) => {
    setPlan((prev) => {
      const newWorkouts = [...prev.workouts];
      const newExercises = [...newWorkouts[workoutIndex].exercises];
      newExercises[exerciseIndex] = updatedExercise;
      newWorkouts[workoutIndex] = {
        ...newWorkouts[workoutIndex],
        exercises: newExercises,
      };
      return {
        ...prev,
        workouts: newWorkouts,
      };
    });
  };

  const handleRemoveExercise = (workoutIndex: number, exerciseIndex: number) => {
    setPlan((prev) => {
      const newWorkouts = [...prev.workouts];
      newWorkouts[workoutIndex] = {
        ...newWorkouts[workoutIndex],
        exercises: newWorkouts[workoutIndex].exercises.filter((_, i) => i !== exerciseIndex),
      };
      return {
        ...prev,
        workouts: newWorkouts,
      };
    });
  };

  const validatePlan = (): boolean => {
    const newErrors: string[] = [];

    if (!plan.name.trim()) {
      newErrors.push('Plan name is required.');
    }

    if (!plan.clientId) {
      newErrors.push('Select a client.');
    }

    if (!plan.startDate) {
      newErrors.push('Start date is required.');
    }

    // Validar workouts
    if (plan.workouts.length !== plan.frequencyPerWeek) {
      newErrors.push(`You must select ${plan.frequencyPerWeek} dates for the workouts.`);
    }

    plan.workouts.forEach((workout, workoutIndex) => {
      if (!workout.date) {
        newErrors.push(`Workout ${workoutIndex + 1} date is required.`);
      } else {
        const workoutDate = new Date(workout.date);
        const startDate = new Date(plan.startDate);
        if (workoutDate < startDate) {
          newErrors.push(`Workout ${workoutIndex + 1} date cannot be before the start date.`);
        }
        
        // Check if date is already occupied
        const dateStr = workout.date;
        if (occupiedDates.has(dateStr)) {
          const formattedDate = workoutDate.toLocaleDateString('pt-PT');
          newErrors.push(`Workout ${workoutIndex + 1} date (${formattedDate}) is already occupied by another workout.`);
        }
      }

      if (workout.exercises.length === 0) {
        newErrors.push(`Workout ${workoutIndex + 1} needs at least one exercise.`);
      }

      workout.exercises.forEach((exercise, exerciseIndex) => {
        if (!exercise.name.trim()) {
          newErrors.push(`Exercise ${exerciseIndex + 1} of workout ${workoutIndex + 1} has no name.`);
        }
        if (!exercise.sets || exercise.sets <= 0) {
          newErrors.push(`Exercise "${exercise.name}" of workout ${workoutIndex + 1} has no valid sets.`);
        }
        if (!exercise.reps || exercise.reps <= 0) {
          newErrors.push(`Exercise "${exercise.name}" of workout ${workoutIndex + 1} has no valid reps.`);
        }
      });
    });

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  // Limpar campos vazios do exercício
  const cleanExercise = (exercise: Exercise): Exercise => {
    return {
      name: exercise.name,
      sets: exercise.sets,
      reps: exercise.reps,
      restSeconds: exercise.restSeconds || undefined,
      instructions: exercise.instructions?.trim() || undefined,
      videoUrl: exercise.videoUrl?.trim() || undefined,
    };
  };

  // Converter workouts simplificados para sessions do backend
  const convertWorkoutsToSessions = () => {
    return plan.workouts.map((workout, index) => {
      const date = new Date(workout.date + 'T00:00:00');
      const day = date.getDay();
      const weekdays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const weekday = weekdays[day];

      return {
        week: 1,
        weekday,
        order: index,
        exercises: workout.exercises.map(cleanExercise),
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validatePlan()) {
      return;
    }

    setSubmitting(true);

    try {
      const workoutDates = plan.workouts.map(w => new Date(w.date + 'T00:00:00').toISOString());
      const sessions = convertWorkoutsToSessions();

      const planData = {
        name: plan.name,
        description: plan.description,
        frequencyPerWeek: plan.frequencyPerWeek,
        startDate: plan.startDate,
        clientId: plan.clientId,
        workoutDates,
        sessions,
      };

      let response;
      if (planId) {
        console.log('Updating plan:', JSON.stringify(planData, null, 2));
        response = await apiClient.put(`/plans/${planId}`, planData);
        console.log('Update response status:', response.status);
        console.log('Update response data:', response.data);
      } else {
        console.log('Creating plan:', JSON.stringify(planData, null, 2));
        response = await apiClient.post('/plans', planData);
        console.log('Create response status:', response.status);
        console.log('Create response data:', response.data);
      }

      // Check if request was successful
      const isSuccess = (response.status >= 200 && response.status < 300) || response.data?.success === true;
      
      if (isSuccess) {
        console.log('Plan saved successfully, navigating...');
        toast.success(planId ? 'Plano atualizado com sucesso!' : 'Plano criado com sucesso!', {
          position: 'top-right',
          autoClose: 2000,
        });
        // Reset submitting state before navigation
        setSubmitting(false);
        // Small delay to ensure state is reset before navigation and toast is shown
        setTimeout(() => {
          navigate('/trainer/plans');
        }, 100);
      } else {
        console.error('Unexpected response:', response);
        setSubmitting(false);
        throw new Error(response.data?.meta?.error || response.data?.error || 'Unexpected response from server');
      }
    } catch (error: any) {
      console.error('Error saving plan:', error);
      console.error('Error response:', error.response);
      console.error('Error response data:', error.response?.data);
      
      const errorMessage = 
        error.response?.data?.meta?.error ||
        error.response?.data?.meta?.errors?.message ||
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.message ||
        'Erro ao salvar plano. Por favor, tente novamente.';
      
      toast.error(errorMessage, {
        position: 'top-right',
        autoClose: 5000,
      });
      setSubmitting(false);
    }
  };

  // Inicializar workouts quando a frequência muda
  useEffect(() => {
    if (plan.workouts.length !== plan.frequencyPerWeek) {
      const newWorkouts = Array(plan.frequencyPerWeek).fill(null).map((_, index) => 
        plan.workouts[index] || { date: '', exercises: [] }
      );
      setPlan(prev => ({ ...prev, workouts: newWorkouts }));
    }
  }, [plan.frequencyPerWeek]);

  if (loading) {
    return (
      <Container className={styles.container}>
        <Spinner>Loading...</Spinner>
      </Container>
    );
  }

  return (
    <Container className={styles.container}>
      <Row>
        <Col>
          <Button color="secondary" onClick={() => navigate('/trainer/plans')} className="mb-3">
            ← Back
          </Button>
          <h2>{planId ? 'Edit Workout Plan' : 'Create New Workout Plan'}</h2>
        </Col>
      </Row>

      {errors.length > 0 && (
        <Alert color="danger" className="mt-3" fade={false}>
          <strong>Errors found:</strong>
          <ul className="mb-0">
            {errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </Alert>
      )}

      <Form onSubmit={handleSubmit}>
        {/* Basic Information */}
        <Card className="mb-4">
          <CardBody>
            <CardTitle tag="h4">Basic Information</CardTitle>
            
            <Row>
              <Col md={6}>
                <FormGroup>
                  <Label for="name">Plan Name *</Label>
                  <Input
                    type="text"
                    id="name"
                    value={plan.name}
                    onChange={(e) => handlePlanChange('name', e.target.value)}
                    required
                    placeholder="Ex: Strength Plan - Beginner"
                  />
                </FormGroup>
              </Col>
              <Col md={6}>
                <FormGroup>
                  <Label for="clientId">Client *</Label>
                  <Input
                    type="select"
                    id="clientId"
                    value={plan.clientId}
                    onChange={(e) => handlePlanChange('clientId', e.target.value)}
                    required
                    disabled={!!planId}
                  >
                    <option value="">Select a client</option>
                    {clients.map((client) => (
                      <option key={client._id} value={client._id}>
                        {client.userId?.name || client.userId?.email || 'N/A'}
                      </option>
                    ))}
                  </Input>
                </FormGroup>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <FormGroup>
                  <Label for="frequencyPerWeek">Weekly Frequency *</Label>
                  <Input
                    type="select"
                    id="frequencyPerWeek"
                    value={plan.frequencyPerWeek}
                    onChange={(e) => handlePlanChange('frequencyPerWeek', parseInt(e.target.value) as 3 | 4 | 5)}
                    required
                  >
                    <option value={3}>3x per week</option>
                    <option value={4}>4x per week</option>
                    <option value={5}>5x per week</option>
                  </Input>
                </FormGroup>
              </Col>
              <Col md={6}>
                <FormGroup>
                  <Label for="startDate">Start Date *</Label>
                  <Input
                    type="date"
                    id="startDate"
                    value={plan.startDate}
                    onChange={(e) => handlePlanChange('startDate', e.target.value)}
                    required
                  />
                </FormGroup>
              </Col>
            </Row>

            <FormGroup>
              <Label for="description">Plan Description</Label>
              <Input
                type="textarea"
                id="description"
                value={plan.description || ''}
                onChange={(e) => handlePlanChange('description', e.target.value)}
                rows={3}
                placeholder="Workout plan description..."
              />
            </FormGroup>
          </CardBody>
        </Card>

        {/* Workouts */}
        <Card className="mb-4">
          <CardBody>
            <CardTitle tag="h4">Plan Workouts</CardTitle>
            
            {plan.workouts.map((workout, workoutIndex) => {
              const formattedDate = workout.date 
                ? (() => {
                    const dateStr = new Date(workout.date + 'T00:00:00').toLocaleDateString('pt-PT', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    });
                    // Capitalize first letter
                    return dateStr.charAt(0).toUpperCase() + dateStr.slice(1);
                  })()
                : '';

              return (
                <Card key={workoutIndex} className="mb-4" style={{ border: '1px solid #dee2e6' }}>
                  <CardBody>
                    <Row className="mb-3">
                      <Col md={6}>
                        <FormGroup>
                          <Label for={`workoutDate${workoutIndex}`}>Workout {workoutIndex + 1} Date *</Label>
                          <Input
                            id={`workoutDate${workoutIndex}`}
                            type="date"
                            value={workout.date}
                            onChange={(e) => handleWorkoutDateChange(workoutIndex, e.target.value)}
                            required
                            min={plan.startDate || new Date().toISOString().split('T')[0]}
                            className={workout.date && occupiedDates.has(workout.date) ? 'border-danger' : ''}
                          />
                          {workout.date && occupiedDates.has(workout.date) && (
                            <small className="text-danger d-block mt-1">
                              ⚠️ This date is already occupied by another workout
                            </small>
                          )}
                          {formattedDate && (
                            <small className="text-muted d-block mt-1">{formattedDate}</small>
                          )}
                        </FormGroup>
                      </Col>
                    </Row>

                    <div className="mb-3">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <h5>Workout {workoutIndex + 1} Exercises</h5>
                        <Button
                          color="primary"
                          size="sm"
                          onClick={() => handleAddExercise(workoutIndex)}
                        >
                          + Add Exercise
                        </Button>
                      </div>

                      {workout.exercises.length === 0 ? (
                        <Alert color="info" fade={false}>
                          No exercises added yet. Click "Add Exercise" to get started.
                        </Alert>
                      ) : (
                        workout.exercises.map((exercise, exerciseIndex) => {
                          // Create unique index combining workout and exercise indices
                          const uniqueIndex = workoutIndex * 1000 + exerciseIndex;
                          return (
                            <div key={exerciseIndex} className="mb-3" style={{ border: '1px solid #e9ecef', padding: '1rem', borderRadius: '0.25rem' }}>
                              <ExerciseForm
                                exercise={exercise}
                                onChange={(updatedExercise) => handleExerciseChange(workoutIndex, exerciseIndex, updatedExercise)}
                                onRemove={() => handleRemoveExercise(workoutIndex, exerciseIndex)}
                                index={uniqueIndex}
                                canRemove={true}
                              />
                            </div>
                          );
                        })
                      )}
                    </div>
                  </CardBody>
                </Card>
              );
            })}
          </CardBody>
        </Card>

        <div className={styles.actions}>
          <Button color="secondary" onClick={() => navigate('/trainer/plans')} disabled={submitting}>
            Cancel
          </Button>
          <Button color="primary" type="submit" disabled={submitting}>
            {submitting ? 'Saving...' : planId ? 'Update Plan' : 'Create Plan'}
          </Button>
        </div>
      </Form>
    </Container>
  );
};

export default TrainerPlanDetail;
