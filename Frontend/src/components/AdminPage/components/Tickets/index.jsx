import { useEffect, useState, useCallback } from "react";
import { Container, Row, Col } from "reactstrap";
import Table from "../../../Table";
import { useForm } from "react-hook-form";
import styles from "./styles.module.scss";

const Tickets = () => {
  const [tickets, setTickets] = useState({ data: [], pagination: {} });
  const [games, setGames] = useState([]);
  const [users, setUsers] = useState([]);
  const { register, handleSubmit, reset } = useForm();

  const fetchTickets = useCallback((pageSize = 10, current = 1) => {
    const skip = (Number(current) - 1) * Number(pageSize);
    const url =
      "/api/tickets?" +
      new URLSearchParams({
        limit: pageSize,
        skip,
      });

    fetch(url, {
      headers: { Accept: "application/json" },
      credentials: "include",
    })
      .then((res) => res.json())
      .then((response) => {
        const { tickets: list = [] } = response;
        if (response.auth) {
          setTickets({
            data: list,
            pagination: {
              current: current || 1,
              pageSize: pageSize,
              total: list.length,
            },
          });
        }
      })
      .catch(() => setTickets({ data: [], pagination: { current: 1, pageSize } }));
  }, []);

  const fetchGames = useCallback(() => {
    fetch("/api/games?limit=100&skip=0", {
      headers: { Accept: "application/json" },
      credentials: "include",
    })
      .then((res) => res.json())
      .then((response) => {
        if (response.auth && response.games) {
          setGames(response.games);
        }
      })
      .catch(() => setGames([]));
  }, []);

  const fetchUsers = useCallback(() => {
    fetch("/api/users?limit=100&skip=0", {
      headers: { Accept: "application/json" },
      credentials: "include",
    })
      .then((res) => res.json())
      .then((response) => {
        if (response.auth && response.users) {
          setUsers(response.users);
        }
      })
      .catch(() => setUsers([]));
  }, []);

  useEffect(() => {
    fetchTickets();
    fetchGames();
    fetchUsers();
  }, [fetchTickets, fetchGames, fetchUsers]);

  const addTicket = (data) => {
    const payload = {
      sector: data.sector,
      price: parseFloat(data.price),
      gameId: data.gameId,
      userId: data.userId,
    };

    fetch("/api/tickets/user", {
      headers: { "Content-Type": "application/json" },
      method: "POST",
      credentials: "include",
      body: JSON.stringify(payload),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Ticket duplicate or invalid");
        return res.json();
      })
      .then(() => {
        const { pageSize = 10, current = 1 } = tickets.pagination || {};
        reset();
        fetchTickets(pageSize, current);
      })
      .catch((err) => alert(err.message || "Erro ao criar ticket"));
  };

  return (
    <Container>
      <Row>
        <Col className={styles.column}>
          <h3>Create Ticket</h3>
          <div className={styles.container}>
            <form className={styles.form} onSubmit={handleSubmit(addTicket)}>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="sector">Sector:</label>
                <select id="sector" required {...register("sector")}>
                  <option value="">Select...</option>
                  <option value="GrandStand">GrandStand</option>
                  <option value="Tribune">Tribune</option>
                  <option value="Sides">Sides</option>
                  <option value="Bench">Bench</option>
                </select>
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="price">Price:</label>
                <input id="price" type="number" step="0.01" required {...register("price")} />
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="gameId">Game:</label>
                <select id="gameId" required {...register("gameId")}>
                  <option value="">Select a game...</option>
                  {games.map((game) => (
                    <option key={game._id} value={game._id}>
                      {game.name} - {game.date}
                    </option>
                  ))}
                </select>
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="userId">User:</label>
                <select id="userId" required {...register("userId")}>
                  <option value="">Select a user...</option>
                  {users.map((user) => (
                    <option key={user._id} value={user._id}>
                      {user.name} - {user.email}
                    </option>
                  ))}
                </select>
              </div>
              <Row>
                <input className="submit" type="submit" />
              </Row>
            </form>
          </div>
        </Col>
        <Col>
          <Table columns={["sector", "price", "gameId", "userId"]} rows={tickets.data} />
        </Col>
      </Row>
    </Container>
  );
};

export default Tickets;
