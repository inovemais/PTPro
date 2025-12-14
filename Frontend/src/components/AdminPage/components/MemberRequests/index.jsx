import { useEffect, useState, useCallback } from "react";
import { Container, Row, Col, Card, CardBody, CardTitle, Button, Badge, Alert } from "reactstrap";
import { buildApiUrl } from "../../../../config/api";
import styles from "./styles.module.scss";

const MemberRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ show: false, message: "", type: "success" });

  const fetchRequests = useCallback(() => {
    const token = localStorage.getItem("token");
    const headers = { Accept: "application/json" };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    fetch(buildApiUrl("/api/member-requests?limit=100&skip=0"), {
      headers: headers,
      credentials: "include",
    })
      .then(async (response) => {
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP error! status: ${response.status}, body: ${errorText.substring(0, 200)}`);
        }
        
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          const text = await response.text();
          throw new Error(`Expected JSON but got ${contentType}. Response: ${text.substring(0, 100)}`);
        }
        
        const text = await response.text();
        if (!text || text.trim().length === 0) {
          throw new Error("Empty response from server");
        }
        
        try {
          return JSON.parse(text);
        } catch (jsonErr) {
          console.error("JSON parsing error in fetchRequests:", jsonErr);
          console.error("Response text:", text.substring(0, 500));
          throw new Error(`Invalid JSON response: ${jsonErr.message}`);
        }
      })
      .then((response) => {
        if (response.auth && response.requests) {
          setRequests(response.requests);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Erro ao carregar pedidos de membro:", err);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleApprove = (requestId) => {
    const token = localStorage.getItem("token");
    const headers = { "Content-Type": "application/json" };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    fetch(buildApiUrl(`/api/member-requests/${requestId}/approve`), {
      headers: headers,
      method: "PUT",
      credentials: "include",
    })
      .then(async (res) => {
        const contentType = res.headers.get("content-type");
        const text = await res.text();
        
        if (!res.ok) {
          let errorData;
          if (contentType && contentType.includes("application/json") && text) {
            try {
              errorData = JSON.parse(text);
            } catch {
              errorData = { error: text.substring(0, 200) || "Failed to approve request" };
            }
          } else {
            errorData = { error: text.substring(0, 200) || "Failed to approve request" };
          }
          throw new Error(errorData.error || "Failed to approve request");
        }
        
        if (!text || text.trim().length === 0) {
          return {};
        }
        
        if (contentType && contentType.includes("application/json")) {
          try {
            return JSON.parse(text);
          } catch (jsonErr) {
            console.error("JSON parsing error in handleApprove:", jsonErr);
            console.error("Response text:", text.substring(0, 500));
            throw new Error(`Invalid JSON response: ${jsonErr.message}`);
          }
        }
        
        return {};
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
    
    const token = localStorage.getItem("token");
    const headers = { "Content-Type": "application/json" };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    fetch(buildApiUrl(`/api/member-requests/${requestId}/reject`), {
      headers: headers,
      method: "PUT",
      credentials: "include",
      body: JSON.stringify({ reason: reason || "No reason provided" }),
    })
      .then(async (res) => {
        const contentType = res.headers.get("content-type");
        const text = await res.text();
        
        if (!res.ok) {
          let errorData;
          if (contentType && contentType.includes("application/json") && text) {
            try {
              errorData = JSON.parse(text);
            } catch {
              errorData = { error: text.substring(0, 200) || "Failed to reject request" };
            }
          } else {
            errorData = { error: text.substring(0, 200) || "Failed to reject request" };
          }
          throw new Error(errorData.error || "Failed to reject request");
        }
        
        if (!text || text.trim().length === 0) {
          return {};
        }
        
        if (contentType && contentType.includes("application/json")) {
          try {
            return JSON.parse(text);
          } catch (jsonErr) {
            console.error("JSON parsing error in handleReject:", jsonErr);
            console.error("Response text:", text.substring(0, 500));
            throw new Error(`Invalid JSON response: ${jsonErr.message}`);
          }
        }
        
        return {};
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

