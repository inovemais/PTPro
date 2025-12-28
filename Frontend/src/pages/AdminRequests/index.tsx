import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Table, Button, Badge, Spinner } from 'reactstrap';
import apiClient from '../../lib/axios';
import styles from './styles.module.scss';

interface ChangeRequest {
  _id: string;
  clientId: {
    _id: string;
    userId: {
      name: string;
      email: string;
    };
  };
  currentTrainerId: {
    _id: string;
    userId: {
      name: string;
    };
  };
  requestedTrainerId: {
    _id: string;
    userId: {
      name: string;
    };
  };
  reason?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

const AdminRequests: React.FC = () => {
  const [requests, setRequests] = useState<ChangeRequest[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/change-requests');
      if (response.data.success) {
        setRequests(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching requests:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleApprove = async (requestId: string) => {
    try {
      await apiClient.put(`/change-requests/${requestId}/approve`);
      fetchRequests();
    } catch (error) {
      console.error('Error approving request:', error);
    }
  };

  const handleReject = async (requestId: string) => {
    try {
      await apiClient.put(`/change-requests/${requestId}/reject`);
      fetchRequests();
    } catch (error) {
      console.error('Error rejecting request:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge color="success">Approved</Badge>;
      case 'rejected':
        return <Badge color="danger">Rejected</Badge>;
      default:
        return <Badge color="warning">Pending</Badge>;
    }
  };

  if (loading && requests.length === 0) {
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
          <h2>Trainer Change Requests</h2>
          <Table striped hover>
            <thead>
              <tr>
                <th>Client</th>
                <th>Current Trainer</th>
                <th>Requested Trainer</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {requests.map((request) => (
                <tr key={request._id}>
                  <td>{request.clientId?.userId?.name || 'N/A'}</td>
                  <td>{request.currentTrainerId?.userId?.name || 'N/A'}</td>
                  <td>{request.requestedTrainerId?.userId?.name || 'N/A'}</td>
                  <td>{request.reason || '-'}</td>
                  <td>{getStatusBadge(request.status)}</td>
                  <td>
                    {request.status === 'pending' && (
                      <>
                        <Button
                          size="sm"
                          color="success"
                          onClick={() => handleApprove(request._id)}
                          className="me-2"
                        >
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          color="danger"
                          onClick={() => handleReject(request._id)}
                        >
                          Reject
                        </Button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Col>
      </Row>
    </Container>
  );
};

export default AdminRequests;

