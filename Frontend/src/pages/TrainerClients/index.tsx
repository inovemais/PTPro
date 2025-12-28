import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Row, Col, Table, Button, Spinner, Modal, ModalHeader, ModalBody, ModalFooter, Form, Label, Input } from 'reactstrap';
import apiClient from '../../lib/axios';
import styles from './styles.module.scss';

interface Client {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
  };
  goal?: string;
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
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
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
      
      // Handle both response formats:
      // Legacy format: { auth: true, clients: [...], pagination: {...} }
      // New format: { success: true, data: [...], meta: { pagination: {...} } }
      let clientsList = [];
      
      if (response.data.success && response.data.data) {
        // New format
        clientsList = response.data.data || [];
      } else if (response.data.clients) {
        // Legacy format
        clientsList = response.data.clients || [];
      }
      
      setClients(clientsList);
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

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
    } catch (error: any) {
      console.error('Error creating client:', error);
      alert(
        error.response?.data?.error ||
          error.response?.data?.message ||
          'Error creating client. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && clients.length === 0) {
    return (
      <Container>
        <Spinner>Loading...</Spinner>
      </Container>
    );
  }

  return (
    <Container className={styles.container}>
      <Row>
        <Col>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2>My Clients</h2>
            <Button color="primary" onClick={toggleModal}>
              + Add Client
            </Button>
          </div>
          {clients.length === 0 ? (
            <p>No clients assigned yet.</p>
          ) : (
            <Table striped hover>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Goal</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((client) => (
                  <tr key={client._id}>
                    <td>{client.userId?.name || 'N/A'}</td>
                    <td>{client.userId?.email || 'N/A'}</td>
                    <td>{client.goal || '-'}</td>
                    <td>
                      <Button
                        size="sm"
                        color="primary"
                        onClick={() => navigate(`/trainer/clients/${client._id}`)}
                      >
                        View Details
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Col>
      </Row>

      <Modal isOpen={modalOpen} toggle={toggleModal} size="lg">
        <ModalHeader toggle={toggleModal}>Add New Client</ModalHeader>
        <Form onSubmit={handleSubmit}>
          <ModalBody>
            <div style={{ marginBottom: '1rem' }}>
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
            <div style={{ marginBottom: '1rem' }}>
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
            <div style={{ marginBottom: '1rem' }}>
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
                <div style={{ marginBottom: '1rem' }}>
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
                <div style={{ marginBottom: '1rem' }}>
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
            <div style={{ marginBottom: '1rem' }}>
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
                <div style={{ marginBottom: '1rem' }}>
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
                <div style={{ marginBottom: '1rem' }}>
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
            <div style={{ marginBottom: '1rem' }}>
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
                <div style={{ marginBottom: '1rem' }}>
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
                <div style={{ marginBottom: '1rem' }}>
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
            <div style={{ marginBottom: '1rem' }}>
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
            <div style={{ marginBottom: '1rem' }}>
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
            <Button color="secondary" onClick={toggleModal} disabled={submitting}>
              Cancel
            </Button>
            <Button color="primary" type="submit" disabled={submitting}>
              {submitting ? 'Creating...' : 'Create Client'}
            </Button>
          </ModalFooter>
        </Form>
      </Modal>
    </Container>
  );
};

export default TrainerClients;

