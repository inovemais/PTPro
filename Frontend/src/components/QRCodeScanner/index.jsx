import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Card, CardBody, CardTitle, Button, Alert } from "reactstrap";
import styles from "./styles.module.scss";

const QRCodeScanner = ({ onScanSuccess }) => {
  const scannerRef = useRef(null);
  const html5QrCodeRef = useRef(null);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState(null);
  const [scannedData, setScannedData] = useState(null);

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

  const handleScanSuccess = async (qrData) => {
    try {
      // Parse QR code data
      const qrDataObj = JSON.parse(qrData);
      
      if (qrDataObj.type === "login" && qrDataObj.sessionId) {
        setScannedData(qrDataObj);
        await stopScanning();

        // Call parent callback
        if (onScanSuccess) {
          onScanSuccess(qrDataObj);
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
    <Card className={styles.scannerCard}>
      <CardBody>
        <CardTitle tag="h4">Scan QR Code</CardTitle>
        
        {error && (
          <Alert color="danger" className={styles.errorAlert}>
            {error}
          </Alert>
        )}

        <div id="qr-reader" className={styles.qrReader}></div>

        {!isScanning && !scannedData && (
          <Button color="primary" onClick={startScanning} className={styles.scanButton}>
            Start Camera
          </Button>
        )}

        {isScanning && (
          <Button color="danger" onClick={stopScanning} className={styles.scanButton}>
            Stop Camera
          </Button>
        )}

        {scannedData && (
          <Alert color="success" className={styles.successAlert}>
            QR code scanned! Processing login...
          </Alert>
        )}

        <p className={styles.instructions}>
          <small>
            Point your camera at the QR code on the login page
          </small>
        </p>
      </CardBody>
    </Card>
  );
};

export default QRCodeScanner;

