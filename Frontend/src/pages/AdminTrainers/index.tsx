import React, { useEffect, useState } from 'react';
import { Row, Col, Table, Button, Spinner, Modal, ModalHeader, ModalBody, ModalFooter, Form, Label, Input } from 'reactstrap';
import apiClient from '../../lib/axios';
import styles from './styles.module.scss';

interface Trainer {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
  };
  bio?: string;
  specialties?: string[];
  isValidated: boolean;
  isActive?: boolean;
  phone?: string;
  createdAt: string;
}

interface TrainerFormData {
  name: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  bio?: string;
  specialties?: string;
}

const AdminTrainers: React.FC = () => {
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingTrainer, setEditingTrainer] = useState<Trainer | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<TrainerFormData>({
    name: '',
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    bio: '',
    specialties: '',
  });
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  const fetchTrainers = async (page = 1) => {
    setLoading(true);
    try {
      const skip = (page - 1) * pagination.pageSize;
      const response = await apiClient.get('/trainers', {
        params: { limit: pagination.pageSize, skip },
      });

      console.log('Trainers API response:', response.data);

      // Handle both response formats:
      // Legacy format: { auth: true, trainers: [...], pagination: {...} }
      // New format: { success: true, data: [...], meta: { pagination: {...} } }
      let trainersList = [];
      let total = 0;

      if (response.data.success && response.data.data) {
        // New format
        trainersList = response.data.data || [];
        total = response.data.meta?.pagination?.total || 0;
      } else if (response.data.trainers) {
        // Legacy format
        trainersList = response.data.trainers || [];
        total = response.data.pagination?.total || trainersList.length;
      }

      console.log('Parsed trainers list:', trainersList);
      console.log('Total trainers:', total);

      setTrainers(trainersList);
      setPagination({
        ...pagination,
        current: page,
        total: total,
      });
    } catch (error: any) {
      console.error('Error fetching trainers:', error);
      console.error('Error response:', error.response?.data);
      alert('Error loading trainers. Please check the console for details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrainers(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleValidate = async (trainerId: string) => {
    try {
      await apiClient.put(`/trainers/${trainerId}`, { isValidated: true });
      fetchTrainers(pagination.current);
    } catch (error) {
      console.error('Error validating trainer:', error);
      alert('Error validating trainer. Please try again.');
    }
  };

  const handleToggleActive = async (trainerId: string, currentStatus: boolean) => {
    try {
      await apiClient.put(`/trainers/${trainerId}`, { isActive: !currentStatus });
      fetchTrainers(pagination.current);
    } catch (error) {
      console.error('Error toggling trainer status:', error);
      alert('Error updating trainer status. Please try again.');
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTrainer) return;

    setSubmitting(true);

    try {
      // Update trainer profile
      const trainerData: any = {
        bio: formData.bio || undefined,
        specialties: formData.specialties
          ? formData.specialties.split(',').map((s) => s.trim())
          : undefined,
        phone: formData.phone || undefined,
      };

      await apiClient.put(`/trainers/${editingTrainer._id}`, trainerData);

      // Update user data if changed
      const userUpdateData: any = {};
      if (formData.firstName !== editingTrainer.userId?.firstName) {
        userUpdateData.firstName = formData.firstName || undefined;
      }
      if (formData.lastName !== editingTrainer.userId?.lastName) {
        userUpdateData.lastName = formData.lastName || undefined;
      }
      if (formData.email !== editingTrainer.userId?.email) {
        userUpdateData.email = formData.email;
      }
      if (formData.name !== editingTrainer.userId?.name) {
        userUpdateData.name = formData.name;
      }
      if (formData.password) {
        userUpdateData.password = formData.password;
      }

      if (Object.keys(userUpdateData).length > 0) {
        await apiClient.put(`/users/${editingTrainer.userId._id}`, userUpdateData);
      }

      // Refresh the trainers list
      await fetchTrainers(pagination.current);
      toggleEditModal();
    } catch (error: any) {
      console.error('Error updating trainer:', error);
      alert(
        error.response?.data?.error ||
          error.response?.data?.message ||
          'Error updating trainer. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
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
        bio: '',
        specialties: '',
      });
    }
  };

  const toggleEditModal = async (trainer?: Trainer) => {
    if (trainer) {
      try {
        // Fetch full trainer data to ensure we have all fields
        const response = await apiClient.get(`/trainers/${trainer._id}`);
        // Handle both response formats
        const fullTrainer = response.data.success ? response.data.data : response.data;
        
        setEditingTrainer(fullTrainer);
        // Load trainer data into form
        setFormData({
          name: fullTrainer.userId?.name || '',
          email: fullTrainer.userId?.email || '',
          password: '', // Don't pre-fill password
          firstName: fullTrainer.userId?.firstName || '',
          lastName: fullTrainer.userId?.lastName || '',
          phone: fullTrainer.phone || fullTrainer.userId?.phone || '',
          bio: fullTrainer.bio || '',
          specialties: fullTrainer.specialties?.join(', ') || '',
        });
      } catch (error) {
        console.error('Error fetching trainer data:', error);
        // Fallback to using the trainer data we already have
        setEditingTrainer(trainer);
        setFormData({
          name: trainer.userId?.name || '',
          email: trainer.userId?.email || '',
          password: '',
          firstName: trainer.userId?.firstName || '',
          lastName: trainer.userId?.lastName || '',
          phone: trainer.phone || trainer.userId?.phone || '',
          bio: trainer.bio || '',
          specialties: trainer.specialties?.join(', ') || '',
        });
      }
    } else {
      setEditingTrainer(null);
      setFormData({
        name: '',
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        phone: '',
        bio: '',
        specialties: '',
      });
    }
    setEditModalOpen(!editModalOpen);
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
      const userData = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName || undefined,
        lastName: formData.lastName || undefined,
        phone: formData.phone || undefined,
        role: {
          name: 'PersonalTrainer',
          scope: ['PersonalTrainer'],
        },
      };

      const userResponse = await apiClient.post('/users', userData);

      // The API returns { message: 'User saved', user: {...} }
      const userId = userResponse.data?.user?._id || userResponse.data?._id;
      
      if (!userId) {
        throw new Error('Failed to create user: No user ID returned');
      }

      // Then, create the trainer profile
      const trainerData = {
        userId: userId,
        bio: formData.bio || undefined,
        specialties: formData.specialties
          ? formData.specialties.split(',').map((s) => s.trim())
          : undefined,
        phone: formData.phone || undefined,
        isValidated: true, // Auto-validate when created by admin
      };

      await apiClient.post('/trainers', trainerData);

      // Refresh the trainers list
      await fetchTrainers(pagination.current);
      toggleModal();
    } catch (error: any) {
      console.error('Error creating trainer:', error);
      alert(
        error.response?.data?.error ||
          error.response?.data?.message ||
          'Error creating trainer. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && trainers.length === 0) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingContainer}>
          <Spinner color="primary" />
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Trainers Management</h1>
        <Button className={styles.addButton} onClick={toggleModal}>
          <span>+</span> Add Trainer
        </Button>
      </div>

      {trainers.length === 0 && !loading ? (
        <div className={styles.emptyState}>
          <p>No trainers found. Click "Add Trainer" to create a new trainer.</p>
        </div>
      ) : (
        <div className={styles.card}>
          <div className={styles.tableWrapper}>
            <Table className={styles.table}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Validation</th>
                  <th>Active</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {trainers.map((trainer) => (
                  <tr key={trainer._id}>
                    <td className={styles.nameCell}>{trainer.userId?.name || 'N/A'}</td>
                    <td className={styles.emailCell}>{trainer.userId?.email || 'N/A'}</td>
                    <td>
                      {trainer.isValidated ? (
                        <span className={styles.badgeSuccess}>Validated</span>
                      ) : (
                        <span className={styles.badgeWarning}>Pending</span>
                      )}
                    </td>
                    <td>
                      {trainer.isActive !== false ? (
                        <span className={styles.badgeSuccess}>Active</span>
                      ) : (
                        <span className={styles.badgeSecondary}>Inactive</span>
                      )}
                    </td>
                    <td className={styles.actionsCell}>
                      {!trainer.isValidated && (
                        <button
                          className={styles.validateButton}
                          onClick={() => handleValidate(trainer._id)}
                        >
                          Validate
                        </button>
                      )}
                      <button
                        className={styles.editButton}
                        onClick={() => toggleEditModal(trainer)}
                      >
                        Edit
                      </button>
                      <button
                        className={trainer.isActive !== false ? styles.deactivateButton : styles.activateButton}
                        onClick={() => handleToggleActive(trainer._id, trainer.isActive !== false)}
                      >
                        {trainer.isActive !== false ? "Deactivate" : "Activate"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </div>
      )}

      <Modal isOpen={modalOpen} toggle={toggleModal} size="lg" className={styles.modal}>
        <ModalHeader toggle={toggleModal}>Add New Trainer</ModalHeader>
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
                placeholder="trainer@example.com"
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
            <div className={styles.formGroup}>
              <Label for="bio">Bio</Label>
              <Input
                type="textarea"
                name="bio"
                id="bio"
                value={formData.bio}
                onChange={handleInputChange}
                rows={3}
                placeholder="Trainer biography"
              />
            </div>
            <div className={styles.formGroup}>
              <Label for="specialties">Specialties</Label>
              <Input
                type="text"
                name="specialties"
                id="specialties"
                value={formData.specialties}
                onChange={handleInputChange}
                placeholder="Comma-separated specialties (e.g., Strength, Cardio, Yoga)"
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button className={styles.modalButtonSecondary} onClick={toggleModal} disabled={submitting}>
              Cancel
            </Button>
            <Button className={styles.modalButtonPrimary} type="submit" disabled={submitting}>
              {submitting ? 'Creating...' : 'Create Trainer'}
            </Button>
          </ModalFooter>
        </Form>
      </Modal>

      <Modal isOpen={editModalOpen} toggle={toggleEditModal} size="lg" className={styles.modal}>
        <ModalHeader toggle={toggleEditModal}>Edit Trainer</ModalHeader>
        <Form onSubmit={handleEdit}>
          <ModalBody>
            <div className={styles.formGroup}>
              <Label for="edit-name">Name *</Label>
              <Input
                type="text"
                name="name"
                id="edit-name"
                value={formData.name}
                onChange={handleInputChange}
                required
                placeholder="Username"
              />
            </div>
            <div className={styles.formGroup}>
              <Label for="edit-email">Email *</Label>
              <Input
                type="email"
                name="email"
                id="edit-email"
                value={formData.email}
                onChange={handleInputChange}
                required
                placeholder="trainer@example.com"
              />
            </div>
            <div className={styles.formGroup}>
              <Label for="edit-password">Password</Label>
              <Input
                type="password"
                name="password"
                id="edit-password"
                value={formData.password}
                onChange={handleInputChange}
                minLength={6}
                placeholder="Leave blank to keep current password"
              />
            </div>
            <Row>
              <Col md={6}>
                <div className={styles.formGroup}>
                  <Label for="edit-firstName">First Name</Label>
                  <Input
                    type="text"
                    name="firstName"
                    id="edit-firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    placeholder="First name"
                  />
                </div>
              </Col>
              <Col md={6}>
                <div className={styles.formGroup}>
                  <Label for="edit-lastName">Last Name</Label>
                  <Input
                    type="text"
                    name="lastName"
                    id="edit-lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    placeholder="Last name"
                  />
                </div>
              </Col>
            </Row>
            <div className={styles.formGroup}>
              <Label for="edit-phone">Phone</Label>
              <Input
                type="tel"
                name="phone"
                id="edit-phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="Phone number"
              />
            </div>
            <div className={styles.formGroup}>
              <Label for="edit-bio">Bio</Label>
              <Input
                type="textarea"
                name="bio"
                id="edit-bio"
                value={formData.bio}
                onChange={handleInputChange}
                rows={3}
                placeholder="Trainer biography"
              />
            </div>
            <div className={styles.formGroup}>
              <Label for="edit-specialties">Specialties</Label>
              <Input
                type="text"
                name="specialties"
                id="edit-specialties"
                value={formData.specialties}
                onChange={handleInputChange}
                placeholder="Comma-separated specialties (e.g., Strength, Cardio, Yoga)"
              />
            </div>
          </ModalBody>
          <ModalFooter>
            <Button className={styles.modalButtonSecondary} onClick={toggleEditModal} disabled={submitting}>
              Cancel
            </Button>
            <Button className={styles.modalButtonPrimary} type="submit" disabled={submitting}>
              {submitting ? 'Updating...' : 'Update Trainer'}
            </Button>
          </ModalFooter>
        </Form>
      </Modal>
    </div>
  );
};

export default AdminTrainers;

