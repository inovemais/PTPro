import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, CardBody, CardTitle, Form, FormGroup, Label, Input, Button, Alert, Spinner } from 'reactstrap';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import apiClient from '../../lib/axios';
import { useAuth } from '../../context/AuthContext';
import scopes from '../../data/users/scopes';
import styles from './styles.module.scss';

interface ChangePasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

interface ClientData {
  _id: string;
  heightCm?: number;
  weightKg?: number;
  goal?: string;
  notes?: string;
  userId?: {
    _id: string;
    name: string;
    email: string;
  };
}

interface ClientFormData {
  heightCm: string;
  weightKg: string;
  goal: string;
  notes: string;
}

const Profile: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [clientData, setClientData] = useState<ClientData | null>(null);
  const [clientLoading, setClientLoading] = useState(false);
  const [clientFormData, setClientFormData] = useState<ClientFormData>({
    heightCm: '',
    weightKg: '',
    goal: '',
    notes: '',
  });
  const [clientSuccessMessage, setClientSuccessMessage] = useState('');
  const [clientErrorMessage, setClientErrorMessage] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
  } = useForm<ChangePasswordFormData>();

  const newPassword = watch('newPassword');

  useEffect(() => {
    fetchQRCode();
    fetchClientData();
  }, []);

  const fetchClientData = async () => {
    // Only fetch client data if user has Client scope
    if (!user?.role?.scope?.includes(scopes.Client)) {
      setClientLoading(false);
      return;
    }

    setClientLoading(true);
    try {
      const response = await apiClient.get('/clients/me');
      const data = response.data.success ? response.data.data : response.data;
      setClientData(data);
      setClientFormData({
        heightCm: data.heightCm?.toString() || '',
        weightKg: data.weightKg?.toString() || '',
        goal: data.goal || '',
        notes: data.notes || '',
      });
    } catch (error: any) {
      console.error('Error fetching client data:', error);
      // Only show error if it's not a 403 (Forbidden) - which is expected for non-client users
      if (error.response?.status !== 403) {
        toast.error('Erro ao carregar dados do perfil', {
          position: 'top-right',
          autoClose: 3000,
        });
      }
    } finally {
      setClientLoading(false);
    }
  };

  const fetchQRCode = async () => {
    if (!user?.id) return;
    
    setQrLoading(true);
    try {
      const response = await apiClient.get('/auth/qr-code');
      if (response.data.qrCode) {
        setQrCode(response.data.qrCode);
      }
    } catch (error: any) {
      console.error('Error fetching QR code:', error);
      toast.error('Failed to load QR code', {
        position: 'top-right',
        autoClose: 3000,
      });
    } finally {
      setQrLoading(false);
    }
  };

  const onSubmit = async (data: ChangePasswordFormData) => {
    // Clear previous messages
    setSuccessMessage('');
    setErrorMessage('');

    // Validate that new password and confirm password match
    if (data.newPassword !== data.confirmPassword) {
      setErrorMessage('New password and confirm password do not match');
      return;
    }

    // Validate password length
    if (data.newPassword.length < 6) {
      setErrorMessage('New password must be at least 6 characters long');
      return;
    }

    setLoading(true);

    try {
      const response = await apiClient.put('/users/change-password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      });

      if (response.data.message) {
        setSuccessMessage('Password changed successfully!');
        toast.success('Password changed successfully!', {
          position: 'top-right',
          autoClose: 3000,
        });
        reset();
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || error.message || 'Failed to change password';
      setErrorMessage(errorMsg);
      toast.error(errorMsg, {
        position: 'top-right',
        autoClose: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClientInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setClientFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleClientSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setClientSuccessMessage('');
    setClientErrorMessage('');

    setClientLoading(true);

    try {
      const updateData: any = {};
      
      if (clientFormData.heightCm) {
        updateData.heightCm = parseFloat(clientFormData.heightCm);
      }
      if (clientFormData.weightKg) {
        updateData.weightKg = parseFloat(clientFormData.weightKg);
      }
      if (clientFormData.goal !== undefined) {
        updateData.goal = clientFormData.goal || undefined;
      }
      if (clientFormData.notes !== undefined) {
        updateData.notes = clientFormData.notes || undefined;
      }

      const response = await apiClient.put('/clients/me', updateData);
      const updatedData = response.data.success ? response.data.data : response.data;
      setClientData(updatedData);
      
      setClientSuccessMessage('Profile updated successfully!');
      toast.success('Profile updated successfully!', {
        position: 'top-right',
        autoClose: 3000,
      });
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to update profile';
      setClientErrorMessage(errorMsg);
      toast.error(errorMsg, {
        position: 'top-right',
        autoClose: 5000,
      });
    } finally {
      setClientLoading(false);
    }
  };

  return (
    <Container className={styles.container}>
      <Row>
        <Col>
          <h2>My Profile</h2>
        </Col>
      </Row>

      {/* QR Code Section */}
      <Row className="mt-4">
        <Col md={{ size: 8, offset: 2 }}>
          <Card>
            <CardBody>
              <CardTitle tag="h4">Login QR Code</CardTitle>
              <p className="text-muted">
                Use this QR code to quickly login from another device. Scan it with the QR Code Login feature.
              </p>
              
              {qrLoading ? (
                <div className="text-center py-4">
                  <Spinner>Loading QR Code...</Spinner>
                </div>
              ) : qrCode ? (
                <div className="text-center py-4">
                  <div className={styles.qrCodeContainer}>
                    <img 
                      src={qrCode} 
                      alt="Your Login QR Code" 
                      className={styles.qrCodeImage}
                    />
                  </div>
                  <Button 
                    color="secondary" 
                    size="sm" 
                    onClick={fetchQRCode}
                    className="mt-3"
                  >
                    Refresh QR Code
                  </Button>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-muted">Unable to load QR code</p>
                  <Button 
                    color="primary" 
                    size="sm" 
                    onClick={fetchQRCode}
                  >
                    Try Again
                  </Button>
                </div>
              )}
            </CardBody>
          </Card>
        </Col>
      </Row>

      {/* Client Profile Section - Only show if user is a client */}
      {user?.role?.scope?.includes(scopes.Client) && (
        <Row className="mt-4">
          <Col md={{ size: 8, offset: 2 }}>
            <Card>
              <CardBody>
                <CardTitle tag="h4">My Profile Information</CardTitle>

                {clientSuccessMessage && (
                  <Alert color="success" className="mt-3">
                    {clientSuccessMessage}
                  </Alert>
                )}

                {clientErrorMessage && (
                  <Alert color="danger" className="mt-3">
                    {clientErrorMessage}
                  </Alert>
                )}

                {clientLoading && !clientData ? (
                  <div className="text-center py-4">
                    <Spinner>Loading profile...</Spinner>
                  </div>
                ) : (
                  <Form onSubmit={handleClientSubmit} className="mt-4">
                    <Row>
                      <Col md={6}>
                        <FormGroup>
                          <Label for="heightCm">Height (cm)</Label>
                          <Input
                            type="number"
                            id="heightCm"
                            name="heightCm"
                            value={clientFormData.heightCm}
                            onChange={handleClientInputChange}
                            placeholder="Height in cm"
                            min="0"
                          />
                        </FormGroup>
                      </Col>
                      <Col md={6}>
                        <FormGroup>
                          <Label for="weightKg">Weight (kg)</Label>
                          <Input
                            type="number"
                            id="weightKg"
                            name="weightKg"
                            value={clientFormData.weightKg}
                            onChange={handleClientInputChange}
                            placeholder="Weight in kg"
                            min="0"
                          />
                        </FormGroup>
                      </Col>
                    </Row>

                    <FormGroup>
                      <Label for="goal">Goal</Label>
                      <Input
                        type="text"
                        id="goal"
                        name="goal"
                        value={clientFormData.goal}
                        onChange={handleClientInputChange}
                        placeholder="Main goal (e.g., Lose weight, Gain muscle)"
                      />
                    </FormGroup>

                    <FormGroup>
                      <Label for="notes">Notes</Label>
                      <Input
                        type="textarea"
                        id="notes"
                        name="notes"
                        value={clientFormData.notes}
                        onChange={handleClientInputChange}
                        rows={3}
                        placeholder="Additional notes about yourself"
                      />
                    </FormGroup>

                    <Button
                      type="submit"
                      color="primary"
                      disabled={clientLoading}
                      className="mt-3"
                    >
                      {clientLoading ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </Form>
                )}
              </CardBody>
            </Card>
          </Col>
        </Row>
      )}

      {/* Change Password Section */}
      <Row className="mt-4">
        <Col md={{ size: 8, offset: 2 }}>
          <Card>
            <CardBody>
              <CardTitle tag="h4">Change Password</CardTitle>

              {successMessage && (
                <Alert color="success" className="mt-3">
                  {successMessage}
                </Alert>
              )}

              {errorMessage && (
                <Alert color="danger" className="mt-3">
                  {errorMessage}
                </Alert>
              )}

              <Form onSubmit={handleSubmit(onSubmit)} className="mt-4">
                <FormGroup>
                  <Label for="currentPassword">
                    Current Password <span className="text-danger">*</span>
                  </Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    {...register('currentPassword', {
                      required: 'Current password is required',
                    })}
                    invalid={!!errors.currentPassword}
                  />
                  {errors.currentPassword && (
                    <div className="text-danger small mt-1">{errors.currentPassword.message}</div>
                  )}
                </FormGroup>

                <FormGroup>
                  <Label for="newPassword">
                    New Password <span className="text-danger">*</span>
                  </Label>
                  <Input
                    id="newPassword"
                    type="password"
                    {...register('newPassword', {
                      required: 'New password is required',
                      minLength: {
                        value: 6,
                        message: 'New password must be at least 6 characters long',
                      },
                    })}
                    invalid={!!errors.newPassword}
                  />
                  {errors.newPassword && (
                    <div className="text-danger small mt-1">{errors.newPassword.message}</div>
                  )}
                </FormGroup>

                <FormGroup>
                  <Label for="confirmPassword">
                    Confirm New Password <span className="text-danger">*</span>
                  </Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    {...register('confirmPassword', {
                      required: 'Please confirm your new password',
                      validate: (value) =>
                        value === newPassword || 'Passwords do not match',
                    })}
                    invalid={!!errors.confirmPassword}
                  />
                  {errors.confirmPassword && (
                    <div className="text-danger small mt-1">{errors.confirmPassword.message}</div>
                  )}
                </FormGroup>

                <Button
                  type="submit"
                  color="primary"
                  disabled={loading}
                  className="mt-3"
                >
                  {loading ? 'Changing Password...' : 'Change Password'}
                </Button>
              </Form>
            </CardBody>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default Profile;

