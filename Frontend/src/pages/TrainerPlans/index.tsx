import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Table, Button, Spinner } from 'reactstrap';
import { toast } from 'react-toastify';
import apiClient from '../../lib/axios';
import PlanFilters from '../../components/PlanFilters';
import SearchBar from '../../components/SearchBar';
import PaginationComponent from '../../components/Pagination';
import styles from './styles.module.scss';

interface Client {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
  };
}

interface Plan {
  _id: string;
  name: string;
  description?: string;
  frequencyPerWeek: number;
  startDate: string;
  isActive: boolean;
  clientId: {
    _id: string;
    userId: {
      name: string;
      email: string;
    };
  };
  sessions?: any[];
}

const TrainerPlans: React.FC = () => {
  const navigate = useNavigate();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [allPlans, setAllPlans] = useState<Plan[]>([]); // All plans before search filter
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Filter states
  const [selectedClientId, setSelectedClientId] = useState('');
  const [selectedFrequency, setSelectedFrequency] = useState('');
  const [sortBy, setSortBy] = useState('-createdAt');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    fetchClients();
    fetchPlans();
  }, []);

  useEffect(() => {
    fetchPlans();
  }, [selectedClientId, selectedFrequency, sortBy]);

  // Apply search filter when searchTerm changes
  useEffect(() => {
    if (!searchTerm) {
      setPlans(allPlans);
      setCurrentPage(1);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = allPlans.filter((plan: Plan) => {
      const planName = plan.name?.toLowerCase() || '';
      const clientName = plan.clientId?.userId?.name?.toLowerCase() || '';
      const clientEmail = plan.clientId?.userId?.email?.toLowerCase() || '';
      const description = plan.description?.toLowerCase() || '';
      
      return planName.includes(term) || 
             clientName.includes(term) || 
             clientEmail.includes(term) ||
             description.includes(term);
    });
    
    setPlans(filtered);
    setCurrentPage(1);
  }, [searchTerm, allPlans]);

  const fetchClients = async () => {
    try {
      const response = await apiClient.get('/clients');
      // Standardized format: { success: true, data: [...], meta: { pagination: {...} } }
      const clientsList = response.data.success && response.data.data 
        ? response.data.data 
        : [];
      setClients(clientsList);
    } catch (error: any) {
      console.error('Error fetching clients:', error);
      toast.error('Erro ao carregar clientes', {
        position: 'top-right',
        autoClose: 3000,
      });
    }
  };

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const params: any = {
        limit: 100,
        skip: 0,
        sort: sortBy,
      };

      if (selectedClientId) {
        params.clientId = selectedClientId;
      }

      // If filtering by weekday, we need to fetch all and filter client-side
      // since the backend filter works on sessions, not plans
      const response = await apiClient.get('/plans', { params });
      
      // Standardized format: { success: true, data: [...], meta: { pagination: {...} } }
      let plansList = response.data.success && response.data.data 
        ? response.data.data 
        : [];

      // Filter by frequency per week
      if (selectedFrequency) {
        const frequency = parseInt(selectedFrequency);
        plansList = plansList.filter((plan: Plan) => {
          return plan.frequencyPerWeek === frequency;
        });
      }
      
      // Store all plans (before search filter) and apply search if needed
      setAllPlans(plansList);
      
      // Apply search filter if searchTerm exists
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const filteredPlans = plansList.filter((plan: Plan) => {
          const planName = plan.name?.toLowerCase() || '';
          const clientName = plan.clientId?.userId?.name?.toLowerCase() || '';
          const clientEmail = plan.clientId?.userId?.email?.toLowerCase() || '';
          const description = plan.description?.toLowerCase() || '';
          
          return planName.includes(term) || 
                 clientName.includes(term) || 
                 clientEmail.includes(term) ||
                 description.includes(term);
        });
        setPlans(filteredPlans);
      } else {
        setPlans(plansList);
      }
    } catch (error: any) {
      console.error('Error fetching plans:', error);
      toast.error('Erro ao carregar planos', {
        position: 'top-right',
        autoClose: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClientChange = (clientId: string) => {
    setSelectedClientId(clientId);
    setCurrentPage(1);
  };

  const handleFrequencyChange = (frequency: string) => {
    setSelectedFrequency(frequency);
    setCurrentPage(1);
  };

  const handleSortChange = (sort: string) => {
    setSortBy(sort);
    setCurrentPage(1);
  };

  const handleClearFilters = () => {
    setSelectedClientId('');
    setSelectedFrequency('');
    setSortBy('-createdAt');
    setSearchTerm('');
    setCurrentPage(1);
  };
  
  // Pagination logic
  const totalPages = Math.ceil(plans.length / pageSize);
  const paginatedPlans = plans.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );
  
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getWeekdayLabel = (weekday: string): string => {
    const labels: { [key: string]: string } = {
      monday: 'Monday',
      tuesday: 'Tuesday',
      wednesday: 'Wednesday',
      thursday: 'Thursday',
      friday: 'Friday',
      saturday: 'Saturday',
      sunday: 'Sunday',
    };
    return labels[weekday] || weekday;
  };

  const handleDeletePlan = async (planId: string, planName: string) => {
    const confirmMessage = `Are you sure you want to delete the plan "${planName}"?\n\nThis action cannot be undone.`;
    
    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      await apiClient.delete(`/plans/${planId}`);
      // Refresh the plans list
      await fetchPlans();
      toast.success('Plano deletado com sucesso!', {
        position: 'top-right',
        autoClose: 3000,
      });
    } catch (error: any) {
      console.error('Error deleting plan:', error);
      const errorMessage = 
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Erro ao deletar plano. Por favor, tente novamente.';
      toast.error(errorMessage, {
        position: 'top-right',
        autoClose: 5000,
      });
    }
  };

  return (
    <Container className={styles.container}>
      <div className={styles.header}>
        <h2>Workout Plans</h2>
        <Button className={styles.addButton} onClick={() => navigate('/trainer/plans/new')}>
          <span>+</span> Create New Plan
        </Button>
      </div>

      <Row className="mb-3 mt-3">
        <Col md={6}>
          <SearchBar
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search by client name or email"
            onClear={() => setSearchTerm('')}
          />
        </Col>
      </Row>

      <Row className="mb-3">
        <Col>
          <PlanFilters
            clients={clients}
            selectedClientId={selectedClientId}
            selectedFrequency={selectedFrequency}
            sortBy={sortBy}
            onClientChange={handleClientChange}
            onFrequencyChange={handleFrequencyChange}
            onSortChange={handleSortChange}
            onClearFilters={handleClearFilters}
          />
        </Col>
      </Row>

      {loading ? (
        <div className={styles.loadingContainer}>
          <Spinner color="primary" />
        </div>
      ) : paginatedPlans.length === 0 ? (
        <div className={styles.emptyState}>
          <h5>No plans found</h5>
          <p>There are no workout plans registered yet.</p>
          <Button className={styles.addButton} onClick={() => navigate('/trainer/plans/new')}>
            <span>+</span> Create First Plan
          </Button>
        </div>
      ) : (
        <>
          <div className={styles.card}>
            <div className={styles.tableWrapper}>
              <Table className={styles.table}>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Client</th>
                    <th>Frequency</th>
                    <th>Sessions</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedPlans.map((plan) => {
                    try {
                      const uniqueWeekdays = [
                        ...new Set((plan.sessions || []).map((s: any) => s?.weekday).filter(Boolean)),
                      ];
                      const uniqueWeeks = [
                        ...new Set((plan.sessions || []).map((s: any) => s?.week).filter(Boolean)),
                      ];
                      
                      return (
                        <tr key={plan._id}>
                          <td className={styles.nameCell}>
                            <strong>{plan.name || 'Unnamed Plan'}</strong>
                            {plan.description && (
                              <div className={styles.description}>{plan.description}</div>
                            )}
                          </td>
                          <td className={styles.clientCell}>
                            {plan.clientId?.userId?.name || plan.clientId?.userId?.email || 'N/A'}
                          </td>
                          <td>{plan.frequencyPerWeek || 0}x per week</td>
                          <td>
                            <div className={styles.sessionsInfo}>
                              {uniqueWeeks.length > 0 ? (
                                <>
                                  {uniqueWeeks.length} week{uniqueWeeks.length !== 1 ? 's' : ''}, {' '}
                                  {uniqueWeekdays.length} day{uniqueWeekdays.length !== 1 ? 's' : ''}: {' '}
                                  {uniqueWeekdays
                                    .map((w) => getWeekdayLabel(w))
                                    .join(', ')}
                                </>
                              ) : (
                                'No sessions'
                              )}
                            </div>
                          </td>
                          <td className={styles.actionsCell}>
                            <button
                              className={styles.editButton}
                              onClick={() => navigate(`/trainer/plans/${plan._id}`)}
                            >
                              Edit
                            </button>
                            <button
                              className={styles.deleteButton}
                              onClick={() => handleDeletePlan(plan._id, plan.name)}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      );
                    } catch (error) {
                      console.error('Error rendering plan row:', error, plan);
                      return (
                        <tr key={plan._id || 'error'}>
                          <td colSpan={5} style={{ color: 'red' }}>
                            Error rendering plan: {plan.name || plan._id || 'Unknown'}
                          </td>
                        </tr>
                      );
                    }
                  })}
                </tbody>
              </Table>
            </div>
          </div>
          
          {plans.length > 0 && (
            <PaginationComponent
              currentPage={currentPage}
              totalPages={totalPages}
              pageSize={pageSize}
              total={plans.length}
              onPageChange={handlePageChange}
              showPageSize={true}
              onPageSizeChange={(size) => {
                setPageSize(size);
                setCurrentPage(1);
              }}
            />
          )}
        </>
      )}
    </Container>
  );
};

export default TrainerPlans;
