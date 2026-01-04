import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, CardBody, Button, Badge, Modal, ModalHeader, ModalBody, ModalFooter, Form, FormGroup, Label, Input, Alert, Spinner } from 'reactstrap';
import { useAuth } from '../../context/AuthContext';
import scopes from '../../data/users/scopes';
import apiClient from '../../lib/axios';
import styles from './styles.module.scss';

interface WorkoutLog {
  _id: string;
  date: string;
  status: 'completed' | 'missed' | 'partial';
  reason?: string;
  photo?: string;
  workoutPlanId?: {
    _id: string;
    name: string;
  };
}

interface Exercise {
  name: string;
  sets: number;
  reps: number;
  restSeconds?: number;
  instructions?: string;
  videoUrl?: string;
}

interface Plan {
  _id: string;
  name: string;
  description?: string;
  workoutDates?: string[] | Date[];
  sessions?: Array<{
    week?: number;
    weekday: string;
    order?: number;
    exercises: Exercise[];
  }>;
}

const ClientCalendar: React.FC = () => {
  const { scopes: userScopes } = useAuth();
  const [logs, setLogs] = useState<WorkoutLog[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [logStatus, setLogStatus] = useState<'completed' | 'missed' | 'partial'>('completed');
  const [logReason, setLogReason] = useState('');
  const [logPhoto, setLogPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState<{ show: boolean; message: string; color: string }>({ show: false, message: '', color: 'success' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Only fetch client data if user has Client scope
      const isClient = userScopes?.includes(scopes.Client);
      
      if (!isClient) {
        setLogs([]);
        setPlans([]);
        setLoading(false);
        return;
      }

      // Fetch client data first
      const clientResponse = await apiClient.get('/clients/me');
      const clientData = clientResponse.data.success ? clientResponse.data.data : clientResponse.data;
      
      if (clientData?._id) {
        // Fetch workout logs filtered by clientId
        const logsResponse = await apiClient.get('/workout-logs', {
          params: { clientId: clientData._id, limit: 200 },
        });
        if (logsResponse.data.success) {
          setLogs(logsResponse.data.data || []);
        }

        // Fetch client plans
        const plansResponse = await apiClient.get('/plans', {
          params: { clientId: clientData._id, isActive: true, limit: 20 },
        });
        const plansData = plansResponse.data.success ? plansResponse.data.data : (plansResponse.data.plans || []);
        // Filter out plans without workoutDates
        const validPlans = plansData.filter((plan: Plan) => plan.workoutDates && plan.workoutDates.length > 0);
        setPlans(validPlans);
      } else {
        setLogs([]);
        setPlans([]);
      }
    } catch (error: any) {
      console.error('Error fetching data:', error);
      // Only show error if it's not a 403 (Forbidden) - which is expected for non-client users
      if (error.response?.status !== 403) {
        showAlert('Erro ao carregar dados', 'danger');
      }
    } finally {
      setLoading(false);
    }
  };

  const showAlert = (message: string, color: string) => {
    setAlert({ show: true, message, color });
    setTimeout(() => setAlert({ show: false, message: '', color: 'success' }), 5000);
  };

  const formatDate = (date: Date | string): string => {
    const d = typeof date === 'string' ? new Date(date) : date;
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    const days: Array<{ date: Date; isCurrentMonth: boolean }> = [];
    
    // Add days from previous month (starting from Sunday = 0)
    if (startingDayOfWeek > 0) {
      const prevMonth = month === 0 ? 11 : month - 1;
      const prevYear = month === 0 ? year - 1 : year;
      const prevMonthLastDay = new Date(prevYear, prevMonth + 1, 0).getDate();
      
      for (let i = startingDayOfWeek - 1; i >= 0; i--) {
        const day = prevMonthLastDay - i;
        days.push({ 
          date: new Date(prevYear, prevMonth, day), 
          isCurrentMonth: false 
        });
      }
    }
    
    // Add days from current month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push({ 
        date: new Date(year, month, day), 
        isCurrentMonth: true 
      });
    }
    
    // Add days from next month to fill the grid (6 weeks * 7 days = 42)
    const remainingDays = 42 - days.length;
    if (remainingDays > 0) {
      for (let day = 1; day <= remainingDays; day++) {
        days.push({ 
          date: new Date(year, month + 1, day), 
          isCurrentMonth: false 
        });
      }
    }
    
    return days;
  };

  const getLogForDate = (date: Date): WorkoutLog | undefined => {
    const dateStr = date.toISOString().split('T')[0];
    return logs.find(log => {
      const logDate = new Date(log.date).toISOString().split('T')[0];
      return logDate === dateStr;
    });
  };

  const isWorkoutDate = (date: Date): boolean => {
    const dateStr = date.toISOString().split('T')[0];
    return plans.some(plan => {
      if (!plan.workoutDates || plan.workoutDates.length === 0) return false;
      return plan.workoutDates.some(workoutDate => {
        const workoutDateStr = new Date(workoutDate).toISOString().split('T')[0];
        return workoutDateStr === dateStr;
      });
    });
  };

  const getWorkoutPlanForDate = (date: Date): Plan | null => {
    const dateStr = date.toISOString().split('T')[0];
    return plans.find(plan => {
      if (!plan.workoutDates || plan.workoutDates.length === 0) return false;
      return plan.workoutDates.some(workoutDate => {
        const workoutDateStr = new Date(workoutDate).toISOString().split('T')[0];
        return workoutDateStr === dateStr;
      });
    }) || null;
  };

  const getExercisesForDate = (date: Date): Exercise[] => {
    const plan = getWorkoutPlanForDate(date);
    if (!plan || !plan.sessions || plan.sessions.length === 0) return [];

    const dateStr = date.toISOString().split('T')[0];
    
    // Try to find session by workoutDates index first (more accurate)
    if (plan.workoutDates && plan.workoutDates.length > 0) {
      const workoutDateIndex = plan.workoutDates.findIndex(workoutDate => {
        const workoutDateStr = new Date(workoutDate).toISOString().split('T')[0];
        return workoutDateStr === dateStr;
      });
      
      if (workoutDateIndex >= 0 && plan.sessions[workoutDateIndex]) {
        return plan.sessions[workoutDateIndex].exercises || [];
      }
      
      // If not found by index, try to find by order
      const sessionByOrder = plan.sessions.find(s => s.order === workoutDateIndex);
      if (sessionByOrder) {
        return sessionByOrder.exercises || [];
      }
    }

    // Fallback: find session by weekday
    const dayOfWeek = date.getDay();
    const weekdays = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const weekday = weekdays[dayOfWeek];
    const session = plan.sessions.find(s => s.weekday === weekday);
    return session?.exercises || [];
  };

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'completed':
        return styles.statusCompleted;
      case 'missed':
        return styles.statusMissed;
      case 'partial':
        return styles.statusPartial;
      default:
        return '';
    }
  };

  const canRegisterWorkout = (date: Date): boolean => {
    const dateStr = date.toISOString().split('T')[0];
    const todayStr = today.toISOString().split('T')[0];
    // Can only register on the workout day or after
    if (dateStr > todayStr) {
      return false;
    }
    // Check if this date has a scheduled workout
    return isWorkoutDate(date);
  };

  const handleDateClick = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    setSelectedDate(dateStr);
    const existingLog = getLogForDate(date);
    if (existingLog) {
      setLogStatus(existingLog.status);
      setLogReason(existingLog.reason || '');
      setPhotoPreview(existingLog.photo || null);
    } else {
      setLogStatus('completed');
      setLogReason('');
      setPhotoPreview(null);
    }
    setLogPhoto(null);
    setModalOpen(true);
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogPhoto(file);
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = () => {
    setLogPhoto(null);
    setPhotoPreview(null);
  };

  const handleSubmitLog = async () => {
    if (!selectedDate || plans.length === 0) {
      showAlert('Select a date and have an active plan', 'warning');
      return;
    }

    // Validate that the date is today or in the past (allow editing past workouts)
    const selectedDateObj = new Date(selectedDate);
    const dateStr = selectedDateObj.toISOString().split('T')[0];
    const todayStr = today.toISOString().split('T')[0];
    
    if (dateStr > todayStr) {
      showAlert('You can only register workouts on the workout day or after. Cannot register for future dates.', 'warning');
      return;
    }
    
    // Check if this date has a scheduled workout
    if (!isWorkoutDate(selectedDateObj)) {
      showAlert('You can only register workouts on scheduled workout days. This date does not have a scheduled workout.', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const existingLog = getLogForDate(selectedDateObj);
      
      if (existingLog) {
        // Update existing log
        const formData = new FormData();
        formData.append('status', logStatus);
        if (logStatus === 'missed' && logReason) {
          formData.append('reason', logReason);
        }
        if (logStatus === 'completed' && logPhoto) {
          formData.append('photo', logPhoto);
        }

        await apiClient.put(`/workout-logs/${existingLog._id}`, formData);
        showAlert('Record updated successfully!', 'success');
      } else {
        // Create new log
        const formData = new FormData();
        formData.append('workoutPlanId', plans[0]._id);
        formData.append('date', selectedDate);
        formData.append('status', logStatus);
        if (logStatus === 'missed' && logReason) {
          formData.append('reason', logReason);
        }
        if (logStatus === 'completed' && logPhoto) {
          formData.append('photo', logPhoto);
        }

        await apiClient.post('/workout-logs', formData);
        showAlert('Record saved successfully!', 'success');
      }
      
      setModalOpen(false);
      setLogPhoto(null);
      setPhotoPreview(null);
      fetchData();
    } catch (error: any) {
      console.error('Error submitting log:', error);
      showAlert(error.response?.data?.message || 'Error saving record', 'danger');
    } finally {
      setSubmitting(false);
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const weekdayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const days = getDaysInMonth(currentMonth);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Calculate stats
  const completedCount = logs.filter(log => log.status === 'completed').length;
  const missedCount = logs.filter(log => log.status === 'missed').length;
  const partialCount = logs.filter(log => log.status === 'partial').length;
  const totalCount = logs.length;
  const completionRate = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  return (
    <Container className={styles.container}>
      {alert.show && (
        <Alert color={alert.color} className="mb-3" toggle={() => setAlert({ ...alert, show: false })}>
          {alert.message}
        </Alert>
      )}

      <Row className="mb-4">
        <Col>
          <h2 className={styles.title}>Workout Calendar</h2>
          <p className="text-muted">View and record your progress</p>
        </Col>
      </Row>

      {/* Stats Cards */}
      <Row className="mb-4">
        <Col md={3} sm={6} className="mb-3">
          <Card className={styles.statCard}>
            <CardBody>
              <div className={styles.statValue}>{completedCount}</div>
              <div className={styles.statLabel}>Completed</div>
            </CardBody>
          </Card>
        </Col>
        <Col md={3} sm={6} className="mb-3">
          <Card className={styles.statCard}>
            <CardBody>
              <div className={styles.statValue}>{missedCount}</div>
              <div className={styles.statLabel}>Missed</div>
            </CardBody>
          </Card>
        </Col>
        <Col md={3} sm={6} className="mb-3">
          <Card className={styles.statCard}>
            <CardBody>
              <div className={styles.statValue}>{partialCount}</div>
              <div className={styles.statLabel}>Partial</div>
            </CardBody>
          </Card>
        </Col>
        <Col md={3} sm={6} className="mb-3">
          <Card className={styles.statCard}>
            <CardBody>
              <div className={styles.statValue}>{completionRate}%</div>
              <div className={styles.statLabel}>Completion Rate</div>
            </CardBody>
          </Card>
        </Col>
      </Row>

      {/* Calendar */}
      <Row>
        <Col>
          <Card>
            <CardBody>
              <div className={styles.calendarHeader}>
                <Button 
                  color="link" 
                  onClick={() => navigateMonth('prev')}
                  className={styles.navButton}
                >
                  ←
                </Button>
                <h4 className={styles.monthTitle}>
                  {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                </h4>
                <Button 
                  color="link" 
                  onClick={() => navigateMonth('next')}
                  className={styles.navButton}
                >
                  →
                </Button>
              </div>

              {loading ? (
                <div className={styles.loading}>
                  <Spinner /> Loading...
                </div>
              ) : (
                <div className={styles.calendarGrid}>
                  {weekdayNames.map(day => (
                    <div key={day} className={styles.weekdayHeader}>
                      {day}
                    </div>
                  ))}
                  
                  {days.map((day, index) => {
                    const log = getLogForDate(day.date);
                    const isWorkoutDay = isWorkoutDate(day.date);
                    const isToday = day.date.getTime() === today.getTime();
                    const isPast = day.date < today && !isToday;
                    const dateStr = day.date.toISOString().split('T')[0];
                    const isHovered = hoveredDate === dateStr;
                    
                    return (
                      <div
                        key={index}
                        className={`${styles.calendarDay} ${
                          !day.isCurrentMonth ? styles.otherMonth : ''
                        } ${isToday ? styles.today : ''} ${isPast ? styles.past : ''} ${
                          log ? getStatusClass(log.status) : isWorkoutDay ? styles.scheduledWorkout : ''
                        } ${isHovered ? styles.hovered : ''}`}
                        onClick={() => day.isCurrentMonth && handleDateClick(day.date)}
                        onMouseEnter={() => day.isCurrentMonth && setHoveredDate(dateStr)}
                        onMouseLeave={() => setHoveredDate(null)}
                        title={(() => {
                          const canRegister = canRegisterWorkout(day.date);
                          if (log) {
                            return `${log.status === 'completed' ? 'Completed' : log.status === 'missed' ? 'Not completed' : 'Partial'} - Click to ${canRegister ? 'edit' : 'view'}`;
                          }
                          if (isWorkoutDay) {
                            return canRegister 
                              ? 'Scheduled workout day - Click to register' 
                              : 'Scheduled workout day - View plan (registration available on workout day)';
                          }
                          return canRegister ? 'Click to register' : 'No scheduled workout';
                        })()}
                      >
                        <div className={styles.dayNumber}>
                          {day.date.getDate()}
                        </div>
                        {log && (
                          <div className={styles.dayStatus}>
                            {log.status === 'completed' && '✓'}
                            {log.status === 'missed' && '✗'}
                            {log.status === 'partial' && '~'}
                          </div>
                        )}
                        {!log && isWorkoutDay && (
                          <div className={styles.scheduledIndicator}>●</div>
                        )}
                        {isHovered && day.isCurrentMonth && (() => {
                          const exercises = getExercisesForDate(day.date);
                          const plan = getWorkoutPlanForDate(day.date);
                          const canRegister = canRegisterWorkout(day.date);
                          return (
                            <div className={styles.hoverTooltip}>
                              {log ? (
                                <>
                                  <strong>{log.status === 'completed' ? 'Completed' : log.status === 'missed' ? 'Not completed' : 'Partial'}</strong>
                                  {log.reason && <div className={styles.tooltipReason}>{log.reason}</div>}
                                  <div className={styles.tooltipHint}>Click to {canRegister ? 'edit' : 'view'}</div>
                                </>
                              ) : isWorkoutDay && exercises.length > 0 ? (
                                <>
                                  <strong>{plan?.name || 'Scheduled Workout'}</strong>
                                  <div className={styles.tooltipExercises}>
                                    {exercises.slice(0, 3).map((ex, idx) => (
                                      <div key={idx} className={styles.tooltipExercise}>
                                        {ex.name} - {ex.sets}x{ex.reps}
                                      </div>
                                    ))}
                                    {exercises.length > 3 && (
                                      <div className={styles.tooltipMore}>+{exercises.length - 3} more</div>
                                    )}
                                  </div>
                                  <div className={styles.tooltipHint}>
                                    {canRegister ? 'Click to register' : 'View plan (register on workout day)'}
                                  </div>
                                </>
                              ) : isWorkoutDay ? (
                                <>
                                  <strong>Scheduled Workout</strong>
                                  <div className={styles.tooltipHint}>
                                    {canRegister ? 'Click to register' : 'Registration available on workout day'}
                                  </div>
                                </>
                              ) : (
                                <>
                                  <div className={styles.tooltipHint}>
                                    {canRegister ? 'Click to register' : 'No scheduled workout'}
                                  </div>
                                </>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    );
                  })}
                </div>
              )}

              <div className={styles.legend}>
                <div className={styles.legendItem}>
                  <div className={`${styles.legendColor} ${styles.statusCompleted}`}></div>
                  <span>Completed</span>
                </div>
                <div className={styles.legendItem}>
                  <div className={`${styles.legendColor} ${styles.statusPartial}`}></div>
                  <span>Partial</span>
                </div>
                <div className={styles.legendItem}>
                  <div className={`${styles.legendColor} ${styles.statusMissed}`}></div>
                  <span>Missed</span>
                </div>
                <div className={styles.legendItem}>
                  <div className={`${styles.legendColor} ${styles.scheduledWorkout}`}></div>
                  <span>Scheduled Workout</span>
                </div>
              </div>
            </CardBody>
          </Card>
        </Col>
      </Row>

      {/* Modal for logging workout */}
      <Modal isOpen={modalOpen} toggle={() => setModalOpen(false)} size="lg">
        <ModalHeader toggle={() => setModalOpen(false)}>
          {selectedDate && (() => {
            const date = new Date(selectedDate);
            const exercises = getExercisesForDate(date);
            const isFuture = date > today;
            const log = selectedDate ? getLogForDate(date) : null;
            
            if (isFuture && exercises.length > 0 && !log) {
              return `Workout Plan - ${formatDate(selectedDate)}`;
            }
            return `Register Workout - ${formatDate(selectedDate)}`;
          })()}
        </ModalHeader>
        <ModalBody>
          {selectedDate && (() => {
            const date = new Date(selectedDate);
            const exercises = getExercisesForDate(date);
            const plan = getWorkoutPlanForDate(date);
            const isFuture = date > today;
            const canRegister = canRegisterWorkout(date);
            const log = getLogForDate(date);
            const isWorkoutDay = isWorkoutDate(date);
            // Allow editing if log exists (even if not a workout day) or if date is a scheduled workout day
            const canEdit = !!(log || (canRegister && isWorkoutDay));
            
            return (
              <>
                {/* Show planned exercises for future dates */}
                {isFuture && exercises.length > 0 && !log && (
                  <div className={styles.plannedWorkoutSection}>
                    <h5 className={styles.sectionTitle}>
                      <Badge color="info">{plan?.name || 'Planned Workout'}</Badge>
                    </h5>
                    {plan?.description && (
                      <p className="text-muted mb-3">{plan.description}</p>
                    )}
                    <div className={styles.exercisesList}>
                      <h6 className={styles.exercisesTitle}>Exercises:</h6>
                      {exercises.map((exercise, idx) => (
                        <Row key={idx} className={`${styles.exerciseItem} mb-3`}>
                          <Col md={4}>
                            <div className={styles.exerciseName}>
                              <strong>{exercise.name}</strong>
                            </div>
                            <div className={styles.exerciseDetails}>
                              <div className="mt-2">
                                <span className={styles.exerciseSetsReps}>
                                  {exercise.sets} sets × {exercise.reps} reps
                                </span>
                                {exercise.restSeconds && (
                                  <span className={styles.exerciseRest}>
                                    <br />Rest: {exercise.restSeconds}s
                                  </span>
                                )}
                              </div>
                            </div>
                          </Col>
                          <Col md={4}>
                            <div className={styles.exerciseInstructions}>
                              <strong>Instructions:</strong>
                              <div className="text-muted mt-1">
                                {exercise.instructions || <em>No instructions provided</em>}
                              </div>
                            </div>
                          </Col>
                          <Col md={4}>
                            <div className={styles.exerciseVideo}>
                              <strong>Video:</strong>
                              <div className="mt-1">
                                {exercise.videoUrl ? (
                                  <a 
                                    href={exercise.videoUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-primary"
                                  >
                                    Exercise Video →
                                  </a>
                                ) : (
                                  <em className="text-muted">No video available</em>
                                )}
                              </div>
                            </div>
                          </Col>
                        </Row>
                      ))}
                    </div>
                    <hr className="my-4" />
                    <Alert color="warning">
                      <strong>Note:</strong> This is your planned workout. You can only register your status on the workout day or after. Registration is not available for future dates.
                    </Alert>
                  </div>
                )}

                {/* Show planned exercises for today/past dates without log */}
                {!isFuture && exercises.length > 0 && !log && (
                  <div className={styles.plannedWorkoutSection}>
                    <h5 className={styles.sectionTitle}>
                      <Badge color="info">{plan?.name || 'Planned Workout'}</Badge>
                    </h5>
                    {plan?.description && (
                      <p className="text-muted mb-3">{plan.description}</p>
                    )}
                    <div className={styles.exercisesList}>
                      <h6 className={styles.exercisesTitle}>Exercises:</h6>
                      {exercises.map((exercise, idx) => (
                        <Row key={idx} className={`${styles.exerciseItem} mb-3`}>
                          <Col md={4}>
                            <div className={styles.exerciseName}>
                              <strong>{exercise.name}</strong>
                            </div>
                            <div className={styles.exerciseDetails}>
                              <div className="mt-2">
                                <span className={styles.exerciseSetsReps}>
                                  {exercise.sets} sets × {exercise.reps} reps
                                </span>
                                {exercise.restSeconds && (
                                  <span className={styles.exerciseRest}>
                                    <br />Rest: {exercise.restSeconds}s
                                  </span>
                                )}
                              </div>
                            </div>
                          </Col>
                          <Col md={4}>
                            <div className={styles.exerciseInstructions}>
                              <strong>Instructions:</strong>
                              <div className="text-muted mt-1">
                                {exercise.instructions || <em>No instructions provided</em>}
                              </div>
                            </div>
                          </Col>
                          <Col md={4}>
                            <div className={styles.exerciseVideo}>
                              <strong>Video:</strong>
                              <div className="mt-1">
                                {exercise.videoUrl ? (
                                  <a 
                                    href={exercise.videoUrl} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="text-primary"
                                  >
                                    Watch Exercise Video →
                                  </a>
                                ) : (
                                  <em className="text-muted">No video available</em>
                                )}
                              </div>
                            </div>
                          </Col>
                        </Row>
                      ))}
                    </div>
                    <hr className="my-4" />
                  </div>
                )}

                {/* Show log details if exists */}
                {log && (
                  <div className={styles.logDetailsSection}>
                    <h5 className={styles.sectionTitle}>Current Status</h5>
                    <div className="mb-3">
                      <Badge color={log.status === 'completed' ? 'success' : log.status === 'missed' ? 'danger' : 'warning'}>
                        {log.status === 'completed' ? 'Completed' : log.status === 'missed' ? 'Not Completed' : 'Partial'}
                      </Badge>
                      {log.reason && (
                        <div className="mt-2">
                          <strong>Reason:</strong> {log.reason}
                        </div>
                      )}
                      {log.photo && (
                        <div className="mt-3">
                          <strong>Photo:</strong>
                          <div className="mt-2">
                            <img 
                              src={log.photo} 
                              alt="Workout proof" 
                              style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: '8px', border: '1px solid #dee2e6' }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                    <hr className="my-3" />
                  </div>
                )}

                

                <Form>
                  <FormGroup>
                    <Label for="status">Workout Status</Label>
                    <Input
                      type="select"
                      id="status"
                      value={logStatus}
                      onChange={(e) => {
                        setLogStatus(e.target.value as 'completed' | 'missed' | 'partial');
                        if (e.target.value !== 'completed') {
                          setLogPhoto(null);
                          if (!log?.photo) {
                            setPhotoPreview(null);
                          }
                        }
                      }}
                      disabled={!canEdit}
                    >
                      <option value="completed">Completed</option>
                      <option value="partial">Partial</option>
                      <option value="missed">Not Completed</option>
                    </Input>
                  </FormGroup>
                  
                  {logStatus === 'missed' && (
                    <FormGroup>
                      <Label for="reason">Reason (optional)</Label>
                      <Input
                        type="textarea"
                        id="reason"
                        value={logReason}
                        onChange={(e) => setLogReason(e.target.value)}
                        rows={3}
                        placeholder="Explain the reason for not completing the workout..."
                        disabled={!canEdit}
                      />
                    </FormGroup>
                  )}

                  {logStatus === 'completed' && canEdit && (
                    <FormGroup>
                      <Label for="photo">Upload Photo (optional)</Label>
                      <Input
                        type="file"
                        id="photo"
                        accept="image/*"
                        onChange={handlePhotoChange}
                        disabled={!canEdit}
                      />
                      <small className="text-muted d-block mt-1">
                        Upload a photo to show proof that you completed the workout
                      </small>
                      {photoPreview && (
                        <div className="mt-3">
                          <div className="position-relative d-inline-block">
                            <img 
                              src={photoPreview} 
                              alt="Preview" 
                              style={{ maxWidth: '100%', maxHeight: '300px', borderRadius: '8px', border: '1px solid #dee2e6' }}
                            />
                            <Button
                              color="danger"
                              size="sm"
                              className="position-absolute"
                              style={{ top: '5px', right: '5px' }}
                              onClick={handleRemovePhoto}
                            >
                              ×
                            </Button>
                          </div>
                        </div>
                      )}
                    </FormGroup>
                  )}
                </Form>
              </>
            );
          })()}
        </ModalBody>
        <ModalFooter>
          <Button color="secondary" onClick={() => setModalOpen(false)}>
            {selectedDate && (() => {
              const date = new Date(selectedDate);
              const log = getLogForDate(date);
              const isWorkoutDay = isWorkoutDate(date);
              const dateStr = date.toISOString().split('T')[0];
              const todayStr = today.toISOString().split('T')[0];
              const canRegister = dateStr <= todayStr && isWorkoutDay;
              return (log || canRegister) ? 'Cancel' : 'Close';
            })()}
          </Button>
          {selectedDate && (() => {
            const date = new Date(selectedDate);
            const log = getLogForDate(date);
            const isWorkoutDay = isWorkoutDate(date);
            const dateStr = date.toISOString().split('T')[0];
            const todayStr = today.toISOString().split('T')[0];
            const canRegister = dateStr <= todayStr && isWorkoutDay;
            return (log || canRegister);
          })() && (
            <Button color="primary" onClick={handleSubmitLog} disabled={submitting}>
              {submitting ? <><Spinner size="sm" /> Saving...</> : 'Save'}
            </Button>
          )}
        </ModalFooter>
      </Modal>
    </Container>
  );
};

export default ClientCalendar;


