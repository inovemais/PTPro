import { useEffect, useState, useRef, useCallback } from "react";
import { Container, Row, Col, Card, CardBody, CardTitle, Button, Alert } from "reactstrap";
import { useAuth } from "../ProtectRoute/hooks/useAuth";
import { useSocket } from "../../hooks/useSocket";
import { toast } from "react-toastify";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Notifications } from "react-push-notification";
import addNotification from "react-push-notification";
import styles from "./styles.module.scss";
import Table from "../Table";

const UserPage = () => {
  const { isValidLogin } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [memberRequest, setMemberRequest] = useState(null);
  const [isMember, setIsMember] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState("success");

  // Configurar Socket.IO - useSocket já determina a URL automaticamente
  // Em dev usa proxy, em prod usa a URL do backend
  const { socketAddListener, socketRemoveListener, isConnected } = useSocket(undefined, {
    withCredentials: true,
  });

  useEffect(() => {
    if (isValidLogin) {
      fetchTickets();
      fetchMemberRequests();
      fetchUserInfo();
    }
  }, [isValidLogin]);

  // Atualizar estado quando a página ganha foco (útil se o admin aprovar enquanto o utilizador está noutra aba)
  useEffect(() => {
    const handleFocus = () => {
      if (isValidLogin) {
        fetchUserInfo();
        fetchMemberRequests();
      }
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [isValidLogin]);

  const fetchTickets = () => {
    fetch("/api/tickets?limit=100&skip=0", {
      headers: { Accept: "application/json" },
      credentials: "include",
    })
      .then((res) => res.json())
      .then((response) => {
        if (response.auth && response.tickets) {
          setTickets(response.tickets);
        }
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  };

  const fetchMemberRequests = () => {
    fetch("/api/member-requests/my-requests", {
      headers: { Accept: "application/json" },
      credentials: "include",
    })
      .then((res) => res.json())
      .then((response) => {
        if (response.auth && response.requests) {
          const pendingRequest = response.requests.find(
            (r) => r.status === "pending"
          );
          setMemberRequest(pendingRequest || null);
        }
      })
      .catch(() => {});
  };

  const fetchUserInfo = () => {
    fetch("/api/auth/me", {
      headers: { Accept: "application/json" },
      credentials: "include",
    })
      .then((res) => res.json())
      .then((response) => {
        if (response.auth && response.decoded) {
          const role = response.decoded.role || response.decoded;
          const scopes = Array.isArray(role.scope) ? role.scope : (role.scope ? [role.scope] : []);
          const hasMemberScope = scopes.includes("member");
          setIsMember(hasMemberScope);
        }
      })
      .catch(() => {});
  };

  // Funções responsáveis por mostrar notificações ao utilizador
  const showGameCreatedNotification = useCallback((data) => {
    const gameName = data.game?.name || "Novo jogo";
    const gameDate = data.game?.date ? new Date(data.game.date).toLocaleDateString('pt-PT') : '';
    const message = gameDate 
      ? `🎮 Novo jogo: ${gameName} (${gameDate})`
      : `🎮 Novo jogo: ${gameName}`;
    
    // Toast notification
    toast.info(message, {
      position: "top-right",
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    });
    
    // Push notification
    addNotification({
      title: "Novo Jogo Criado",
      message: message,
      theme: "darkblue",
      native: true, // Usa notificações nativas do navegador
      duration: 5000,
    });
    
    console.log("New game created:", data);
    
    // Atualizar lista de tickets se necessário
    fetchTickets();
  }, [fetchTickets]);

  const showMemberCreatedNotification = useCallback((data) => {
    const userName = data.user?.name || "Novo membro";
    const message = `👤 Parabéns, ${userName}! Agora és membro.`;
    
    // Toast notification
    toast.success(message, {
      position: "top-right",
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    });
    
    // Push notification
    addNotification({
      title: "Membro Aprovado",
      message: message,
      theme: "green",
      native: true, // Usa notificações nativas do navegador
      duration: 5000,
    });
    
    console.log("New member created:", data);
    
    // Atualizar informações do utilizador e pedidos de membro
    fetchUserInfo();
    fetchMemberRequests();
  }, [fetchUserInfo, fetchMemberRequests]);

  const showErrorNotification = useCallback((message) => {
    toast.error(message, {
      position: "top-right",
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    });
    
    addNotification({
      title: "Erro",
      message: message,
      theme: "red",
      native: true,
      duration: 5000,
    });
  }, []);

  const showSuccessNotification = useCallback((message) => {
    toast.success(message, {
      position: "top-right",
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    });
    
    addNotification({
      title: "Sucesso",
      message: message,
      theme: "green",
      native: true,
      duration: 5000,
    });
  }, []);

  const showInfoNotification = useCallback((message) => {
    toast.info(message, {
      position: "top-right",
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    });
    
    addNotification({
      title: "Informação",
      message: message,
      theme: "darkblue",
      native: true,
      duration: 5000,
    });
  }, []);

  // Configurar listeners Socket.IO para notificações
  useEffect(() => {
    if (!isValidLogin) return;

    // Listener para quando um novo jogo é criado
    socketAddListener("game:created", showGameCreatedNotification);

    // Listener para quando um novo membro é criado
    socketAddListener("member:created", showMemberCreatedNotification);

    // Cleanup: remover listeners ao desmontar
    return () => {
      socketRemoveListener("game:created");
      socketRemoveListener("member:created");
    };
  }, [isValidLogin, socketAddListener, socketRemoveListener, showGameCreatedNotification, showMemberCreatedNotification]);

  const requestMembership = () => {
    fetch("/api/member-requests", {
      headers: { "Content-Type": "application/json" },
      method: "POST",
      credentials: "include",
    })
      .then((res) => {
        if (!res.ok) {
          return res.json().then((data) => {
            throw new Error(data.error || "Failed to submit request");
          });
        }
        return res.json();
      })
      .then(() => {
        setAlertMessage("Membership request submitted successfully!");
        setAlertType("success");
        setShowAlert(true);
        fetchMemberRequests();
        fetchUserInfo();
        setTimeout(() => setShowAlert(false), 5000);
      })
      .catch((err) => {
        setAlertMessage(err.message || "Error submitting request");
        setAlertType("danger");
        setShowAlert(true);
        setTimeout(() => setShowAlert(false), 5000);
      });
  };

  const getRequestStatusBadge = (status) => {
    const statusMap = {
      pending: { color: "warning", text: "Pending" },
      approved: { color: "success", text: "Approved" },
      rejected: { color: "danger", text: "Rejected" },
    };
    const statusInfo = statusMap[status] || { color: "secondary", text: status };
    return (
      <span className={`badge bg-${statusInfo.color}`}>{statusInfo.text}</span>
    );
  };

  return (
    <Container className={styles.container}>
      <Notifications />
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      <Row>
        <Col>
          <h1>My Account</h1>
          {isConnected && (
            <small className="text-muted">🔌 Conectado ao servidor</small>
          )}
        </Col>
      </Row>

      {showAlert && (
        <Row>
          <Col>
            <Alert color={alertType} toggle={() => setShowAlert(false)}>
              {alertMessage}
            </Alert>
          </Col>
        </Row>
      )}

      <Row className={styles.section}>
        <Col>
          <Card>
            <CardBody>
              <CardTitle tag="h3">Membership</CardTitle>
              {isMember ? (
                <div>
                  <p>
                    <span className={`badge bg-success`}>Member</span>
                  </p>
                  <p className="text-success">
                    You are a member! You enjoy reduced prices on all events.
                  </p>
                </div>
              ) : memberRequest ? (
                <div>
                  <p>
                    Your membership request status:{" "}
                    {getRequestStatusBadge(memberRequest.status)}
                  </p>
                  {memberRequest.status === "pending" && (
                    <p className="text-muted">
                      Your request is being reviewed by an administrator.
                    </p>
                  )}
                  {memberRequest.status === "rejected" && memberRequest.reason && (
                    <p className="text-danger">
                      <strong>Reason:</strong> {memberRequest.reason}
                    </p>
                  )}
                </div>
              ) : (
                <div>
                  <p>
                    Become a member to get discounts on tickets! Members enjoy
                    reduced prices on all events.
                  </p>
                  <Button color="primary" onClick={requestMembership}>
                    Request Membership
                  </Button>
                </div>
              )}
            </CardBody>
          </Card>
        </Col>
      </Row>

      <Row className={styles.section}>
        <Col>
          <Card>
            <CardBody>
              <CardTitle tag="h3">My Tickets</CardTitle>
              {loading ? (
                <p>Loading tickets...</p>
              ) : tickets.length === 0 ? (
                <p>You don't have any tickets yet.</p>
              ) : (
                <Table
                  columns={["sector", "price", "gameId", "isMember"]}
                  rows={tickets}
                />
              )}
            </CardBody>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default UserPage;
