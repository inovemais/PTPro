import { useEffect, useState } from "react";
import { Container, Row, Col, Card, CardBody, CardTitle, Button, FormGroup, Label, Input } from "reactstrap";
import { buildApiUrl } from "../../config/api";
import styles from "./styles.module.scss";

const weekdays = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
const weekdayLabels = {
  monday: "Segunda",
  tuesday: "Terça",
  wednesday: "Quarta",
  thursday: "Quinta",
  friday: "Sexta",
  saturday: "Sábado",
  sunday: "Domingo",
};

const ClientCalendar = () => {
  const [client, setClient] = useState(null);
  const [plans, setPlans] = useState([]);
  const [logs, setLogs] = useState([]);
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().substring(0, 10));
  const [status, setStatus] = useState("completed");
  const [reason, setReason] = useState("");

  useEffect(() => {
    fetchClientAndPlans();
  }, []);

  const authHeaders = () => {
    const token = localStorage.getItem("token");
    const headers = { "Content-Type": "application/json", Accept: "application/json" };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    return headers;
  };

  const fetchClientAndPlans = async () => {
    try {
      const clientRes = await fetch(buildApiUrl("/api/clients/me"), {
        headers: authHeaders(),
        credentials: "include",
      });
      const clientData = await clientRes.json();
      setClient(clientData);

      if (clientData && clientData._id) {
        const plansRes = await fetch(
          buildApiUrl(`/api/workouts/plans?clientId=${clientData._id}&isActive=true&limit=20&skip=0`),
          {
            headers: authHeaders(),
            credentials: "include",
          }
        );
        const plansData = await plansRes.json();
        setPlans(plansData.plans || []);

        const logsRes = await fetch(
          buildApiUrl(`/api/workouts/logs?clientId=${clientData._id}&limit=200&skip=0`),
          {
            headers: authHeaders(),
            credentials: "include",
          }
        );
        const logsData = await logsRes.json();
        setLogs(logsData.logs || []);
      }
    } catch (err) {
      console.error("Error loading client calendar data:", err);
    }
  };

  const getSessionsByWeekday = () => {
    const sessionsByDay = {};
    weekdays.forEach((d) => {
      sessionsByDay[d] = [];
    });

    plans.forEach((plan) => {
      (plan.sessions || []).forEach((session) => {
        if (sessionsByDay[session.weekday]) {
          sessionsByDay[session.weekday].push({
            planName: plan.name,
            exercises: session.exercises || [],
          });
        }
      });
    });

    return sessionsByDay;
  };

  const getStatusForDate = (dateIso) => {
    const target = new Date(dateIso).toDateString();
    const log = logs.find((l) => new Date(l.date).toDateString() === target);
    if (!log) return null;
    return log.status;
  };

  const handleRegister = async () => {
    if (!client || !client._id || plans.length === 0) return;

    // Por simplicidade, usar o primeiro plano ativo
    const plan = plans[0];

    const body = {
      workoutPlanId: plan._id,
      clientId: client._id,
      trainerId: plan.trainerId,
      date: selectedDate,
      status,
      reason: status === "missed" ? reason : "",
    };

    try {
      await fetch(buildApiUrl("/api/workouts/logs"), {
        method: "POST",
        headers: authHeaders(),
        credentials: "include",
        body: JSON.stringify(body),
      });
      setReason("");
      fetchClientAndPlans();
    } catch (err) {
      console.error("Error registering workout log:", err);
    }
  };

  const sessionsByDay = getSessionsByWeekday();

  return (
    <Container className={styles.container}>
      <Row>
        <Col>
          <h2>O meu plano de treino</h2>
        </Col>
      </Row>

      <Row className={styles.section}>
        <Col>
          <Card>
            <CardBody>
              <CardTitle tag="h3">Calendário semanal</CardTitle>
              <div className={styles.calendarGrid}>
                {weekdays.map((day) => {
                  const todaysStatus = getStatusForDate(new Date().toISOString().substring(0, 10));
                  return (
                    <div key={day} className={styles.dayColumn}>
                      <div className={styles.dayHeader}>{weekdayLabels[day]}</div>
                      <div className={styles.dayBody}>
                        {sessionsByDay[day].length === 0 ? (
                          <p className={styles.empty}>Sem treino</p>
                        ) : (
                          sessionsByDay[day].map((s, idx) => (
                            <div key={idx} className={styles.sessionCard}>
                              <strong>{s.planName}</strong>
                              <ul>
                                {s.exercises.map((ex, i) => (
                                  <li key={i}>
                                    {ex.name} – {ex.sets}x{ex.reps}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))
                        )}
                      </div>
                      {day === weekdays[new Date(selectedDate).getDay() - 1] && todaysStatus && (
                        <div className={styles.statusTag}>Estado de hoje: {todaysStatus}</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardBody>
          </Card>
        </Col>
      </Row>

      <Row className={styles.section}>
        <Col md="6">
          <Card>
            <CardBody>
              <CardTitle tag="h3">Registar cumprimento</CardTitle>
              <FormGroup>
                <Label for="date">Dia</Label>
                <Input
                  id="date"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </FormGroup>
              <FormGroup>
                <Label for="status">Estado</Label>
                <Input
                  id="status"
                  type="select"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="completed">Cumprido</option>
                  <option value="missed">Não cumprido</option>
                  <option value="partial">Parcial</option>
                </Input>
              </FormGroup>
              {status === "missed" && (
                <FormGroup>
                  <Label for="reason">Motivo</Label>
                  <Input
                    id="reason"
                    type="textarea"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  />
                </FormGroup>
              )}
              <Button color="primary" onClick={handleRegister} disabled={!client || plans.length === 0}>
                Guardar registo
              </Button>
            </CardBody>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default ClientCalendar;


