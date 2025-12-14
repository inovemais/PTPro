import { useEffect, useState, useCallback } from "react";
import { Container, Row, Col } from "reactstrap";
import Table from "../../../Table";
import { useForm } from "react-hook-form";
import styles from "./styles.module.scss";

const Stadium = () => {
  const [stadiums, setStadiums] = useState({ data: [], pagination: {} });
  const { register, handleSubmit, reset, watch } = useForm();
  
  // Observar mudanças nos campos de setor para atualizar títulos dinamicamente
  const sector1 = watch("sector1");
  const sector2 = watch("sector2");
  const sector3 = watch("sector3");

  const fetchStadiums = useCallback((pageSize = 10, current = 1) => {
    const skip = (Number(current) - 1) * Number(pageSize);
    const url =
      "/api/stadium?" +
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
        const { stadiums: list = [], pagination } = response;
        if (response.auth) {
          setStadiums({
            data: list,
            pagination: {
              current: current || 1,
              pageSize: (pagination && pagination.pageSize) || pageSize,
              total: (pagination && pagination.total) || list.length,
            },
          });
        }
      })
      .catch(() => setStadiums({ data: [], pagination: { current: 1, pageSize } }));
  }, []);

  useEffect(() => {
    fetchStadiums();
  }, [fetchStadiums]);

  const addStadium = (data) => {
    const sectors = [];
    
    // Processar setores do formulário
    if (data.sector1 && data.price1 && data.priceMember1) {
      sectors.push({
        price: parseFloat(data.price1),
        priceMember: parseFloat(data.priceMember1),
        sector: [data.sector1],
      });
    }
    if (data.sector2 && data.price2 && data.priceMember2) {
      sectors.push({
        price: parseFloat(data.price2),
        priceMember: parseFloat(data.priceMember2),
        sector: [data.sector2],
      });
    }
    if (data.sector3 && data.price3 && data.priceMember3) {
      sectors.push({
        price: parseFloat(data.price3),
        priceMember: parseFloat(data.priceMember3),
        sector: [data.sector3],
      });
    }

    // Validar que pelo menos um setor foi preenchido
    if (sectors.length === 0) {
      alert("Por favor, adicione pelo menos um setor com preços.");
      return;
    }

    const payload = {
      name: data.name,
      photo: data.photo || "",
      sectors: sectors,
    };

    const token = localStorage.getItem("token");
    const headers = { "Content-Type": "application/json" };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    fetch("/api/stadium", {
      headers: headers,
      method: "POST",
      credentials: "include",
      body: JSON.stringify(payload),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Stadium duplicate or invalid");
        return res.json();
      })
      .then(() => {
        const { pageSize = 10, current = 1 } = stadiums.pagination || {};
        reset();
        fetchStadiums(pageSize, current);
      })
      .catch((err) => alert(err.message || "Erro ao criar estádio"));
  };

  return (
    <Container>
      <Row>
        <Col className={styles.column}>
          <h3>Create Stadium</h3>
          <div className={styles.container}>
            <form className={styles.form} onSubmit={handleSubmit(addStadium)}>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="name">Name:</label>
                <input id="name" type="text" required {...register("name")} />
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="photo">Photo URL:</label>
                <input id="photo" type="text" {...register("photo")} />
              </div>
              
              <h4>Setor 1{sector1 ? ` - ${sector1}` : ""}</h4>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="sector1">Sector Type:</label>
                <select id="sector1" {...register("sector1")}>
                  <option value="">Select...</option>
                  <option value="GrandStand">GrandStand</option>
                  <option value="Tribune">Tribune</option>
                  <option value="Sides">Sides</option>
                  <option value="Bench">Bench</option>
                </select>
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="price1">Price:</label>
                <input id="price1" type="number" step="0.01" {...register("price1")} />
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="priceMember1">Price Member:</label>
                <input id="priceMember1" type="number" step="0.01" {...register("priceMember1")} />
              </div>

              <h4>Setor 2{sector2 ? ` - ${sector2}` : " (Opcional)"}</h4>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="sector2">Sector Type:</label>
                <select id="sector2" {...register("sector2")}>
                  <option value="">Select...</option>
                  <option value="GrandStand">GrandStand</option>
                  <option value="Tribune">Tribune</option>
                  <option value="Sides">Sides</option>
                  <option value="Bench">Bench</option>
                </select>
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="price2">Price:</label>
                <input id="price2" type="number" step="0.01" {...register("price2")} />
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="priceMember2">Price Member:</label>
                <input id="priceMember2" type="number" step="0.01" {...register("priceMember2")} />
              </div>

              <h4>Setor 3{sector3 ? ` - ${sector3}` : " (Opcional)"}</h4>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="sector3">Sector Type:</label>
                <select id="sector3" {...register("sector3")}>
                  <option value="">Select...</option>
                  <option value="GrandStand">GrandStand</option>
                  <option value="Tribune">Tribune</option>
                  <option value="Sides">Sides</option>
                  <option value="Bench">Bench</option>
                </select>
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="price3">Price:</label>
                <input id="price3" type="number" step="0.01" {...register("price3")} />
              </div>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="priceMember3">Price Member:</label>
                <input id="priceMember3" type="number" step="0.01" {...register("priceMember3")} />
              </div>
              

              <Row>
                <input className="submit" type="submit" />
              </Row>
            </form>
          </div>
        </Col>
        <Col>
          <Table 
            columns={["name", "photo", "sectors"]} 
            rows={stadiums.data.map(stadium => ({
              ...stadium,
              sectors: stadium.sectors && stadium.sectors.length > 0 
                ? `${stadium.sectors.length} setor(es)` 
                : "Sem setores"
            }))} 
          />
        </Col>
      </Row>
    </Container>
  );
};

export default Stadium;
