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

    fetch(querie, {
      headers: { Accept: "application/json" },
      credentials: "include",
    })
    .then((response) => response.json())
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
      console.error("Error:", error);
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
