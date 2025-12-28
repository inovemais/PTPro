import { useEffect, useRef, useState } from "react";
import { Card, CardBody, CardTitle, Alert, Button } from "reactstrap";
import { Html5Qrcode } from "html5-qrcode";
import styles from "./styles.module.scss";

const QRCodeLogin = ({ onScanSuccess }) => {
  const html5QrCodeRef = useRef(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    return () => {
      // Cleanup: stop scanner when component unmounts
      if (html5QrCodeRef.current && isScanning) {
        html5QrCodeRef.current
          .stop()
          .then(() => {
            html5QrCodeRef.current = null;
          })
          .catch((err) => {
            console.error("Error stopping scanner:", err);
          });
      }
    };
  }, [isScanning]);

  const startScanning = async () => {
    try {
      setError(null);
      
      const html5QrCode = new Html5Qrcode("qr-reader");
      html5QrCodeRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: "environment" }, // Use back camera
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText, decodedResult) => {
          // QR code scanned successfully
          handleScanSuccess(decodedText);
        },
        (errorMessage) => {
          // Scan error (usually ignored for continuous scanning)
        }
      );

      setIsScanning(true);
    } catch (err) {
      console.error("Error starting scanner:", err);
      setError("Failed to start camera. Please check permissions.");
      setIsScanning(false);
    }
  };

  const stopScanning = async () => {
    if (html5QrCodeRef.current) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current = null;
        setIsScanning(false);
      } catch (err) {
        console.error("Error stopping scanner:", err);
      }
    }
  };

  const handleScanSuccess = async (qrDataString) => {
    try {
      // Validar formato do QR code
      const qrData = JSON.parse(qrDataString);
      
      if (qrData.type === "login" && qrData.userId) {
        await stopScanning();

        // Call parent callback com os dados do QR code
        if (onScanSuccess) {
          onScanSuccess(qrDataString);
        }
      } else {
        setError("Invalid QR code format");
      }
    } catch (err) {
      console.error("Error parsing QR code:", err);
      setError("Invalid QR code. Please try again.");
    }
  };

  return (
    <Card className={styles.qrCard}>
      <CardBody>
        <CardTitle tag="h4">QR Code</CardTitle>
        
        {error && (
          <Alert color="danger" className={styles.errorAlert}>
            {error}
          </Alert>
        )}

        <div id="qr-reader" className={styles.qrReader}></div>

        {!isScanning && (
          <Button color="primary" onClick={startScanning} className={styles.scanButton}>
            Start Camera
          </Button>
        )}

        {isScanning && (
          <Button color="danger" onClick={stopScanning} className={styles.scanButton}>
            Stop Camera
          </Button>
        )}

        <p className={styles.instructions}>
          <small>
            
            Point your camera at a login QR code<br />
           
          </small>
        </p>
      </CardBody>
    </Card>
  );
};

export default QRCodeLogin;

