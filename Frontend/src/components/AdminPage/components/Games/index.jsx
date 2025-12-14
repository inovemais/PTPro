import { useEffect, useState, useCallback } from "react";
import { Container, Row, Col } from "reactstrap";
import Table from "../../../Table";
import { useForm } from "react-hook-form";
import styles from "./styles.module.scss";

const Games = () => {
  const [games, setGames] = useState({ data: [], pagination: {} });
  const [stadiums, setStadiums] = useState([]);
  const [imageBase64, setImageBase64] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const { register, handleSubmit, reset } = useForm();

  const fetchStadiums = useCallback(() => {
    const token = localStorage.getItem("token");
    const headers = { Accept: "application/json" };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    fetch("/api/stadium?limit=100&skip=0", {
      headers: headers,
      credentials: "include",
    })
      .then((res) => res.json())
      .then((response) => {
        if (response.auth && response.stadiums) {
          setStadiums(response.stadiums);
        }
      })
      .catch(() => setStadiums([]));
  }, []);

  const fetchGames = useCallback((pageSize = 10, current = 1) => {
    const skip = (Number(current) - 1) * Number(pageSize);
    const url =
      "/api/games?" +
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
      .then((res) => res.json())
      .then((response) => {
        const { games: list = [], pagination } = response;
        if (response.auth) {
          setGames({
            data: list,
            pagination: {
              current: current || 1,
              pageSize: (pagination && pagination.pageSize) || pageSize,
              total: (pagination && pagination.total) || list.length,
            },
          });
        }
      })
      .catch(() => setGames({ data: [], pagination: { current: 1, pageSize } }));
  }, []);

  useEffect(() => {
    fetchGames();
    fetchStadiums();
  }, [fetchGames, fetchStadiums]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validar tipo de ficheiro
      if (!file.type.match(/^image\/(jpeg|jpg|png|gif)$/)) {
        alert("Por favor, selecione uma imagem (JPEG, JPG, PNG ou GIF)");
        return;
      }

      // Validar tamanho (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert("A imagem deve ter no máximo 5MB");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result; // Já vem no formato data:image/...;base64,...
        setImageBase64(base64String);
        setImagePreview(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const addGame = (data) => {
    if (!imageBase64) {
      alert("Por favor, selecione uma imagem");
      return;
    }

    const payload = {
      name: data.name,
      date: data.date,
      image: imageBase64, // Enviar Base64 em vez de URL
      stadiumId: data.stadiumId,
      team: { home: data.teamHome, visitor: data.teamVisitor },
    };

    const token = localStorage.getItem("token");
    const headers = { "Content-Type": "application/json" };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    fetch("/api/games", {
      headers: headers,
      method: "POST",
      credentials: "include",
      body: JSON.stringify(payload),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Game duplicate or invalid");
        return res.json();
      })
      .then(() => {
        const { pageSize = 10, current = 1 } = games.pagination || {};
        reset();
        setImageBase64(null);
        setImagePreview(null);
        fetchGames(pageSize, current);
      })
      .catch((err) => alert(err.message));
  };

  return (
    <Container>
      <Row>
        <Col className={styles.column}>
          <h3>Create Game</h3>
          <div className={styles.container}>
            <form className={styles.form} onSubmit={handleSubmit(addGame)}>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="name">Name:</label>
                <input id="name" type="text" required {...register("name")} />
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="date">Date:</label>
                <input id="date" type="date" required {...register("date")} />
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="image">Image:</label>
                <input 
                  id="image" 
                  type="file" 
                  accept="image/jpeg,image/jpg,image/png,image/gif"
                  onChange={handleImageChange}
                  required
                />
                {imagePreview && (
                  <div style={{ marginTop: '10px' }}>
                    <img 
                      src={imagePreview} 
                      alt="Preview" 
                      style={{ maxWidth: '200px', maxHeight: '200px', border: '1px solid #ddd', borderRadius: '4px' }}
                    />
                  </div>
                )}
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="stadiumId">Stadium:</label>
                <select id="stadiumId" required {...register("stadiumId")}>
                  <option value="">Select a stadium...</option>
                  {stadiums.map((stadium) => (
                    <option key={stadium._id} value={stadium._id}>
                      {stadium.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="teamHome">Team Home:</label>
                <input id="teamHome" type="text" required {...register("teamHome")} />
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="teamVisitor">Team Visitor:</label>
                <input id="teamVisitor" type="text" required {...register("teamVisitor")} />
              </div>
              <Row>
                <input className="submit" type="submit" />
              </Row>
            </form>
          </div>
        </Col>
        <Col>
          <Table columns={["name", "date", "team.home", "team.visitor"]} rows={games.data} />
        </Col>
      </Row>
    </Container>
  );
};

export default Games;