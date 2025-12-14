import { useEffect, useState, useCallback } from "react";
import { Container, Row, Col } from "reactstrap";
import Table from "../../../Table";
import { useForm } from "react-hook-form";
import { buildApiUrl } from "../../../../config/api";
import styles from "./styles.module.scss";


const Users = () => {
  const [users, setUsers] = useState({
    data: [],
    pagination: {},
  });

  const { register, handleSubmit } = useForm();

  // defaults e cálculo correto de skip
  const fetchApiUsers = useCallback((pageSize = 10, current = 1) => {
    const skip = (Number(current) - 1) * Number(pageSize);
    const queryParams = new URLSearchParams({
      limit: pageSize,
      skip,
    });
    const url = buildApiUrl(`/api/users?${queryParams}`);
    console.log('🔗 Fetching users from:', url);

    // Obter token do localStorage
    const token = localStorage.getItem("token");
    const headers = {
      Accept: "application/json"
    };
    
    // Adicionar token ao header se existir
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
      console.log('🔐 Token added to Authorization header');
    } else {
      console.error('❌ No token in localStorage!');
    }

    fetch(url, {
      headers: headers,
      credentials: 'include'
    })
      .then(async (response) => {
        // Verificar se a resposta é OK
        if (!response.ok) {
          let errorText;
          try {
            errorText = await response.text();
            // Tentar fazer parse se for JSON
            try {
              const errorJson = JSON.parse(errorText);
              throw new Error(`HTTP error! status: ${response.status}, message: ${errorJson.message || errorJson.error || errorText}`);
            } catch {
              throw new Error(`HTTP error! status: ${response.status}, body: ${errorText.substring(0, 200)}`);
            }
          } catch (parseErr) {
            throw new Error(`HTTP error! status: ${response.status}, ${parseErr.message}`);
          }
        }
        
        // Verificar se o content-type é JSON
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          const text = await response.text();
          throw new Error(`Expected JSON but got ${contentType}. Response: ${text.substring(0, 100)}`);
        }
        
        // Ler o texto primeiro para verificar se é JSON válido
        const text = await response.text();
        if (!text || text.trim().length === 0) {
          throw new Error("Empty response from server");
        }
        
        try {
          return JSON.parse(text);
        } catch (jsonErr) {
          console.error("JSON parsing error:", jsonErr);
          console.error("Response text:", text.substring(0, 500));
          throw new Error(`Invalid JSON response: ${jsonErr.message}. Response preview: ${text.substring(0, 200)}`);
        }
      })
      .then((response) => {
        const { users: usersList = [], pagination } = response;
        const auth = response.auth;

        if (auth) {
          setUsers({
            data: usersList,
            pagination: {
              current: current || 1,
              pageSize: (pagination && pagination.pageSize) || pageSize,
              total: (pagination && pagination.total) || usersList.length,
            },
          });
        }
      })
      .catch((err) => {
        console.error("Erro ao carregar utilizador:", err);
        console.error("Erro details:", {
          message: err.message,
          name: err.name,
          stack: err.stack
        });
        setUsers({
          data: [],
          pagination: { current: 1, pageSize },
        });
      });
  }, []);

  useEffect(() => {    
    fetchApiUsers();
  }, [fetchApiUsers]);

  const addUsers = (data) => {
    
    let jsonData = {
        ...data,
        role: { name: 'user', scope: "notMember" },
      };

    // Obter token do localStorage
    const token = localStorage.getItem("token");
    const headers = {
      "Content-Type": "application/json"
    };
    
    // Adicionar token ao header se existir
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    fetch(buildApiUrl("/api/users"), {
      headers: headers,
      method: "POST",
      credentials: 'include',
      body: JSON.stringify(jsonData),
    })
      .then(async (response) => {
        const contentType = response.headers.get("content-type");
        const text = await response.text();
        
        if (!response.ok) {
          let errorData;
          if (contentType && contentType.includes("application/json") && text) {
            try {
              errorData = JSON.parse(text);
            } catch {
              errorData = { message: text.substring(0, 200) || "User duplicate" };
            }
          } else {
            errorData = { message: text.substring(0, 200) || "User duplicate" };
          }
          alert(errorData.message || "User duplicate");
          throw new Error(errorData.message || "Utilizador duplicado");
        }
        
        if (!text || text.trim().length === 0) {
          return {};
        }
        
        if (contentType && contentType.includes("application/json")) {
          try {
            return JSON.parse(text);
          } catch (jsonErr) {
            console.error("JSON parsing error in addUsers:", jsonErr);
            console.error("Response text:", text.substring(0, 500));
            throw new Error(`Invalid JSON response: ${jsonErr.message}`);
          }
        }
        
        return {};
      })
      .then((created) => {
        // atualizar lista após criar (recarregar página atual)
        const { pageSize = 10, current = 1 } = users.pagination || {};
        fetchApiUsers(pageSize, current);
      })
      .catch((error) => {
        console.error("Error creating user:", error);
      });
  };

  return (
    <Container>
      <Row>
        <Col className={styles.column}>
          <h3>Create User</h3>
          <div className={styles.container}>
            <form className={styles.form} onSubmit={handleSubmit(addUsers)}>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="name">
                  Name:
                </label>
                <input
                  id="name"
                  type="text"
                  name="name"
                  required
                  {...register("name")}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="password">
                  Password:
                </label>
                <input
                  id="password"
                  type="password"
                  name="password"
                  required
                  {...register("password")}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="email">
                  Email:
                </label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  required
                  {...register("email")}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="age">
                  Age :
                </label>
                <input id="age" name="age" type="number" {...register("age")} />
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="address">
                  Address :
                </label>
                <input
                  id="address"
                  name="address"
                  required
                  {...register("address")}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="country">
                  Country :
                </label>
                <input
                  id="country"
                  name="country"
                  required
                  {...register("country")}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="taxNumber">
                  Tax Number :
                </label>
                <input
                  id="taxNumber"
                  name="taxNumber"
                  type="number"
                  required
                  {...register("taxNumber")}
                />
              </div>
              <Row>
                <input className="submit" type="submit" />
              </Row>
            </form>
          </div>
        </Col>
        <Col>
          {/* passa apenas o array de linhas */}
          <Table columns={["name", "email", "taxNumber"]} rows={users.data} />
        </Col>
      </Row>
    </Container>
  );
};

export default Users;
