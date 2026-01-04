import React from 'react';
import { FormGroup, Label, Input, Row, Col, Button } from 'reactstrap';
import styles from './styles.module.scss';

export interface Exercise {
  name: string;
  sets: number;
  reps: number;
  restSeconds?: number; // Rest time in seconds
  instructions?: string;
  videoUrl?: string;
}

interface ExerciseFormProps {
  exercise: Exercise;
  onChange: (exercise: Exercise) => void;
  onRemove?: () => void;
  index: number;
  canRemove?: boolean;
}

const ExerciseForm: React.FC<ExerciseFormProps> = ({
  exercise,
  onChange,
  onRemove,
  index,
  canRemove = true,
}) => {
  const handleChange = (field: keyof Exercise, value: string | number) => {
    onChange({
      ...exercise,
      [field]: value,
    });
  };

  return (
    <div className={styles.exerciseForm}>
      <div className={styles.exerciseHeader}>
        <h5>Exercise {index + 1}</h5>
        {canRemove && onRemove && (
          <Button color="danger" size="sm" onClick={onRemove}>
            Remove
          </Button>
        )}
      </div>

      <Row>
        <Col md={12}>
          <FormGroup>
            <Label for={`exercise-name-${index}`}>Exercise Name *</Label>
            <Input
              type="text"
              id={`exercise-name-${index}`}
              value={exercise.name}
              onChange={(e) => handleChange('name', e.target.value)}
              required
              placeholder="Ex: Squat"
            />
          </FormGroup>
        </Col>
      </Row>

      <Row>
        <Col md={4}>
          <FormGroup>
            <Label for={`exercise-sets-${index}`}>Sets *</Label>
            <Input
              type="number"
              id={`exercise-sets-${index}`}
              value={exercise.sets || ''}
              onChange={(e) => handleChange('sets', parseInt(e.target.value) || 0)}
              required
              min="1"
              placeholder="Ex: 3"
            />
          </FormGroup>
        </Col>
        <Col md={4}>
          <FormGroup>
            <Label for={`exercise-reps-${index}`}>Reps *</Label>
            <Input
              type="number"
              id={`exercise-reps-${index}`}
              value={exercise.reps || ''}
              onChange={(e) => handleChange('reps', parseInt(e.target.value) || 0)}
              required
              min="1"
              placeholder="Ex: 12"
            />
          </FormGroup>
        </Col>
        <Col md={4}>
          <FormGroup>
            <Label for={`exercise-rest-${index}`}>Rest Time (seconds)</Label>
            <Input
              type="number"
              id={`exercise-rest-${index}`}
              value={exercise.restSeconds || ''}
              onChange={(e) => handleChange('restSeconds', parseInt(e.target.value) || undefined)}
              min="0"
              placeholder="Ex: 60"
            />
            <small className="text-muted">Rest time between sets</small>
          </FormGroup>
        </Col>
      </Row>

      <Row>
        <Col md={12}>
          <FormGroup>
            <Label for={`exercise-instructions-${index}`}>Instructions</Label>
            <Input
              type="textarea"
              id={`exercise-instructions-${index}`}
              value={exercise.instructions || ''}
              onChange={(e) => handleChange('instructions', e.target.value)}
              rows={3}
              placeholder="Detailed instructions on how to perform the exercise..."
            />
          </FormGroup>
        </Col>
      </Row>

      <Row>
        <Col md={12}>
          <FormGroup>
            <Label for={`exercise-video-${index}`}>Video Link</Label>
            <Input
              type="url"
              id={`exercise-video-${index}`}
              value={exercise.videoUrl || ''}
              onChange={(e) => handleChange('videoUrl', e.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
            />
            {exercise.videoUrl && (
              <small className="text-muted">
                Demonstration video URL (YouTube, Vimeo, etc.)
              </small>
            )}
          </FormGroup>
        </Col>
      </Row>
    </div>
  );
};

export default ExerciseForm;

