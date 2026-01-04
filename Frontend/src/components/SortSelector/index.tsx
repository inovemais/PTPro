import React from 'react';
import { Input, Label } from 'reactstrap';
import styles from './styles.module.scss';

export interface SortOption {
  value: string;
  label: string;
  direction?: 'asc' | 'desc';
}

interface SortSelectorProps {
  value: string;
  onChange: (value: string) => void;
  options: SortOption[];
  label?: string;
}

const SortSelector: React.FC<SortSelectorProps> = ({
  value,
  onChange,
  options,
  label = 'Sort by:',
}) => {
  return (
    <div className={styles.sortSelector}>
      <Label for="sortSelect" className={styles.label}>
        {label}
      </Label>
      <Input
        id="sortSelect"
        type="select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={styles.select}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </Input>
    </div>
  );
};

export default SortSelector;

