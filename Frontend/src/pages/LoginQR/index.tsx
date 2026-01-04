import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import { Container, Row, Col, Card, CardBody, CardTitle, Button, Alert } from 'reactstrap';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../lib/axios';
import styles from './styles.module.scss';

const LoginQR: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const qrReaderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    return () => {
      if (scannerRef.current && isScanning) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, [isScanning]);

  const startScanning = async () => {
    try {
      setError(null);
      if (!qrReaderRef.current) return;

      const html5QrCode = new Html5Qrcode(qrReaderRef.current.id);
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          handleScanSuccess(decodedText);
        },
        () => {
          // Ignore scan errors
        }
      );

      setIsScanning(true);
    } catch (err: any) {
      setError('Failed to start camera. Please check permissions.');
      console.error('Error starting scanner:', err);
    }
  };

  const stopScanning = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current = null;
        setIsScanning(false);
      } catch (err) {
        console.error('Error stopping scanner:', err);
      }
    }
  };

  const handleScanSuccess = async (qrDataString: string) => {
    try {
      await stopScanning();

      const qrData = JSON.parse(qrDataString);
      if (qrData.type !== 'login' || !qrData.userId) {
        setError('Invalid QR code format');
        return;
      }

      const response = await apiClient.post('/auth/qr-code/login', {
        qrCodeData: qrDataString,
      });

      if (response.data.success && response.data.data?.token) {
        const token = response.data.data.token;
        login(token);
        navigate('/dashboard');
      } else if (response.data.token) {
        login(response.data.token);
        navigate('/dashboard');
      } else {
        setError('Login failed');
      }
    } catch (err: any) {
      setError(err.response?.data?.meta?.error || 'Invalid QR code');
    }
  };

  return (
    <Container className={styles.qrContainer}>
      <Row className="justify-content-center">
        <Col md={8} lg={6}>
          <Card>
            <CardBody>
              <CardTitle tag="h2" className="text-center mb-4">
                QR Code Login
              </CardTitle>

              {error && (
                <Alert color="danger" className="mb-3">
                  {error}
                </Alert>
              )}

              <div id="qr-reader" ref={qrReaderRef} className={styles.qrReader}></div>

              <div className="text-center mt-3">
                {!isScanning ? (
                  <Button color="primary" onClick={startScanning}>
                    Start Camera
                  </Button>
                ) : (
                  <Button color="danger" onClick={stopScanning}>
                    Stop Camera
                  </Button>
                )}
              </div>

              <div className="text-center mt-3">
                <Button color="link" onClick={() => navigate('/login')} className="p-0">
                  Back to regular login
                </Button>
              </div>
            </CardBody>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default LoginQR;

