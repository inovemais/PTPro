import { useForm } from "react-hook-form";
import { Row, Col } from "reactstrap";
import styles from "./styles.module.scss";
import { Navigate } from "react-router-dom";
import { useState } from "react";
import QRCodeLogin from "../QRCodeLogin";
import { buildApiUrl } from "../../config/api";

interface LoginFormProps {
  title: string;
  role: "admin" | "user";
}

interface LoginFormData {
  name: string;
  password: string;
}

interface LoginResponse {
  token?: string;
  auth?: boolean;
  qrCode?: string;
  message?: string;
}

interface QRCodeLoginResponse {
  success: boolean;
  token?: string;
  error?: string;
}

const LoginForm = ({ title, role }: LoginFormProps) => {
  const { register, handleSubmit } = useForm<LoginFormData>();
  const [isLogged, setLogged] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [loginMode, setLoginMode] = useState<"form" | "qr-scan">("form");
  const [qrCode, setQrCode] = useState<string | null>(null);

  const onSubmit = (data: LoginFormData) => login(data);

  const login = async (data: LoginFormData) => {
    setLoading(true);
    const apiUrl = buildApiUrl("/api/auth/login");
    console.log("🔗 Attempting login to:", apiUrl);
    
    try {
      const res = await fetch(apiUrl, {
        headers: { "Content-Type": "application/json" },
        method: "POST",
        credentials: "include",
        body: JSON.stringify(data),
      });

      console.log("📡 Response status:", res.status, res.statusText);

      // tentar ler corpo (mesmo em erro) para mostrar mensagem
      let body: LoginResponse;
      try {
        body = await res.json();
      } catch (parseError) {
        // Se não conseguir fazer parse do JSON, criar objeto vazio
        console.error("❌ Failed to parse JSON response:", parseError);
        body = {} as LoginResponse;
      }

      if (!res.ok) {
        const message = body?.message || `Falha no Login (${res.status})`;
        console.error("Login error:", message, body);
        alert(message);
        setLoading(false);
        return;
      }

      // sucesso
      // normalizar auth para boolean e guardar token se existir
      if (body?.token) {
        localStorage.setItem("token", body.token);
        console.log("✅ Token saved to localStorage");
        console.log("✅ Token value (first 20 chars):", body.token.substring(0, 20) + "...");
        console.log("✅ Token length:", body.token.length);
        
        // Verificar se foi realmente salvo
        const savedToken = localStorage.getItem("token");
        if (savedToken === body.token) {
          console.log("✅ Token verification: Successfully saved and verified");
        } else {
          console.error("❌ Token verification: Failed to save token correctly");
        }
      } else {
        console.warn("⚠️  No token in response body, checking cookie...");
        console.warn("⚠️  Response body keys:", Object.keys(body || {}));
      }
      
      // Verificar se auth é true (mesmo que não tenha token explícito, o cookie pode estar setado)
      const isAuthenticated = Boolean(body?.auth);
      console.log("🔐 Authentication status:", isAuthenticated, "Token in body:", !!body?.token);
      console.log("🔐 Full response body:", JSON.stringify(body, null, 2));
      
      // Se o login retornou QR code, guardá-lo
      if (body?.qrCode) {
        setQrCode(body.qrCode);
        // Também marcar como logado, pois o login foi bem-sucedido
        setLogged(isAuthenticated);
        console.log("📱 QR Code received, user is authenticated");
      } else {
        setLogged(isAuthenticated);
        console.log("✅ Login successful, redirecting...");
      }
    } catch (error: any) {
      console.error("❌ Network/Connection error:", error);
      console.error("Error details:", {
        message: error?.message,
        name: error?.name,
        stack: error?.stack,
        apiUrl: apiUrl
      });
      
      // Mensagem de erro mais detalhada
      const errorMessage = error?.message || "Erro desconhecido";
      const isNetworkError = error?.name === "TypeError" || error?.message?.includes("fetch");
      
      if (isNetworkError) {
        alert(
          `Erro na ligação ao servidor.\n\n` +
          `URL: ${apiUrl}\n` +
          `Erro: ${errorMessage}\n\n` +
          `Verifique se:\n` +
          `- O servidor backend está a correr\n` +
          `- A URL está correta\n` +
          `- Não há problemas de CORS`
        );
      } else {
        alert(`Erro: ${errorMessage}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleQRScanSuccess = async (qrDataString: string) => {
    // Quando QR code é escaneado, fazer login com ele
    try {
      const res = await fetch(buildApiUrl("/api/auth/qr-code/login"), {
        headers: { "Content-Type": "application/json" },
        method: "POST",
        credentials: "include",
        body: JSON.stringify({
          qrCodeData: qrDataString,
        }),
      });

      const result: QRCodeLoginResponse = await res.json();

      if (res.ok && result.success) {
        if (result.token) {
          localStorage.setItem("token", result.token);
        }
        setLogged(true);
      } else {
        alert(result.error || "Login failed");
      }
    } catch (err) {
      console.error("Error validating QR code:", err);
      alert("Error validating QR code");
    }
  };

  const handleCloseQRCode = () => {
    console.log("🔐 Closing QR code, verifying authentication...");
    setQrCode(null);
    // Verificar se o token ainda existe antes de marcar como logado
    const token = localStorage.getItem("token");
    if (token) {
      console.log("✅ Token found, setting logged to true");
      setLogged(true);
    } else {
      console.warn("⚠️ No token found, but proceeding anyway (cookie may be set)");
      setLogged(true);
    }
  };

  if (isLogged && !qrCode) {
    return role === "admin" ? (
      <Navigate to="/admin" replace={true} />
    ) : (
      <Navigate to="/user" replace={true} />
    );
  }

  return (
    <Row className="d-flex align-items-center justify-content-center">
      <Col md={8} lg={6}>
        <div className={styles.loginForm}>
          <h2>{title}</h2>
          
          {qrCode ? (
            // Mostrar QR code após login
            <div className={styles.loginContent}>
              <div className={styles.qrCodeSection}>
                <h3>Your Login QR Code</h3>
                <div className={styles.qrCodeContainer}>
                  <img src={qrCode} alt="Your Login QR Code" className={styles.qrCodeImage} />
                </div>
                <button 
                  onClick={handleCloseQRCode} 
                  className={`btn btn-primary ${styles.closeButton}`}
                >
                  Continue to Dashboard
                </button>
              </div>
            </div>
          ) : (
            // Formulário de login
            <>
              {/* Botões para escolher modo de login */}
              <div className={styles.loginModeButtons}>
                <input
                  type="button"
                  value="Username/Password"
                  onClick={() => setLoginMode("form")}
                  className={`submit ${styles.modeButton} ${loginMode === "form" ? styles.active : ""}`}
                />
                <input
                  type="button"
                  value="QR Code Login"
                  onClick={() => setLoginMode("qr-scan")}
                  className={`submit ${styles.modeButton} ${loginMode === "qr-scan" ? styles.active : ""}`}
                />
              </div>

              <div className={styles.loginContent}>
                {loginMode === "form" && (
                  <form className={styles.formLogin} onSubmit={handleSubmit(onSubmit)}>
                    <div className={styles.field}>
                      <label className={styles.label} htmlFor="name">
                        Name:
                      </label>
                      <input
                        id="name"
                        type="text"
                        autoComplete="username"
                        required
                        {...register("name")}
                        disabled={loading}
                      />
                    </div>
                    <div className={styles.field}>
                      <label className={styles.label} htmlFor="password">
                        Password:
                      </label>
                      <input
                        id="password"
                        type="password"
                        autoComplete="current-password"
                        required
                        {...register("password")}
                        disabled={loading}
                      />
                    </div>
                    <input className="submit" type="submit" disabled={loading} />
                  </form>
                )}

                {loginMode === "qr-scan" && (
                  <QRCodeLogin onScanSuccess={handleQRScanSuccess} />
                )}
              </div>
            </>
          )}
        </div>
      </Col>
    </Row>
  );
};

export default LoginForm;

