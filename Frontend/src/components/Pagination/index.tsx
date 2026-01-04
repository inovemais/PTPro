import React from 'react';
import { Pagination, PaginationItem, PaginationLink } from 'reactstrap';
import styles from './styles.module.scss';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  showPageSize?: boolean;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
}

const PaginationComponent: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  pageSize,
  total,
  onPageChange,
  showPageSize = false,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
}) => {
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, total);

  const getVisiblePages = () => {
    const delta = 2;
    const range = [];
    const rangeWithDots = [];

    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      range.push(i);
    }

    if (currentPage - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...', totalPages);
    } else if (totalPages > 1) {
      rangeWithDots.push(totalPages);
    }

    return rangeWithDots;
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      onPageChange(page);
    }
  };

  if (totalPages <= 1 && !showPageSize) {
    return null;
  }

  return (
    <div className={styles.paginationContainer}>
      <div className={styles.paginationInfo}>
        Showing {startItem} to {endItem} of {total} results
      </div>

      {showPageSize && onPageSizeChange && (
        <div className={styles.pageSizeSelector}>
          <label htmlFor="pageSize">Items per page:</label>
          <select
            id="pageSize"
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className={styles.pageSizeSelect}
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
      )}

      {totalPages > 1 && (
        <Pagination className={styles.pagination}>
          <PaginationItem disabled={currentPage === 1}>
            <PaginationLink previous onClick={() => handlePageChange(currentPage - 1)} />
          </PaginationItem>

          {getVisiblePages().map((page, index) => {
            if (page === '...') {
              return (
                <PaginationItem disabled key={`dots-${index}`}>
                  <PaginationLink>...</PaginationLink>
                </PaginationItem>
              );
            }

            return (
              <PaginationItem active={page === currentPage} key={page}>
                <PaginationLink onClick={() => handlePageChange(page as number)}>
                  {page}
                </PaginationLink>
              </PaginationItem>
            );
          })}

          <PaginationItem disabled={currentPage === totalPages}>
            <PaginationLink next onClick={() => handlePageChange(currentPage + 1)} />
          </PaginationItem>
        </Pagination>
      )}
    </div>
  );
};

export default PaginationComponent;

