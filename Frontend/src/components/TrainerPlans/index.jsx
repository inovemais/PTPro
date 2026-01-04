import { useEffect, useState } from "react";
import { Container, Row, Col, Card, CardBody, CardTitle, Button, Form, FormGroup, Label, Input } from "reactstrap";
import { buildApiUrl } from "../../config/api";
import styles from "./styles.module.scss";

// Página simplificada para personal trainers gerirem planos de treino
const TrainerPlans = () => {
  const [clients, setClients] = useState([]);
  const [plans, setPlans] = useState([]);
  const [selectedClientId, setSelectedClientId] = useState("");
  const [form, setForm] = useState({
    name: "",
    description: "",
    frequencyPerWeek: 3,
    startDate: "",
    workoutDates: ["", "", ""], // Array inicial para 3 datas
  });

  useEffect(() => {
    fetchClients();
  }, []);

  useEffect(() => {
    if (selectedClientId) {
      fetchPlans(selectedClientId);
    }
  }, [selectedClientId]);

  const authHeaders = () => {
    const token = localStorage.getItem("token");
    const headers = { "Content-Type": "application/json", Accept: "application/json" };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    return headers;
  };

  const fetchClients = () => {
    fetch(buildApiUrl("/api/clients?limit=100&skip=0"), {
      headers: authHeaders(),
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        // Handle standardized response format: {success: true, data: [...], meta: {...}}
        const clientsList = data.success && data.data ? data.data : (data.clients || []);
        setClients(clientsList);
      })
      .catch((err) => {
        console.error("Error fetching clients:", err);
      });
  };

  const fetchPlans = (clientId) => {
    fetch(buildApiUrl(`/api/plans?clientId=${clientId}&limit=50&skip=0`), {
      headers: authHeaders(),
      credentials: "include",
    })
      .then((res) => res.json())
      .then((data) => {
        // Handle standardized response format: {success: true, data: [...], meta: {...}}
        const plansList = data.success && data.data ? data.data : (data.plans || []);
        setPlans(plansList);
      })
      .catch((err) => {
        console.error("Error fetching plans:", err);
      });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => {
      if (name === "frequencyPerWeek") {
        const newFrequency = parseInt(value);
        // Ajustar o array de datas baseado na nova frequência
        const newWorkoutDates = Array(newFrequency).fill("").map((_, index) => 
          prev.workoutDates[index] || ""
        );
        return {
          ...prev,
          [name]: value,
          workoutDates: newWorkoutDates,
        };
      }
      return {
        ...prev,
        [name]: value,
      };
    });
  };

  const handleWorkoutDateChange = (index, value) => {
    setForm((prev) => {
      const newWorkoutDates = [...prev.workoutDates];
      newWorkoutDates[index] = value;
      return {
        ...prev,
        workoutDates: newWorkoutDates,
      };
    });
  };

  const handleCreatePlan = (e) => {
    e.preventDefault();
    if (!selectedClientId) return;

    // Plano simples sem definição detalhada de sessões (pode ser editado depois)
    const body = {
      clientId: selectedClientId,
      name: form.name,
      description: form.description,
      frequencyPerWeek: Number(form.frequencyPerWeek),
      startDate: form.startDate || new Date().toISOString(),
      workoutDates: form.workoutDates.filter(date => date !== "").map(date => new Date(date).toISOString()),
    };

    fetch(buildApiUrl("/api/plans"), {
      method: "POST",
      headers: authHeaders(),
      credentials: "include",
      body: JSON.stringify(body),
    })
      .then((res) => res.json())
      .then(() => {
        setForm({
          name: "",
          description: "",
          frequencyPerWeek: 3,
          startDate: "",
          workoutDates: ["", "", ""],
        });
        fetchPlans(selectedClientId);
      })
      .catch((err) => {
        console.error("Error creating plan:", err);
      });
  };

  return (
    <Container className={styles.container}>
      <Row>
        <Col>
          <h2>Planos de Treino (Personal Trainer)</h2>
        </Col>
      </Row>

      <Row className={styles.section}>
        <Col md="4">
          <Card>
            <CardBody>
              <CardTitle tag="h3">Clientes</CardTitle>
              <FormGroup>
                <Label for="clientSelect">Selecionar cliente</Label>
                <Input
                  id="clientSelect"
                  type="select"
                  value={selectedClientId}
                  onChange={(e) => setSelectedClientId(e.target.value)}
                >
                  <option value="">Escolha um cliente</option>
                  {clients.map((c) => (
                    <option key={c._id} value={c._id}>
                      {c.userId?.name || "Cliente sem nome"}
                    </option>
                  ))}
                </Input>
              </FormGroup>
            </CardBody>
          </Card>
        </Col>

        <Col md="8">
          <Card>
            <CardBody>
              <CardTitle tag="h3">Criar novo plano</CardTitle>
              <Form onSubmit={handleCreatePlan}>
                <FormGroup>
                  <Label for="name">Nome</Label>
                  <Input
                    id="name"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    required
                  />
                </FormGroup>
                <FormGroup>
                  <Label for="description">Descrição</Label>
                  <Input
                    id="description"
                    name="description"
                    type="textarea"
                    value={form.description}
                    onChange={handleChange}
                  />
                </FormGroup>
                <FormGroup>
                  <Label for="frequencyPerWeek">Frequência semanal</Label>
                  <Input
                    id="frequencyPerWeek"
                    name="frequencyPerWeek"
                    type="select"
                    value={form.frequencyPerWeek}
                    onChange={handleChange}
                  >
                    <option value={3}>3x por semana</option>
                    <option value={4}>4x por semana</option>
                    <option value={5}>5x por semana</option>
                  </Input>
                </FormGroup>
                <FormGroup>
                  <Label for="startDate">Data de início</Label>
                  <Input
                    id="startDate"
                    name="startDate"
                    type="date"
                    value={form.startDate}
                    onChange={handleChange}
                  />
                </FormGroup>
                <FormGroup>
                  <Label>Datas dos treinos ({form.frequencyPerWeek}x por semana) *</Label>
                  {form.workoutDates.map((date, index) => (
                    <FormGroup key={index} className="mt-2">
                      <Label for={`workoutDate${index}`}>Treino {index + 1}</Label>
                      <Input
                        id={`workoutDate${index}`}
                        type="date"
                        value={date}
                        onChange={(e) => handleWorkoutDateChange(index, e.target.value)}
                        required
                        min={form.startDate || new Date().toISOString().split('T')[0]}
                      />
                    </FormGroup>
                  ))}
                </FormGroup>
                <Button color="primary" type="submit" disabled={!selectedClientId}>
                  Criar plano
                </Button>
              </Form>
            </CardBody>
          </Card>
        </Col>
      </Row>

      <Row className={styles.section}>
        <Col>
          <Card>
            <CardBody>
              <CardTitle tag="h3">Planos do cliente</CardTitle>
              {!selectedClientId ? (
                <p>Selecione um cliente para ver os planos.</p>
              ) : plans.length === 0 ? (
                <p>Este cliente ainda não tem planos.</p>
              ) : (
                <ul className={styles.planList}>
                  {plans.map((plan) => (
                    <li key={plan._id}>
                      <strong>{plan.name}</strong> – {plan.description}
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default TrainerPlans;


