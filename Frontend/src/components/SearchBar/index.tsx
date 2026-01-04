import React from 'react';
import { Input, InputGroup, InputGroupText } from 'reactstrap';
import styles from './styles.module.scss';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onClear?: () => void;
}

const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  placeholder = 'Search...',
  onClear,
}) => {
  return (
    <InputGroup className={styles.searchBar}>
      <InputGroupText>
        🔍
      </InputGroupText>
      <Input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {value && onClear && (
        <InputGroupText>
          <button
            type="button"
            className={styles.clearButton}
            onClick={onClear}
            aria-label="Clear search"
          >
            ×
          </button>
        </InputGroupText>
      )}
    </InputGroup>
  );
};

export default SearchBar;

