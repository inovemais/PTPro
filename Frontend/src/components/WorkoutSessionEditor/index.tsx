import React from 'react';
import { FormGroup, Label, Input, Button, Alert } from 'reactstrap';
import ExerciseForm, { Exercise } from '../ExerciseForm';
import styles from './styles.module.scss';

export interface WorkoutSession {
  week: number;
  weekday: string;
  order: number;
  exercises: Exercise[];
}

interface WorkoutSessionEditorProps {
  session: WorkoutSession;
  onChange: (session: WorkoutSession) => void;
  onRemove?: () => void;
  weekNumber: number;
  frequencyPerWeek: number;
  canRemove?: boolean;
  hideWeekday?: boolean; // Se true, não mostra o campo de dia da semana
  workoutDate?: string; // Data do treino (para exibir no título)
}

const weekdays = [
  { value: 'monday', label: 'Segunda-feira' },
  { value: 'tuesday', label: 'Terça-feira' },
  { value: 'wednesday', label: 'Quarta-feira' },
  { value: 'thursday', label: 'Quinta-feira' },
  { value: 'friday', label: 'Sexta-feira' },
  { value: 'saturday', label: 'Sábado' },
  { value: 'sunday', label: 'Domingo' },
];

const MAX_EXERCISES = 10;

const WorkoutSessionEditor: React.FC<WorkoutSessionEditorProps> = ({
  session,
  onChange,
  onRemove,
  weekNumber,
  frequencyPerWeek,
  canRemove = true,
  hideWeekday = false,
  workoutDate,
}) => {
  const handleExerciseChange = (index: number, exercise: Exercise) => {
    const newExercises = [...session.exercises];
    newExercises[index] = exercise;
    onChange({
      ...session,
      exercises: newExercises,
    });
  };

  const handleAddExercise = () => {
    if (session.exercises.length >= MAX_EXERCISES) {
      return;
    }
    const newExercise: Exercise = {
      name: '',
      sets: 0,
      reps: 0,
      instructions: '',
      videoUrl: '',
    };
    onChange({
      ...session,
      exercises: [...session.exercises, newExercise],
    });
  };

  const handleRemoveExercise = (index: number) => {
    const newExercises = session.exercises.filter((_, i) => i !== index);
    onChange({
      ...session,
      exercises: newExercises,
    });
  };

  const handleWeekdayChange = (weekday: string) => {
    onChange({
      ...session,
      weekday,
    });
  };

  const canAddExercise = session.exercises.length < MAX_EXERCISES;
  const exerciseCount = session.exercises.length;

  // Format workout date for display if provided
  const formattedWorkoutDate = workoutDate
    ? (() => {
        const formatted = new Date(workoutDate + 'T00:00:00').toLocaleDateString('pt-PT', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
        return formatted.charAt(0).toUpperCase() + formatted.slice(1);
      })()
    : null;

  const sessionTitle = hideWeekday && formattedWorkoutDate
    ? formattedWorkoutDate
    : `Semana ${weekNumber} - ${weekdays.find(d => d.value === session.weekday)?.label || session.weekday}`;

  return (
    <div className={styles.sessionEditor}>
      <div className={styles.sessionHeader}>
        <div className={styles.sessionTitle}>
          <h5>{sessionTitle}</h5>
        </div>
        {canRemove && onRemove && (
          <Button color="danger" size="sm" onClick={onRemove}>
            Remover Sessão
          </Button>
        )}
      </div>

      {!hideWeekday && (
        <FormGroup>
          <Label for={`session-weekday-${session.week}-${session.weekday}`}>Dia da Semana *</Label>
          <Input
            type="select"
            id={`session-weekday-${session.week}-${session.weekday}`}
            value={session.weekday}
            onChange={(e) => handleWeekdayChange(e.target.value)}
            required
          >
            {weekdays.map((day) => (
              <option key={day.value} value={day.value}>
                {day.label}
              </option>
            ))}
          </Input>
        </FormGroup>
      )}

      <div className={styles.exercisesSection}>
        <div className={styles.exercisesHeader}>
          <h6>Exercícios ({exerciseCount}/{MAX_EXERCISES})</h6>
          <Button
            color="primary"
            size="sm"
            onClick={handleAddExercise}
            disabled={!canAddExercise}
          >
            + Adicionar Exercício
          </Button>
        </div>

        {!canAddExercise && (
          <Alert color="warning" className={styles.maxExercisesAlert}>
            Limite máximo de {MAX_EXERCISES} exercícios por sessão atingido.
          </Alert>
        )}

        {session.exercises.length === 0 ? (
          <div className={styles.noExercises}>
            <p>Nenhum exercício adicionado ainda. Clique em "Adicionar Exercício" para começar.</p>
          </div>
        ) : (
          <div className={styles.exercisesList}>
            {session.exercises.map((exercise, index) => {
              // Create unique index combining weekNumber, weekday, and exercise index
              // This ensures IDs are unique even if multiple WorkoutSessionEditor components are on the same page
              const weekdayNum = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'].indexOf(session.weekday);
              const uniqueIndex = weekNumber * 10000 + weekdayNum * 1000 + index;
              return (
                <ExerciseForm
                  key={index}
                  exercise={exercise}
                  onChange={(updatedExercise) => handleExerciseChange(index, updatedExercise)}
                  onRemove={() => handleRemoveExercise(index)}
                  index={uniqueIndex}
                  canRemove={true}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkoutSessionEditor;

