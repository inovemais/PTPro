import { useCallback, useEffect, useState } from "react";

export const useGetData = (url = "", pageSize, current) => {
  const [isError, setError] = useState(false);
  const [isLoading, setLoading] = useState(false);
  const [data, setData] = useState({
    data: [],
    pagination: {
      current: 1,
      pageSize: 10,
    },
  });

  const fetchingData = useCallback(() => {
    const skip = (Number(current) - 1) * Number(pageSize);
    const querie =
      `/api/${url}?` +
      new URLSearchParams({
        limit: pageSize,
        skip,
      });

    setLoading(true);

    // Obter token do localStorage
    const token = localStorage.getItem("token");
    const headers = { Accept: "application/json" };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    fetch(querie, {
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
        console.error("JSON parsing error in useGetData:", jsonErr);
        console.error("Response text:", text.substring(0, 500));
        throw new Error(`Invalid JSON response: ${jsonErr.message}`);
      }
    })
    .then((response) => {
      const { data = [], pagination } = response;
      const auth = response.auth;

      if (auth) {
        setData({
          data: data,
          pagination: {
            current: current || 1,
            pageSize: pagination.pageSize || 10,
            total: pagination.total || 5,
          },
        });
      }
    })
    .catch((error) => {
      console.error("Error in useGetData:", error);
      setError(error);
    })
    .finally(() => {
      setLoading(false);
    });
  }, [current, pageSize, url]);

  useEffect(() => {
    fetchingData();
  }, [fetchingData]);

  return {
    data,
    isError,
    isLoading,
    load: fetchingData,
  };
};
