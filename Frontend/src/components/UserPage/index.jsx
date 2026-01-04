import { useEffect, useState, useCallback } from "react";
import { Container, Row, Col, Alert } from "reactstrap";
import { useAuth } from "../ProtectRoute/hooks/useAuth";
import { useSocket } from "../../hooks/useSocket";
import { toast } from "react-toastify";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Notifications } from "react-push-notification";
import addNotification from "react-push-notification";
import { buildApiUrl } from "../../config/api";
import styles from "./styles.module.scss";
import ClientCalendar from "../ClientCalendar";

const UserPage = () => {
  const { isValidLogin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState("");
  const [alertType, setAlertType] = useState("success");

  // Configurar Socket.IO - useSocket já determina a URL automaticamente
  // Em dev usa proxy, em prod usa a URL do backend
  const { isConnected } = useSocket(undefined, {
    withCredentials: true,
  });

  useEffect(() => {
    if (isValidLogin) {
      fetchUserInfo();
    }
  }, [isValidLogin]);

  // Atualizar estado quando a página ganha foco
  useEffect(() => {
    const handleFocus = () => {
      if (isValidLogin) {
        fetchUserInfo();
      }
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [isValidLogin]);

  const fetchUserInfo = () => {
    const token = localStorage.getItem("token");
    const headers = { Accept: "application/json" };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    fetch(buildApiUrl("/api/auth/me"), {
      headers: headers,
      credentials: "include",
    })
      .then(async (res) => {
        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(`HTTP error! status: ${res.status}, body: ${errorText.substring(0, 200)}`);
        }
        
        const contentType = res.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          const text = await res.text();
          throw new Error(`Expected JSON but got ${contentType}. Response: ${text.substring(0, 100)}`);
        }
        
        const text = await res.text();
        if (!text || text.trim().length === 0) {
          throw new Error("Empty response from server");
        }
        
        try {
          return JSON.parse(text);
        } catch (jsonErr) {
          console.error("JSON parsing error in fetchUserInfo:", jsonErr);
          console.error("Response text:", text.substring(0, 500));
          throw new Error(`Invalid JSON response: ${jsonErr.message}`);
        }
      })
      .then((response) => {
        if (response.auth && response.decoded) {
          // User info loaded successfully
        }
      })
      .catch((err) => {
        console.error("Erro ao carregar informações do utilizador:", err);
      });
  };

  // Funções responsáveis por mostrar notificações ao utilizador

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

      {/* Secção de planos de treino em estilo calendário para o cliente */}
      <Row className={styles.section}>
        <Col>
          <ClientCalendar />
        </Col>
      </Row>
    </Container>
  );
};

export default UserPage;
