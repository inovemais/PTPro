import React from 'react';
import { Row, Col, FormGroup, Label, Input, Button } from 'reactstrap';
import styles from './styles.module.scss';

interface Client {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
  };
}

interface PlanFiltersProps {
  clients: Client[];
  selectedClientId: string;
  selectedFrequency: string;
  sortBy: string;
  onClientChange: (clientId: string) => void;
  onFrequencyChange: (frequency: string) => void;
  onSortChange: (sort: string) => void;
  onClearFilters: () => void;
}

const PlanFilters: React.FC<PlanFiltersProps> = ({
  clients,
  selectedClientId,
  selectedFrequency,
  sortBy,
  onClientChange,
  onFrequencyChange,
  onSortChange,
  onClearFilters,
}) => {
  return (
    <div className={styles.filtersContainer}>
      <Row>
        <Col md={4}>
          <FormGroup>
            <Label for="clientFilter">Client</Label>
            <Input
              type="select"
              id="clientFilter"
              value={selectedClientId}
              onChange={(e) => onClientChange(e.target.value)}
            >
              <option value="">All clients</option>
              {clients.map((client) => (
                <option key={client._id} value={client._id}>
                  {client.userId?.name || client.userId?.email || 'N/A'}
                </option>
              ))}
            </Input>
          </FormGroup>
        </Col>

        <Col md={4}>
          <FormGroup>
            <Label for="frequencyFilter">Weekly Frequency</Label>
            <Input
              type="select"
              id="frequencyFilter"
              value={selectedFrequency}
              onChange={(e) => onFrequencyChange(e.target.value)}
            >
              <option value="">All</option>
              <option value="3">3x per week</option>
              <option value="4">4x per week</option>
              <option value="5">5x per week</option>
            </Input>
          </FormGroup>
        </Col>

        <Col md={4}>
          <FormGroup>
            <Label for="sortBy">Sort by</Label>
            <Input
              type="select"
              id="sortBy"
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value)}
            >
              <option value="-createdAt">Most Recent</option>
              <option value="createdAt">Oldest</option>
              <option value="name">Name (A-Z)</option>
              <option value="-name">Name (Z-A)</option>
              <option value="-startDate">Start Date (Most Recent)</option>
              <option value="startDate">Start Date (Oldest)</option>
            </Input>
          </FormGroup>
        </Col>
      </Row>

      <Row>
        <Col>
          <Button color="secondary" size="sm" onClick={onClearFilters}>
            Clear Filters
          </Button>
        </Col>
      </Row>
    </div>
  );
};

export default PlanFilters;

