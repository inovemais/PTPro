import { useEffect, useState, useCallback } from "react";
import { Container, Row, Col, Button, Badge } from "reactstrap";
import { buildApiUrl } from "../../config/api";
import Table from "../Table";
import styles from "./styles.module.scss";

interface TrainerChangeRequest {
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
  status: "pending" | "approved" | "rejected";
  createdAt: string;
}

const AdminRequests = () => {
  const [requests, setRequests] = useState<TrainerChangeRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0,
  });

  const fetchRequests = useCallback(async (page = 1, pageSize = 10) => {
    setLoading(true);
    const skip = (page - 1) * pageSize;
    const queryParams = new URLSearchParams({
      limit: pageSize.toString(),
      skip: skip.toString(),
    });

    const token = localStorage.getItem("token");
    const headers: HeadersInit = {
      Accept: "application/json",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(
        buildApiUrl(`/api/trainer-change-requests?${queryParams}`),
        {
          headers,
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.requests) {
        setRequests(data.requests);
        setPagination({
          current: page,
          pageSize,
          total: data.pagination?.total || data.requests.length,
        });
      }
    } catch (err) {
      console.error("Error fetching requests:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleStatusChange = async (
    requestId: string,
    status: "approved" | "rejected"
  ) => {
    const token = localStorage.getItem("token");
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(
        buildApiUrl(`/api/trainer-change-requests/${requestId}/status`),
        {
          method: "PUT",
          headers,
          credentials: "include",
          body: JSON.stringify({ status }),
        }
      );

      if (response.ok) {
        fetchRequests(pagination.current, pagination.pageSize);
      }
    } catch (err) {
      console.error("Error updating request status:", err);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return <Badge color="success">Approved</Badge>;
      case "rejected":
        return <Badge color="danger">Rejected</Badge>;
      default:
        return <Badge color="warning">Pending</Badge>;
    }
  };

  const tableData = requests.map((request) => ({
    _id: request._id,
    client: request.clientId?.userId?.name || "N/A",
    currentTrainer: request.currentTrainerId?.userId?.name || "N/A",
    requestedTrainer: request.requestedTrainerId?.userId?.name || "N/A",
    reason: request.reason || "-",
    status: getStatusBadge(request.status),
    actions:
      request.status === "pending" ? (
        <div>
          <Button
            size="sm"
            color="success"
            onClick={() => handleStatusChange(request._id, "approved")}
            className={styles.actionButton}
          >
            Approve
          </Button>
          <Button
            size="sm"
            color="danger"
            onClick={() => handleStatusChange(request._id, "rejected")}
            className={styles.actionButton}
          >
            Reject
          </Button>
        </div>
      ) : (
        <span>-</span>
      ),
  }));

  return (
    <Container className={styles.container}>
      <Row>
        <Col>
          <h2>Trainer Change Requests</h2>
          {loading ? (
            <p>Loading requests...</p>
          ) : (
            <Table
              columns={[
                "client",
                "currentTrainer",
                "requestedTrainer",
                "reason",
                "status",
                "actions",
              ]}
              rows={tableData}
            />
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default AdminRequests;

