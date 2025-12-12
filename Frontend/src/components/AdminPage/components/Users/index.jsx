import { useEffect, useState, useCallback } from "react";
import { Container, Row, Col } from "reactstrap";
import Table from "../../../Table";
import { useForm } from "react-hook-form";
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
    const url =
      "/api/users?" +
      new URLSearchParams({
        limit: pageSize,
        skip,
      });

    fetch(url, {
      headers: { Accept: "application/json" },
      credentials: 'include'
    })
      .then((response) => response.json())
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

    fetch("/api/users", {
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
      credentials: 'include',
      body: JSON.stringify(jsonData),
    })
      .then((response) => {
        if (response.ok) {
          return response.json();
        } else {
          alert("User duplicate");
          throw new Error("Utilizador duplicado");
        }
      })
      .then((created) => {
        // atualizar lista após criar (recarregar página atual)
        const { pageSize = 10, current = 1 } = users.pagination || {};
        fetchApiUsers(pageSize, current);
      })
      .catch((error) => {
        console.error("Error:", error);
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
