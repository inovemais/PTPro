import { useEffect, useState, useCallback } from "react";
import { Container, Row, Col } from "reactstrap";
import Table from "../../../Table";
import { useForm } from "react-hook-form";
import { buildApiUrl } from "../../../../config/api";
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
    const queryParams = new URLSearchParams({
      limit: pageSize,
      skip,
    });
    const url = buildApiUrl(`/api/stadium?${queryParams}`);

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
          console.error("JSON parsing error in fetchStadiums:", jsonErr);
          console.error("Response text:", text.substring(0, 500));
          throw new Error(`Invalid JSON response: ${jsonErr.message}. Response preview: ${text.substring(0, 200)}`);
        }
      })
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
      .catch((err) => {
        console.error("Erro ao carregar estádios:", err);
        setStadiums({ data: [], pagination: { current: 1, pageSize } });
      });
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

    fetch(buildApiUrl("/api/stadium"), {
      headers: headers,
      method: "POST",
      credentials: "include",
      body: JSON.stringify(payload),
    })
      .then(async (res) => {
        const contentType = res.headers.get("content-type");
        const text = await res.text();
        
        if (!res.ok) {
          let errorMessage = "Stadium duplicate or invalid";
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
            console.error("JSON parsing error in addStadium:", jsonErr);
            console.error("Response text:", text.substring(0, 500));
            throw new Error(`Invalid JSON response: ${jsonErr.message}`);
          }
        }
        
        return {};
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
