import { useForm } from "react-hook-form";
import { useState } from "react";
import { Navigate } from "react-router-dom";
import styles from "./styles.module.scss";
import { buildApiUrl } from "../../config/api";

interface RegisterFormData {
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string;
  dateOfBirth?: string;
  password: string;
  confirmPassword: string;
  address?: string;
  taxNumber?: number;
}

interface RegisterResponse {
  auth?: boolean;
  token?: string;
  message?: string;
}

const RegisterForm = () => {
  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<RegisterFormData>({
    mode: "onChange"
  });
  const [loading, setLoading] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const password = watch("password");

  const onSubmit = (data: RegisterFormData) => {
    if (data.password !== data.confirmPassword) {
      alert("As passwords não coincidem");
      return;
    }
    registerUser(data);
  };

  const registerUser = async (data: RegisterFormData) => {
    setLoading(true);

    // Remover confirmPassword do payload antes de enviar
    const { confirmPassword, ...userData } = data;

    const payload: any = {
      email: userData.email,
      password: userData.password,
      role: {
        name: "member",
        scope: ["member"],
      },
    };

    // Adicionar campos opcionais apenas se fornecidos
    if (userData.firstName) payload.firstName = userData.firstName;
    if (userData.lastName) payload.lastName = userData.lastName;
    if (userData.phone) payload.phone = userData.phone;
    if (userData.dateOfBirth) payload.dateOfBirth = new Date(userData.dateOfBirth).toISOString();
    if (userData.address) payload.address = userData.address;
    if (userData.taxNumber) payload.taxNumber = Number(userData.taxNumber);
    
    // Gerar nome de utilizador a partir do email (parte antes do @)
    payload.name = userData.email.split('@')[0];

    try {
      const res = await fetch(buildApiUrl("/api/auth/register"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      let body: RegisterResponse | undefined;
      try {
        body = (await res.json()) as RegisterResponse;
      } catch {
        body = undefined;
      }

      if (!res.ok) {
        const message =
          (body && body.message) ||
          `Falha no registo (${res.status} ${res.statusText})`;
        alert(message);
        setLoading(false);
        return;
      }

      if (body?.token) {
        try {
          localStorage.setItem("token", body.token);
        } catch {
          // ignore storage errors
        }
      }

      setIsRegistered(true);
      reset();
    } catch (error: any) {
      const message = error?.message || "Erro ao comunicar com o servidor";
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  if (isRegistered) {
    // Depois de registar, redirecionar para o login (home)
    return <Navigate to="/" replace={true} />;
  }

  return (
    <div className={styles.registerFormContainer}>
      <div className={styles.registerForm}>
        <div className={styles.header}>
          <h2 className={styles.title}>Criar conta</h2>
          <p className={styles.subtitle}>Preencha os dados para criar a sua conta</p>
        </div>
        
        <form className={styles.formRegister} onSubmit={handleSubmit(onSubmit)}>
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Credenciais</h3>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="email">
                Email <span className={styles.required}>*</span>
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                className={styles.input}
                {...register("email")}
                disabled={loading}
              />
            </div>
            
            <div className={styles.field}>
              <label className={styles.label} htmlFor="password">
                Password <span className={styles.required}>*</span>
              </label>
              <input
                id="password"
                type="password"
                required
                autoComplete="new-password"
                className={styles.input}
                {...register("password", {
                  minLength: {
                    value: 6,
                    message: "A password deve ter pelo menos 6 caracteres"
                  }
                })}
                disabled={loading}
              />
              {errors.password && (
                <span className={styles.errorMessage}>{errors.password.message}</span>
              )}
            </div>
            
            <div className={styles.field}>
              <label className={styles.label} htmlFor="confirmPassword">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                required
                autoComplete="new-password"
                className={`${styles.input} ${errors.confirmPassword ? styles.inputError : ""}`}
                {...register("confirmPassword", {
                  validate: (value) => 
                    value === password || "As passwords não coincidem"
                })}
                disabled={loading}
              />
              {errors.confirmPassword && (
                <span className={styles.errorMessage}>{errors.confirmPassword.message}</span>
              )}
            </div>
          </div>

          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Informações adicionais (opcional)</h3>
            <div className={styles.row}>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="firstName">
                  First Name
                </label>
                <input
                  id="firstName"
                  type="text"
                  autoComplete="given-name"
                  className={styles.input}
                  {...register("firstName")}
                  disabled={loading}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="lastName">
                  Last Name
                </label>
                <input
                  id="lastName"
                  type="text"
                  autoComplete="family-name"
                  className={styles.input}
                  {...register("lastName")}
                  disabled={loading}
                />
              </div>
            </div>
            
            <div className={styles.field}>
              <label className={styles.label} htmlFor="dateOfBirth">
                Date of Birth
              </label>
              <input
                id="dateOfBirth"
                type="date"
                className={styles.input}
                {...register("dateOfBirth")}
                disabled={loading}
              />
            </div>
            
            <div className={styles.row}>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="phone">
                  Phone
                </label>
                <input
                  id="phone"
                  type="tel"
                  autoComplete="tel"
                  className={styles.input}
                  {...register("phone")}
                  disabled={loading}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="taxNumber">
                  NIF
                </label>
                <input
                  id="taxNumber"
                  type="number"
                  className={styles.input}
                  {...register("taxNumber", { valueAsNumber: true })}
                  disabled={loading}
                />
              </div>
            </div>
            
            <div className={styles.field}>
              <label className={styles.label} htmlFor="address">
                Morada
              </label>
              <input
                id="address"
                type="text"
                autoComplete="street-address"
                className={styles.input}
                {...register("address")}
                disabled={loading}
              />
            </div>
          </div>

          <button
            type="submit"
            className={styles.submitButton}
            disabled={loading}
          >
            {loading ? "A criar..." : "Registar"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default RegisterForm;


