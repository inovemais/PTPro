import { useForm } from "react-hook-form";
import { Row, Col } from "reactstrap";
import styles from "./styles.module.scss";
import { Navigate, Link } from "react-router-dom";
import { useState } from "react";
import QRCodeLogin from "../QRCodeLogin";
import { buildApiUrl } from "../../config/api";
import { useAuth } from "../../context/AuthContext";

interface LoginFormProps {
  title: string;
  role: "admin" | "user";
}

interface LoginFormData {
  email: string;
  password: string;
}

interface LoginResponse {
  token?: string;
  auth?: boolean;
  qrCode?: string;
  message?: string;
}

interface QRCodeLoginResponse {
  success?: boolean;
  auth?: boolean;
  token?: string;
  error?: string;
  message?: string;
}

const LoginForm = ({ title, role }: LoginFormProps) => {
  const { register, handleSubmit } = useForm<LoginFormData>();
  const { login: authLogin, refreshAuth } = useAuth();
  const [isLogged, setLogged] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [loginMode, setLoginMode] = useState<"form" | "qr-scan">("form");
  const [qrCode, setQrCode] = useState<string | null>(null);

  const onSubmit = (data: LoginFormData) => login(data);

  const login = async (data: LoginFormData) => {
    setLoading(true);
    const apiUrl = buildApiUrl("/api/auth/login");
    console.log("🔗 Attempting login to:", apiUrl);
    console.log("📤 Sending login data:", JSON.stringify(data, null, 2));
    
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
      console.log("🔐 Login response received:", {
        hasToken: !!body?.token,
        hasAuth: !!body?.auth,
        hasQrCode: !!body?.qrCode,
        responseKeys: Object.keys(body || {})
      });
      
      if (body?.token) {
        try {
          // Usar o AuthContext para fazer login corretamente
          authLogin(body.token);
          console.log("✅ Token saved via AuthContext");
          console.log("✅ Token value (first 20 chars):", body.token.substring(0, 20) + "...");
          console.log("✅ Token length:", body.token.length);
        } catch (error) {
          console.error("❌ Error saving token via AuthContext:", error);
        }
      } else {
        console.warn("⚠️ No token in response body, but auth may be set via cookie");
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

      let result: QRCodeLoginResponse;
      try {
        result = await res.json();
      } catch (parseError) {
        console.error("❌ Failed to parse JSON response:", parseError);
        alert("Erro ao processar resposta do servidor");
        setLoading(false);
        return;
      }

      if (res.ok && (result.success || result.auth)) {
        if (result.token) {
          // Usar o AuthContext para fazer login corretamente
          authLogin(result.token);
          console.log("✅ QR Code login successful, token saved via AuthContext");
        } else {
          console.warn("⚠️ No token in QR code login response, but success/auth is true");
          // Mesmo sem token, tentar atualizar o contexto (pode ter cookie httpOnly)
          const token = localStorage.getItem("token");
          if (token) {
            authLogin(token);
          } else {
            // Se não houver token no localStorage, pode estar em cookie httpOnly
            // Atualizar o contexto de autenticação
            await refreshAuth();
            console.log("✅ Auth context refreshed after QR code login");
          }
        }
        setLogged(true);
      } else {
        const errorMsg = result.error || result.message || "Login failed";
        console.error("❌ QR Code login failed:", errorMsg);
        alert(errorMsg);
      }
    } catch (err: any) {
      console.error("❌ Error validating QR code:", err);
      const errorMessage = err?.message || "Erro ao validar QR code";
      alert(`Erro: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseQRCode = () => {
    console.log("🔐 Closing QR code, verifying authentication...");
    
    // Verificar se o token existe antes de fechar o QR code
    const token = localStorage.getItem("token");
    console.log("🔐 Token check before closing QR code:", token ? `Present (${token.substring(0, 20)}...)` : 'NOT FOUND');
    
    if (!token) {
      console.error("❌ CRITICAL: No token found in localStorage!");
      console.error("❌ This will cause authentication to fail");
      console.error("❌ Checking if token was ever saved...");
      
      // Tentar verificar se o token foi salvo em algum momento
      const allKeys = Object.keys(localStorage);
      console.log("🔍 All localStorage keys:", allKeys);
      
      // Se não houver token, tentar fazer uma última verificação
      // Mas ainda assim permitir o redirecionamento para ver o erro
      alert("Aviso: Token não encontrado. A autenticação pode falhar. Verifique o console para mais detalhes.");
    } else {
      console.log("✅ Token found, length:", token.length);
    }
    
    setQrCode(null);
    setLogged(true);
  };

  if (isLogged && !qrCode) {
    return <Navigate to="/dashboard" replace={true} />;
  }

  return (
    <div className={styles.loginForm}>
      <div className={styles.loginContainer}>
        {/* Logo Section */}
        <div className={styles.logoSection}>
          <div className={styles.logoIcon}>
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h1 className={styles.logoTitle}>PTPro</h1>
          <p className={styles.logoSubtitle}>Sistema de Gestão de Ginásios</p>
        </div>
        
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
                className={styles.closeButton}
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
              <button
                type="button"
                onClick={() => setLoginMode("form")}
                className={`${styles.modeButton} ${loginMode === "form" ? styles.active : ""}`}
              >
                User/Password
              </button>
              <button
                type="button"
                onClick={() => setLoginMode("qr-scan")}
                className={`${styles.modeButton} ${loginMode === "qr-scan" ? styles.active : ""}`}
              >
                QR Code Login
              </button>
            </div>

            <div className={styles.loginContent}>
              {loginMode === "form" && (
                <form className={styles.formLogin} onSubmit={handleSubmit(onSubmit)}>
                  <div className={styles.field}>
                    <label className={styles.label} htmlFor="email">
                      Email
                    </label>
                    <input
                      id="email"
                      type="email"
                      autoComplete="email"
                      required
                      placeholder="Insira o seu email"
                      className={styles.input}
                      {...register("email")}
                      disabled={loading}
                    />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label} htmlFor="password">
                      Palavra-passe
                    </label>
                    <input
                      id="password"
                      type="password"
                      autoComplete="current-password"
                      required
                      placeholder="Insira a sua palavra-passe"
                      className={styles.input}
                      {...register("password")}
                      disabled={loading}
                    />
                  </div>
                  <button 
                    type="submit" 
                    className={styles.submitButton}
                    disabled={loading}
                  >
                    {loading ? "A iniciar sessão..." : "Iniciar Sessão"}
                  </button>
                  <div className={styles.registerLink}>
                    <span>No account? </span>
                    <Link to="/register" className={styles.registerLinkText}>
                      Register
                    </Link>
                  </div>
                </form>
              )}

              {loginMode === "qr-scan" && (
                <QRCodeLogin onScanSuccess={handleQRScanSuccess} />
              )}
            </div>

            
            
          </>
        )}
      </div>
    </div>
  );
};

export default LoginForm;

