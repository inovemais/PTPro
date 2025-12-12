import { useEffect, useState, useCallback } from "react";
import { Container, Row, Col, Card, CardBody, CardTitle, Button, Badge, Alert } from "reactstrap";
import styles from "./styles.module.scss";

const MemberRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ show: false, message: "", type: "success" });

  const fetchRequests = useCallback(() => {
    fetch("/api/member-requests?limit=100&skip=0", {
      headers: { Accept: "application/json" },
      credentials: "include",
    })
      .then((res) => res.json())
      .then((response) => {
        if (response.auth && response.requests) {
          setRequests(response.requests);
        }
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleApprove = (requestId) => {
    fetch(`/api/member-requests/${requestId}/approve`, {
      headers: { "Content-Type": "application/json" },
      method: "PUT",
      credentials: "include",
    })
      .then((res) => {
        if (!res.ok) {
          return res.json().then((data) => {
            throw new Error(data.error || "Failed to approve request");
          });
        }
        return res.json();
      })
      .then(() => {
        setAlert({
          show: true,
          message: "Request approved successfully!",
          type: "success",
        });
        fetchRequests();
        setTimeout(() => setAlert({ ...alert, show: false }), 3000);
      })
      .catch((err) => {
        setAlert({
          show: true,
          message: err.message || "Error approving request",
          type: "danger",
        });
        setTimeout(() => setAlert({ ...alert, show: false }), 5000);
      });
  };

  const handleReject = (requestId) => {
    const reason = prompt("Enter reason for rejection (optional):");
    
    fetch(`/api/member-requests/${requestId}/reject`, {
      headers: { "Content-Type": "application/json" },
      method: "PUT",
      credentials: "include",
      body: JSON.stringify({ reason: reason || "No reason provided" }),
    })
      .then((res) => {
        if (!res.ok) {
          return res.json().then((data) => {
            throw new Error(data.error || "Failed to reject request");
          });
        }
        return res.json();
      })
      .then(() => {
        setAlert({
          show: true,
          message: "Request rejected successfully!",
          type: "success",
        });
        fetchRequests();
        setTimeout(() => setAlert({ ...alert, show: false }), 3000);
      })
      .catch((err) => {
        setAlert({
          show: true,
          message: err.message || "Error rejecting request",
          type: "danger",
        });
        setTimeout(() => setAlert({ ...alert, show: false }), 5000);
      });
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      pending: { color: "warning", text: "Pending" },
      approved: { color: "success", text: "Approved" },
      rejected: { color: "danger", text: "Rejected" },
    };
    const statusInfo = statusMap[status] || { color: "secondary", text: status };
    return <Badge color={statusInfo.color}>{statusInfo.text}</Badge>;
  };

  const pendingRequests = requests.filter((r) => r.status === "pending");
  const otherRequests = requests.filter((r) => r.status !== "pending");

  return (
    <Container>
      <Row>
        <Col>
          <h1>Member Requests</h1>
        </Col>
      </Row>

      {alert.show && (
        <Row>
          <Col>
            <Alert color={alert.type} toggle={() => setAlert({ ...alert, show: false })}>
              {alert.message}
            </Alert>
          </Col>
        </Row>
      )}

      <Row>
        <Col>
          <Card>
            <CardBody>
              <CardTitle tag="h3">
                Pending Requests ({pendingRequests.length})
              </CardTitle>
              {loading ? (
                <p>Loading requests...</p>
              ) : pendingRequests.length === 0 ? (
                <p>No pending requests.</p>
              ) : (
                <div className={styles.requestsList}>
                  {pendingRequests.map((request) => (
                    <Card key={request._id} className={styles.requestCard}>
                      <CardBody>
                        <Row>
                          <Col md={8}>
                            <h5>
                              {request.userId && request.userId.name
                                ? request.userId.name
                                : "Unknown User"}
                            </h5>
                            <p className="text-muted">
                              {request.userId && request.userId.email
                                ? request.userId.email
                                : ""}
                            </p>
                            <p>
                              <small>
                                Requested on:{" "}
                                {new Date(request.requestDate).toLocaleDateString()}
                              </small>
                            </p>
                            <div>{getStatusBadge(request.status)}</div>
                          </Col>
                          <Col md={4} className={styles.actions}>
                            <Button
                              color="success"
                              onClick={() => handleApprove(request._id)}
                              className={styles.button}
                            >
                              Approve
                            </Button>
                            <Button
                              color="danger"
                              onClick={() => handleReject(request._id)}
                              className={styles.button}
                            >
                              Reject
                            </Button>
                          </Col>
                        </Row>
                      </CardBody>
                    </Card>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        </Col>
      </Row>

      {otherRequests.length > 0 && (
        <Row className={styles.section}>
          <Col>
            <Card>
              <CardBody>
                <CardTitle tag="h3">Processed Requests</CardTitle>
                <div className={styles.requestsList}>
                  {otherRequests.map((request) => (
                    <Card key={request._id} className={styles.requestCard}>
                      <CardBody>
                        <Row>
                          <Col md={10}>
                            <h5>
                              {request.userId && request.userId.name
                                ? request.userId.name
                                : "Unknown User"}
                            </h5>
                            <p className="text-muted">
                              {request.userId && request.userId.email
                                ? request.userId.email
                                : ""}
                            </p>
                            <p>
                              <small>
                                Requested:{" "}
                                {new Date(request.requestDate).toLocaleDateString()}
                              </small>
                            </p>
                            {request.responseDate && (
                              <p>
                                <small>
                                  Processed:{" "}
                                  {new Date(request.responseDate).toLocaleDateString()}
                                </small>
                              </p>
                            )}
                            {request.adminId && request.adminId.name && (
                              <p>
                                <small>
                                  Processed by: {request.adminId.name}
                                </small>
                              </p>
                            )}
                            {request.reason && (
                              <p className="text-danger">
                                <small>
                                  <strong>Reason:</strong> {request.reason}
                                </small>
                              </p>
                            )}
                            <div>{getStatusBadge(request.status)}</div>
                          </Col>
                        </Row>
                      </CardBody>
                    </Card>
                  ))}
                </div>
              </CardBody>
            </Card>
          </Col>
        </Row>
      )}
    </Container>
  );
};

export default MemberRequests;

