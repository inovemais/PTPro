import { useState } from "react";

export const usePostData = (url = "") => {
  const [isError, setError] = useState(false);
  const [isLoading, setLoading] = useState(false);
  const [data, setData] = useState({});

  const addData = (data) => {
    setLoading(true);
    fetch(`/api/${url}?`, {
      headers: {
        "Content-Type": "application/json",
      },
      method: "POST",
      credentials: "include",
      body: JSON.stringify(data),
    })
      .then((response) => {
        if (response.ok) {
          return response.json();
        } else {
          throw new Error("Error ao adicionar");
        }
      })
      .then((jsonData) => {
        setData(jsonData);
      })
      .catch((error) => {
        console.error("Error:", error);
        setError(error);
        alert(error.message || "Erro ao adicionar");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return {
    data,
    isError,
    isLoading,
    addData: addData,
  };
};
