import { useState, useRef, useEffect } from "react";
import { Button, Alert } from "reactstrap";
import styles from "./styles.module.scss";

export const CameraMedia = ({ setImage, imageFile }) => {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [error, setError] = useState(null);
  const [mode, setMode] = useState("upload"); // 'upload' or 'camera'
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const startCamera = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" }, // Front camera
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraActive(true);
        setMode("camera");
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError("Não foi possível aceder à câmara. Verifique as permissões.");
      setIsCameraActive(false);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(videoRef.current, 0, 0);
      
      // Convert to base64
      const base64Image = canvas.toDataURL("image/jpeg", 0.8);
      setImage(base64Image);
      stopCamera();
      setMode("upload");
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.match(/^image\/(jpeg|jpg|png|gif)$/)) {
        setError("Tipo de ficheiro não suportado. Use JPEG, JPG, PNG ou GIF");
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError("A imagem deve ter no máximo 5MB");
        return;
      }

      setError(null);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result); // Base64 string
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className={styles.cameraMedia}>
      <div className={styles.controls}>
        <Button
          color="secondary"
          size="sm"
          onClick={() => {
            if (isCameraActive) {
              stopCamera();
            }
            setMode("upload");
            setError(null);
          }}
          className={styles.button}
          active={mode === "upload"}
        >
          Upload Ficheiro
        </Button>
        <Button
          color="primary"
          size="sm"
          onClick={startCamera}
          className={styles.button}
          active={mode === "camera"}
        >
          Usar Câmara
        </Button>
      </div>

      {error && (
        <Alert color="danger" className={styles.alert}>
          {error}
        </Alert>
      )}

      {mode === "upload" && (
        <div className={styles.uploadSection}>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/gif"
            onChange={handleFileChange}
            className={styles.fileInput}
            id="file-input"
          />
          <label htmlFor="file-input" className={styles.fileLabel}>
            Escolher Ficheiro
          </label>
        </div>
      )}

      {mode === "camera" && (
        <div className={styles.cameraSection}>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            className={styles.video}
          />
          {isCameraActive && (
            <div className={styles.cameraControls}>
              <Button color="success" onClick={capturePhoto}>
                Capturar Foto
              </Button>
              <Button color="danger" onClick={stopCamera}>
                Cancelar
              </Button>
            </div>
          )}
        </div>
      )}

      {imageFile && (
        <div className={styles.previewSection}>
          <div className={styles.previewContainer}>
            <img src={imageFile} alt="Preview" className={styles.previewImage} />
            <Button
              color="danger"
              size="sm"
              onClick={removeImage}
              className={styles.removeButton}
            >
              Remover
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

