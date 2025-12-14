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

    const token = localStorage.getItem("token");
    const headers = { Accept: "application/json" };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    fetch(url, {
      headers: headers,
      credentials: "include",
    })
      .then(async (response) => {
        if (!response.ok) {
          let errorText;
          try {
            errorText = await response.text();
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
        
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          const text = await response.text();
          throw new Error(`Expected JSON but got ${contentType}. Response: ${text.substring(0, 100)}`);
        }
        
        const text = await response.text();
        if (!text || text.trim().length === 0) {
          throw new Error("Empty response from server");
        }
        
        try {
          return JSON.parse(text);
        } catch (jsonErr) {
          console.error("JSON parsing error in fetchTickets:", jsonErr);
          console.error("Response text:", text.substring(0, 500));
          throw new Error(`Invalid JSON response: ${jsonErr.message}. Response preview: ${text.substring(0, 200)}`);
        }
      })
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
      .catch((err) => {
        console.error("Erro ao carregar bilhetes:", err);
        setTickets({ data: [], pagination: { current: 1, pageSize } });
      });
  }, []);

  const fetchGames = useCallback(() => {
    const token = localStorage.getItem("token");
    const headers = { Accept: "application/json" };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    fetch("/api/games?limit=100&skip=0", {
      headers: headers,
      credentials: "include",
    })
      .then(async (response) => {
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP error! status: ${response.status}, body: ${errorText.substring(0, 200)}`);
        }
        
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          const text = await response.text();
          throw new Error(`Expected JSON but got ${contentType}. Response: ${text.substring(0, 100)}`);
        }
        
        const text = await response.text();
        if (!text || text.trim().length === 0) {
          throw new Error("Empty response from server");
        }
        
        try {
          return JSON.parse(text);
        } catch (jsonErr) {
          console.error("JSON parsing error in fetchGames:", jsonErr);
          console.error("Response text:", text.substring(0, 500));
          throw new Error(`Invalid JSON response: ${jsonErr.message}`);
        }
      })
      .then((response) => {
        if (response.auth && response.games) {
          setGames(response.games);
        }
      })
      .catch((err) => {
        console.error("Erro ao carregar jogos:", err);
        setGames([]);
      });
  }, []);

  const fetchUsers = useCallback(() => {
    const token = localStorage.getItem("token");
    const headers = { Accept: "application/json" };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    fetch("/api/users?limit=100&skip=0", {
      headers: headers,
      credentials: "include",
    })
      .then(async (response) => {
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP error! status: ${response.status}, body: ${errorText.substring(0, 200)}`);
        }
        
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          const text = await response.text();
          throw new Error(`Expected JSON but got ${contentType}. Response: ${text.substring(0, 100)}`);
        }
        
        const text = await response.text();
        if (!text || text.trim().length === 0) {
          throw new Error("Empty response from server");
        }
        
        try {
          return JSON.parse(text);
        } catch (jsonErr) {
          console.error("JSON parsing error in fetchUsers:", jsonErr);
          console.error("Response text:", text.substring(0, 500));
          throw new Error(`Invalid JSON response: ${jsonErr.message}`);
        }
      })
      .then((response) => {
        if (response.auth && response.users) {
          setUsers(response.users);
        }
      })
      .catch((err) => {
        console.error("Erro ao carregar utilizadores:", err);
        setUsers([]);
      });
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

    const token = localStorage.getItem("token");
    const headers = { "Content-Type": "application/json" };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    fetch("/api/tickets/user", {
      headers: headers,
      method: "POST",
      credentials: "include",
      body: JSON.stringify(payload),
    })
      .then(async (res) => {
        const contentType = res.headers.get("content-type");
        const text = await res.text();
        
        if (!res.ok) {
          let errorMessage = "Ticket duplicate or invalid";
          if (contentType && contentType.includes("application/json") && text) {
            try {
              const errorData = JSON.parse(text);
              errorMessage = errorData.message || errorData.error || errorMessage;
            } catch {
              errorMessage = text.substring(0, 200) || errorMessage;
            }
          } else if (text) {
            errorMessage = text.substring(0, 200) || errorMessage;
          }
          throw new Error(errorMessage);
        }
        
        if (!text || text.trim().length === 0) {
          return {};
        }
        
        if (contentType && contentType.includes("application/json")) {
          try {
            return JSON.parse(text);
          } catch (jsonErr) {
            console.error("JSON parsing error in addTicket:", jsonErr);
            console.error("Response text:", text.substring(0, 500));
            throw new Error(`Invalid JSON response: ${jsonErr.message}`);
          }
        }
        
        return {};
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
