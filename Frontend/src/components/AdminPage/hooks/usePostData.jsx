import { useState } from "react";

export const usePostData = (url = "") => {
  const [isError, setError] = useState(false);
  const [isLoading, setLoading] = useState(false);
  const [data, setData] = useState({});

  const addData = (data) => {
    setLoading(true);
    
    // Obter token do localStorage
    const token = localStorage.getItem("token");
    const headers = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    fetch(`/api/${url}?`, {
      headers: headers,
      method: "POST",
      credentials: "include",
      body: JSON.stringify(data),
    })
      .then(async (response) => {
        const contentType = response.headers.get("content-type");
        const text = await response.text();
        
        if (!response.ok) {
          let errorMessage = "Error ao adicionar";
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
            console.error("JSON parsing error in usePostData:", jsonErr);
            console.error("Response text:", text.substring(0, 500));
            throw new Error(`Invalid JSON response: ${jsonErr.message}`);
          }
        }
        
        return {};
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
