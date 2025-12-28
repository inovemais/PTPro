import { useState, useEffect, useCallback } from "react";

/**
 * Hook para obter dados de um membro por ID
 * @param {string} memberId - ID do membro a buscar
 * @param {boolean} autoFetch - Se deve buscar automaticamente quando o componente monta (default: true)
 * @returns {object} - { member, isLoading, isError, fetchMember }
 */
export const useGetMember = (memberId = null, autoFetch = true) => {
  const [member, setMember] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const fetchMember = useCallback(() => {
    if (!memberId) {
      setIsError(true);
      setErrorMessage("Member ID is required");
      return;
    }

    setIsLoading(true);
    setIsError(false);
    setErrorMessage("");

    fetch(`/api/users/member/${memberId}`, {
      headers: { Accept: "application/json" },
      credentials: "include",
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => {
        setMember(data);
        setIsError(false);
      })
      .catch((error) => {
        console.error("Error fetching member:", error);
        setIsError(true);
        setErrorMessage(error.message || "Failed to fetch member");
        setMember(null);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [memberId]);

  useEffect(() => {
    if (autoFetch && memberId) {
      fetchMember();
    }
  }, [autoFetch, memberId, fetchMember]);

  return {
    member,
    isLoading,
    isError,
    errorMessage,
    fetchMember,
  };
};

