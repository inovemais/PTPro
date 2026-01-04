import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Table, Button, Spinner, Modal, ModalHeader, ModalBody, ModalFooter, Form, Label, Input } from 'reactstrap';
import { toast } from 'react-toastify';
import apiClient from '../../lib/axios';
import SearchBar from '../../components/SearchBar';
import SortSelector, { SortOption } from '../../components/SortSelector';
import PaginationComponent from '../../components/Pagination';
import styles from './styles.module.scss';

interface Client {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
  };
  goal?: string;
  isValidated?: boolean;
}

interface ClientFormData {
  name: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  address?: string;
  country?: string;
  taxNumber?: string;
  heightCm?: string;
  weightKg?: string;
  goal?: string;
  notes?: string;
}

const TrainerClients: React.FC = () => {
  const navigate = useNavigate();
  const [allClients, setAllClients] = useState<Client[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [addExistingModalOpen, setAddExistingModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [availableUsers, setAvailableUsers] = useState<any[]>([]);
  const [searchAvailableUsers, setSearchAvailableUsers] = useState('');
  const [loadingAvailableUsers, setLoadingAvailableUsers] = useState(false);
  const [formData, setFormData] = useState<ClientFormData>({
    name: '',
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    address: '',
    country: '',
    taxNumber: '',
    heightCm: '',
    weightKg: '',
    goal: '',
    notes: '',
  });

  const fetchClients = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/clients');
      
      // Standardized format: { success: true, data: [...], meta: { pagination: {...} } }
      const clientsList = response.data.success && response.data.data 
        ? response.data.data 
        : [];
      
      setAllClients(clientsList);
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  // Apply search and sort filters
  useEffect(() => {
    let filtered = [...allClients];

    // Apply search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((client) => {
        const name = client.userId?.name?.toLowerCase() || '';
        const email = client.userId?.email?.toLowerCase() || '';
        const goal = client.goal?.toLowerCase() || '';
        return name.includes(term) || email.includes(term) || goal.includes(term);
      });
    }

    // Apply sort
    filtered.sort((a, b) => {
      const aValue = sortBy === 'name' ? a.userId?.name || '' : 
                     sortBy === 'email' ? a.userId?.email || '' :
                     sortBy === '-name' ? a.userId?.name || '' :
                     a.userId?.email || '';
      const bValue = sortBy === 'name' ? b.userId?.name || '' :
                     sortBy === 'email' ? b.userId?.email || '' :
                     sortBy === '-name' ? b.userId?.name || '' :
                     b.userId?.email || '';
      
      if (sortBy.startsWith('-')) {
        return bValue.localeCompare(aValue);
      }
      return aValue.localeCompare(bValue);
    });

    setClients(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [allClients, searchTerm, sortBy]);

  const sortOptions: SortOption[] = [
    { value: 'name', label: 'Name (A-Z)' },
    { value: '-name', label: 'Name (Z-A)' },
    { value: 'email', label: 'Email (A-Z)' },
    { value: '-email', label: 'Email (Z-A)' },
  ];

  // Pagination logic
  const totalPages = Math.ceil(clients.length / pageSize);
  const paginatedClients = useMemo(() => {
    return clients.slice(
      (currentPage - 1) * pageSize,
      currentPage * pageSize
    );
  }, [clients, currentPage, pageSize]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleModal = () => {
    setModalOpen(!modalOpen);
    if (!modalOpen) {
      // Reset form when opening modal
      setFormData({
        name: '',
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        phone: '',
        address: '',
        country: '',
        taxNumber: '',
        heightCm: '',
        weightKg: '',
        goal: '',
        notes: '',
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const fetchAvailableUsers = async () => {
    setLoadingAvailableUsers(true);
    try {
      const params: any = {
        limit: 100,
        skip: 0,
      };
      if (searchAvailableUsers) {
        params.search = searchAvailableUsers;
      }
      const response = await apiClient.get('/clients/available', { params });
      const users = response.data.success && response.data.data 
        ? response.data.data 
        : [];
      setAvailableUsers(users);
    } catch (error: any) {
      console.error('Error fetching available users:', error);
      toast.error('Erro ao carregar usuários disponíveis', {
        position: 'top-right',
        autoClose: 3000,
      });
    } finally {
      setLoadingAvailableUsers(false);
    }
  };

  useEffect(() => {
    if (addExistingModalOpen) {
      fetchAvailableUsers();
    }
  }, [addExistingModalOpen, searchAvailableUsers]);

  const handleAddExistingClient = async (userId: string) => {
    try {
      // First, try to find if client profile already exists
      const allClientsResponse = await apiClient.get('/clients', { params: { limit: 1000 } });
      const allClients = allClientsResponse.data.success && allClientsResponse.data.data 
        ? allClientsResponse.data.data 
        : [];
      
      let client = allClients.find((c: any) => {
        const cUserId = typeof c.userId === 'object' ? c.userId._id : c.userId;
        return cUserId === userId || cUserId?.toString() === userId;
      });

      if (client) {
        // Client profile exists, assign to trainer
        await apiClient.post(`/clients/${client._id}/assign`);
      } else {
        // Client profile doesn't exist, create it (backend will auto-assign trainer)
        await apiClient.post('/clients', { userId });
      }

      // Refresh the clients list
      await fetchClients();
      setAddExistingModalOpen(false);
      setSearchAvailableUsers('');
      toast.success('Cliente adicionado com sucesso!', {
        position: 'top-right',
        autoClose: 3000,
      });
    } catch (error: any) {
      console.error('Error adding existing client:', error);
      const errorMessage = 
        error.response?.data?.meta?.error ||
        error.response?.data?.error ||
        error.response?.data?.message ||
        error.message ||
        'Erro ao adicionar cliente. Por favor, tente novamente.';
      toast.error(errorMessage, {
        position: 'top-right',
        autoClose: 5000,
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // First, create the user
      const userData: any = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName || undefined,
        lastName: formData.lastName || undefined,
        phone: formData.phone || undefined,
        address: formData.address || undefined,
        country: formData.country || undefined,
        taxNumber: formData.taxNumber ? parseInt(formData.taxNumber) : undefined,
        role: {
          name: 'client',
          scope: ['client'],
        },
      };

      const userResponse = await apiClient.post('/users', userData);

      // The API returns { message: 'User saved', user: {...} }
      const userId = userResponse.data?.user?._id || userResponse.data?._id;
      
      if (!userId) {
        throw new Error('Failed to create user: No user ID returned');
      }

      // Then, create the client profile
      // The backend will automatically assign trainerId if the logged in user is a trainer
      const clientData: any = {
        userId: userId,
        goal: formData.goal || undefined,
        notes: formData.notes || undefined,
      };

      if (formData.heightCm) {
        clientData.heightCm = parseFloat(formData.heightCm);
      }
      if (formData.weightKg) {
        clientData.weightKg = parseFloat(formData.weightKg);
      }

      await apiClient.post('/clients', clientData);

      // Refresh the clients list
      await fetchClients();
      toggleModal();
      toast.success('Cliente criado com sucesso!', {
        position: 'top-right',
        autoClose: 3000,
      });
    } catch (error: any) {
      console.error('Error creating client:', error);
      const errorMessage = 
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Erro ao criar cliente. Por favor, tente novamente.';
      toast.error(errorMessage, {
        position: 'top-right',
        autoClose: 5000,
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleValidateClient = async (clientId: string) => {
    try {
      await apiClient.post(`/clients/${clientId}/validate`);
      fetchClients();
      toast.success('Cliente validado com sucesso!', {
        position: 'top-right',
        autoClose: 3000,
      });
    } catch (error: any) {
      console.error('Error validating client:', error);
      const errorMessage = 
        error.response?.data?.error ||
        error.response?.data?.message ||
        'Erro ao validar cliente. Por favor, tente novamente.';
      toast.error(errorMessage, {
        position: 'top-right',
        autoClose: 5000,
      });
    }
  };

  if (loading && clients.length === 0) {
    return (
      <Container className={styles.container}>
        <div className={styles.loadingContainer}>
          <Spinner color="primary" />
        </div>
      </Container>
    );
  }

  return (
    <Container className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>My Clients</h1>
        <Button className={styles.addButton} onClick={toggleModal}>
          <span>+</span> Create New Client
        </Button>
      </div>

      <Row className="mb-3 mt-3">
            <Col md={6}>
              <SearchBar
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder="Search by name or email"
                onClear={() => setSearchTerm('')}
              />
            </Col>
            <Col md={6} className="d-flex justify-content-end">
              <SortSelector
                value={sortBy}
                onChange={setSortBy}
                options={sortOptions}
                label="Sort by:"
              />
            </Col>
          </Row>

          {loading && clients.length === 0 ? (
            <div className={styles.loadingContainer}>
              <Spinner color="primary" />
            </div>
          ) : paginatedClients.length === 0 && allClients.length === 0 ? (
            <div className={styles.emptyState}>
              <p>No clients assigned yet.</p>
            </div>
          ) : paginatedClients.length === 0 ? (
            <div className={styles.emptyState}>
              <p>No clients found matching your search criteria.</p>
            </div>
          ) : (
            <>
              <div className={styles.card}>
                <div className={styles.tableWrapper}>
                  <Table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Goal</th>
                        <th>Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedClients.map((client) => (
                      <tr key={client._id}>
                        <td className={styles.nameCell}>{client.userId?.name || 'N/A'}</td>
                        <td className={styles.emailCell}>{client.userId?.email || 'N/A'}</td>
                        <td>{client.goal || '-'}</td>
                        <td>
                          {client.isValidated ? (
                            <span className={styles.badgeSuccess}>Validated</span>
                          ) : (
                            <span className={styles.badgeWarning}>Pending</span>
                          )}
                        </td>
                        <td className={styles.actionsCell}>
                          {!client.isValidated && (
                            <button
                              className={styles.validateButton}
                              onClick={() => handleValidateClient(client._id)}
                            >
                              Validate
                            </button>
                          )}
                          <button
                            className={styles.viewButton}
                            onClick={() => navigate(`/trainer/clients/${client._id}`)}
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              </div>

              {clients.length > 0 && (
                <PaginationComponent
                  currentPage={currentPage}
                  totalPages={totalPages}
                  pageSize={pageSize}
                  total={clients.length}
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

      <Modal isOpen={modalOpen} toggle={toggleModal} size="lg" className={styles.modal}>
        <ModalHeader toggle={toggleModal}>Add New Client</ModalHeader>
        <Form onSubmit={handleSubmit}>
          <ModalBody>
            <div className={styles.formGroup}>
              <Label for="name">Name *</Label>
              <Input
                type="text"
                name="name"
                id="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                placeholder="Username"
              />
            </div>
            <div className={styles.formGroup}>
              <Label for="email">Email *</Label>
              <Input
                type="email"
                name="email"
                id="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                placeholder="client@example.com"
              />
            </div>
            <div className={styles.formGroup}>
              <Label for="password">Password *</Label>
              <Input
                type="password"
                name="password"
                id="password"
                value={formData.password}
                onChange={handleInputChange}
                required
                minLength={6}
                placeholder="Minimum 6 characters"
              />
            </div>
            <Row>
              <Col md={6}>
                <div className={styles.formGroup}>
                  <Label for="firstName">First Name</Label>
                  <Input
                    type="text"
                    name="firstName"
                    id="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    placeholder="First name"
                  />
                </div>
              </Col>
              <Col md={6}>
                <div className={styles.formGroup}>
                  <Label for="lastName">Last Name</Label>
                  <Input
                    type="text"
                    name="lastName"
                    id="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    placeholder="Last name"
                  />
                </div>
              </Col>
            </Row>
            <div className={styles.formGroup}>
              <Label for="phone">Phone</Label>
              <Input
                type="tel"
                name="phone"
                id="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="Phone number"
              />
            </div>
            <Row>
              <Col md={6}>
                <div className={styles.formGroup}>
                  <Label for="address">Address</Label>
                  <Input
                    type="text"
                    name="address"
                    id="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="Address"
                  />
                </div>
              </Col>
              <Col md={6}>
                <div className={styles.formGroup}>
                  <Label for="country">Country</Label>
                  <Input
                    type="text"
                    name="country"
                    id="country"
                    value={formData.country}
                    onChange={handleInputChange}
                    placeholder="Country"
                  />
                </div>
              </Col>
            </Row>
            <div className={styles.formGroup}>
              <Label for="taxNumber">Tax Number</Label>
              <Input
                type="number"
                name="taxNumber"
                id="taxNumber"
                value={formData.taxNumber}
                onChange={handleInputChange}
                placeholder="Tax number"
              />
            </div>
            <Row>
              <Col md={6}>
                <div className={styles.formGroup}>
                  <Label for="heightCm">Height (cm)</Label>
                  <Input
                    type="number"
                    name="heightCm"
                    id="heightCm"
                    value={formData.heightCm}
                    onChange={handleInputChange}
                    placeholder="Height in cm"
                    min="0"
                  />
                </div>
              </Col>
              <Col md={6}>
                <div className={styles.formGroup}>
                  <Label for="weightKg">Weight (kg)</Label>
                  <Input
                    type="number"
                    name="weightKg"
                    id="weightKg"
                    value={formData.weightKg}
                    onChange={handleInputChange}
                    placeholder="Weight in kg"
                    min="0"
                  />
                </div>
              </Col>
            </Row>
            <div className={styles.formGroup}>
              <Label for="goal">Goal</Label>
              <Input
                type="text"
                name="goal"
                id="goal"
                value={formData.goal}
                onChange={handleInputChange}
                placeholder="Main goal (e.g., Lose weight, Gain muscle)"
              />
            </div>
            <div className={styles.formGroup}>
              <Label for="notes">Notes</Label>
              <Input
                type="textarea"
                name="notes"
                id="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={3}
                placeholder="Additional notes about the client"
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button className={styles.modalButtonSecondary} onClick={toggleModal} disabled={submitting}>
              Cancel
            </Button>
            <Button className={styles.modalButtonPrimary} type="submit" disabled={submitting}>
              {submitting ? 'Creating...' : 'Create Client'}
            </Button>
          </ModalFooter>
        </Form>
      </Modal>

      {/* Modal to add existing client */}
      <Modal isOpen={addExistingModalOpen} toggle={() => setAddExistingModalOpen(false)} size="lg" className={styles.modal}>
        <ModalHeader toggle={() => setAddExistingModalOpen(false)}>
          Add Existing Client
        </ModalHeader>
        <ModalBody>
          <div className={styles.formGroup}>
            <Label for="searchUsers">Search by name or email</Label>
            <Input
              type="text"
              id="searchUsers"
              value={searchAvailableUsers}
              onChange={(e) => setSearchAvailableUsers(e.target.value)}
              placeholder="Type to search..."
            />
          </div>

          {loadingAvailableUsers ? (
            <div className={styles.loadingContainer}>
              <Spinner color="primary" />
            </div>
          ) : availableUsers.length === 0 ? (
            <div className={styles.emptyState}>
              <p>
                {searchAvailableUsers 
                  ? 'No available clients found with this search.'
                  : 'No available clients (without trainer).'}
              </p>
            </div>
          ) : (
            <div className={styles.card}>
              <div className={styles.tableWrapper}>
                <Table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {availableUsers.map((user) => (
                      <tr key={user._id}>
                        <td className={styles.nameCell}>{user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'N/A'}</td>
                        <td className={styles.emailCell}>{user.email || 'N/A'}</td>
                        <td className={styles.actionsCell}>
                          <button
                            className={styles.addButtonSmall}
                            onClick={() => handleAddExistingClient(user._id)}
                          >
                            Add
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          <Button className={styles.modalButtonSecondary} onClick={() => {
            setAddExistingModalOpen(false);
            setSearchAvailableUsers('');
          }}>
            Fechar
          </Button>
        </ModalFooter>
      </Modal>
    </Container>
  );
};

export default TrainerClients;

