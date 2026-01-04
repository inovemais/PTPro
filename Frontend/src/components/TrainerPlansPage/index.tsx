import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Container, Row, Col, Card, CardBody, CardTitle, Button, Form, FormGroup, Label, Input } from "reactstrap";
import { buildApiUrl } from "../../config/api";
import styles from "./styles.module.scss";

interface Plan {
  _id: string;
  name: string;
  description?: string;
  frequencyPerWeek: number;
  startDate: string;
  isActive: boolean;
}

const TrainerPlansPage = () => {
  const { clientId } = useParams<{ clientId: string }>();
  const navigate = useNavigate();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [form, setForm] = useState({
    name: "",
    description: "",
    frequencyPerWeek: 3,
    startDate: "",
    workoutDates: ["", "", ""], // Array inicial para 3 datas
  });

  useEffect(() => {
    if (clientId) {
      fetchPlans();
    }
  }, [clientId]);

  const authHeaders = () => {
    const token = localStorage.getItem("token");
    const headers: HeadersInit = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    return headers;
  };

  const fetchPlans = () => {
    if (!clientId) return;

    fetch(
      buildApiUrl(`/api/plans?clientId=${clientId}&limit=50&skip=0`),
      {
        headers: authHeaders(),
        credentials: "include",
      }
    )
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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

  const handleWorkoutDateChange = (index: number, value: string) => {
    setForm((prev) => {
      const newWorkoutDates = [...prev.workoutDates];
      newWorkoutDates[index] = value;
      return {
        ...prev,
        workoutDates: newWorkoutDates,
      };
    });
  };

  const handleCreatePlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId) return;

    const body = {
      clientId: clientId,
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
        fetchPlans();
      })
      .catch((err) => {
        console.error("Error creating plan:", err);
      });
  };

  return (
    <Container className={styles.container}>
      <Row>
        <Col>
          <Button
            color="secondary"
            onClick={() => navigate(-1)}
            className={styles.backButton}
          >
            ← Back
          </Button>
          <h2>Training Plans for Client</h2>
        </Col>
      </Row>

      <Row className={styles.section}>
        <Col md="6">
          <Card>
            <CardBody>
              <CardTitle tag="h4">Create New Plan</CardTitle>
              <Form onSubmit={handleCreatePlan}>
                <FormGroup>
                  <Label for="name">Name</Label>
                  <Input
                    id="name"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    required
                  />
                </FormGroup>
                <FormGroup>
                  <Label for="description">Description</Label>
                  <Input
                    id="description"
                    name="description"
                    type="textarea"
                    value={form.description}
                    onChange={handleChange}
                  />
                </FormGroup>
                <FormGroup>
                  <Label for="frequencyPerWeek">Frequency per Week</Label>
                  <Input
                    id="frequencyPerWeek"
                    name="frequencyPerWeek"
                    type="select"
                    value={form.frequencyPerWeek}
                    onChange={handleChange}
                  >
                    <option value={3}>3x per week</option>
                    <option value={4}>4x per week</option>
                    <option value={5}>5x per week</option>
                  </Input>
                </FormGroup>
                <FormGroup>
                  <Label for="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    name="startDate"
                    type="date"
                    value={form.startDate}
                    onChange={handleChange}
                  />
                </FormGroup>
                <FormGroup>
                  <Label>Workout Dates ({form.frequencyPerWeek}x per week) *</Label>
                  {form.workoutDates.map((date, index) => (
                    <FormGroup key={index} className="mt-2">
                      <Label for={`workoutDate${index}`}>Workout {index + 1}</Label>
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
                <Button color="primary" type="submit">
                  Create Plan
                </Button>
              </Form>
            </CardBody>
          </Card>
        </Col>

        <Col md="6">
          <Card>
            <CardBody>
              <CardTitle tag="h4">Existing Plans</CardTitle>
              {plans.length === 0 ? (
                <p>No plans created yet.</p>
              ) : (
                <ul className={styles.planList}>
                  {plans.map((plan) => (
                    <li key={plan._id}>
                      <strong>{plan.name}</strong>
                      {plan.description && ` – ${plan.description}`}
                      <br />
                      <small>
                        Frequency: {plan.frequencyPerWeek}x/week | Status:{" "}
                        {plan.isActive ? "Active" : "Inactive"}
                      </small>
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

export default TrainerPlansPage;

