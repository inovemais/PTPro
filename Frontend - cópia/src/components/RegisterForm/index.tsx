import { useForm } from "react-hook-form";
import { Row, Col } from "reactstrap";
import { useState } from "react";
import { Navigate } from "react-router-dom";
import styles from "./styles.module.scss";
import { buildApiUrl } from "../../config/api";

interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  address: string;
  country: string;
  taxNumber: number;
  age: number;
}

interface RegisterResponse {
  auth?: boolean;
  token?: string;
  message?: string;
}

const RegisterForm = () => {
  const { register, handleSubmit, reset } = useForm<RegisterFormData>();
  const [loading, setLoading] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);

  const onSubmit = (data: RegisterFormData) => registerUser(data);

  const registerUser = async (data: RegisterFormData) => {
    setLoading(true);

    const payload = {
      ...data,
      taxNumber: Number(data.taxNumber),
      age: Number(data.age),
      role: {
        name: "admin",
        scope: ["admin"],
      },
    };

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
    <Row className="d-flex align-items-center justify-content-center">
      <Col md={8} lg={6}>
        <div className={styles.registerForm}>
          <h2>Criar conta admin</h2>
          <form className={styles.formRegister} onSubmit={handleSubmit(onSubmit)}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="name">
                Nome de utilizador
              </label>
              <input
                id="name"
                type="text"
                required
                autoComplete="username"
                {...register("name")}
                disabled={loading}
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                {...register("email")}
                disabled={loading}
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                autoComplete="new-password"
                {...register("password")}
                disabled={loading}
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="address">
                Morada
              </label>
              <input
                id="address"
                type="text"
                required
                {...register("address")}
                disabled={loading}
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="country">
                País
              </label>
              <input
                id="country"
                type="text"
                required
                {...register("country")}
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
                required
                {...register("taxNumber", { valueAsNumber: true })}
                disabled={loading}
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="age">
                Idade
              </label>
              <input
                id="age"
                type="number"
                required
                {...register("age", { valueAsNumber: true })}
                disabled={loading}
              />
            </div>

            <input
              className="submit"
              type="submit"
              value={loading ? "A criar..." : "Registar"}
              disabled={loading}
            />
          </form>
        </div>
      </Col>
    </Row>
  );
};

export default RegisterForm;


