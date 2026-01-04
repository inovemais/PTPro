import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Container, Alert } from "reactstrap";
import QRCodeScanner from "../QRCodeScanner";
import { buildApiUrl } from "../../config/api";
import styles from "./styles.module.scss";

const QRCodeLoginPage = () => {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleScanSuccess = async (qrDataString: string) => {
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(buildApiUrl("/api/auth/qr-code/login"), {
        headers: { "Content-Type": "application/json" },
        method: "POST",
        credentials: "include",
        body: JSON.stringify({
          qrCodeData: qrDataString,
        }),
      });

      const result = await res.json();

      if (res.ok && result.success) {
        if (result.token) {
          localStorage.setItem("token", result.token);
        }
        // Redirect to dashboard after successful login
        navigate("/dashboard", { replace: true });
      } else {
        setError(result.error || "Login failed. Invalid QR code.");
      }
    } catch (err: any) {
      console.error("Error validating QR code:", err);
      setError("Error validating QR code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className={styles.qrLoginPage}>
      <div className={styles.content}>
        <h1 className={styles.title}>QR Code Login</h1>
        <p className={styles.subtitle}>
          Scan your QR code to login quickly
        </p>

        {error && (
          <Alert color="danger" className={styles.errorAlert}>
            {error}
          </Alert>
        )}

        {loading && (
          <Alert color="info" className={styles.loadingAlert}>
            Processing login...
          </Alert>
        )}

        <QRCodeScanner onScanSuccess={handleScanSuccess} />

        <div className={styles.footer}>
          <a href="/" className={styles.backLink}>
            ← Back to regular login
          </a>
        </div>
      </div>
    </Container>
  );
};

export default QRCodeLoginPage;

