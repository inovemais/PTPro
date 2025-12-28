import { useEffect, useState } from "react";
import { Container, Row, Col, Card, CardBody, CardTitle, CardText } from "reactstrap";
import { Link } from "react-router-dom";
import styles from "./styles.module.scss";

const PublicGamesPage = () => {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGames();
  }, []);

  const fetchGames = () => {
    fetch("/api/games/public?limit=20&skip=0", {
      headers: { Accept: "application/json" },
    })
      .then((res) => res.json())
      .then((response) => {
        if (response.games) {
          setGames(response.games);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching games:", err);
        setLoading(false);
      });
  };

  if (loading) {
    return (
      <Container className={styles.container}>
        <div>Loading games...</div>
      </Container>
    );
  }

  return (
    <Container className={styles.container}>
      <Row>
        <Col>
          <h1 className={styles.title}>Upcoming Games</h1>
          <p className={styles.subtitle}>
            View available games and purchase tickets.{" "}
            <Link to="/">Login or Register</Link> to buy tickets.
          </p>
        </Col>
      </Row>
      <Row>
        {games.length === 0 ? (
          <Col>
            <p>No games available at the moment.</p>
          </Col>
        ) : (
          games.map((game) => (
            <Col key={game._id} md={6} lg={4} className={styles.gameCard}>
              <Card>
                {game.image && (
                  <img
                    src={game.image}
                    alt={game.name}
                    className={styles.gameImage}
                  />
                )}
                <CardBody>
                  <CardTitle tag="h5">{game.name}</CardTitle>
                  <CardText>
                    <strong>Date:</strong> {game.date}
                  </CardText>
                  {game.team && (
                    <CardText>
                      <strong>Teams:</strong> {game.team.home} vs {game.team.visitor}
                    </CardText>
                  )}
                  {game.stadiumId && game.stadiumId.name && (
                    <CardText>
                      <strong>Stadium:</strong> {game.stadiumId.name}
                    </CardText>
                  )}
                  <Link
                    to={`/game/${game._id}`}
                    className={`btn btn-primary ${styles.viewButton}`}
                  >
                    View Details & Tickets
                  </Link>
                </CardBody>
              </Card>
            </Col>
          ))
        )}
      </Row>
    </Container>
  );
};

export default PublicGamesPage;

