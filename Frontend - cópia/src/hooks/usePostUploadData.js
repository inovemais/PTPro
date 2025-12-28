import { useState } from "react";

/**
 * Hook para fazer upload de fotografias para o servidor
 * Suporta upload via Base64 (padrão) ou FormData
 * @param {string} url - URL do endpoint de upload (ex: "users/upload-photo")
 * @param {string} fieldName - Nome do campo no FormData (default: "photo")
 * @returns {object} - { uploadPhoto, isLoading, isError, errorMessage, data }
 */
export const usePostUploadData = (url = "", fieldName = "photo") => {
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [data, setData] = useState(null);

  /**
   * Converte um ficheiro para Base64
   * @param {File} file - Ficheiro a converter
   * @returns {Promise<string>} - Promise que resolve com a string Base64
   */
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  /**
   * Faz upload de uma fotografia
   * @param {File|string} photo - Ficheiro ou string Base64
   * @param {object} additionalData - Dados adicionais a enviar (ex: userId, memberId)
   * @param {boolean} useFormData - Se true, usa FormData; se false, usa Base64 (default: false)
   */
  const uploadPhoto = async (photo, additionalData = {}, useFormData = false) => {
    if (!photo) {
      setIsError(true);
      setErrorMessage("Nenhuma fotografia fornecida");
      return;
    }

    setIsLoading(true);
    setIsError(false);
    setErrorMessage("");
    setData(null);

    try {
      let body;
      let headers = {
        "Content-Type": "application/json",
      };

      if (useFormData) {
        // Usar FormData para upload tradicional
        body = new FormData();
        
        if (photo instanceof File) {
          body.append(fieldName, photo);
        } else {
          setIsError(true);
          setErrorMessage("FormData requer um objeto File");
          setIsLoading(false);
          return;
        }

        // Adicionar dados adicionais ao FormData
        Object.keys(additionalData).forEach((key) => {
          body.append(key, additionalData[key]);
        });

        // Remover Content-Type para o browser definir automaticamente com boundary
        headers = {};
      } else {
        // Usar Base64 (padrão)
        let base64String;

        if (photo instanceof File) {
          // Validar tipo de ficheiro
          if (!photo.type.match(/^image\/(jpeg|jpg|png|gif)$/)) {
            throw new Error("Tipo de ficheiro não suportado. Use JPEG, JPG, PNG ou GIF");
          }

          // Validar tamanho (máximo 5MB)
          if (photo.size > 5 * 1024 * 1024) {
            throw new Error("A imagem deve ter no máximo 5MB");
          }

          // Converter para Base64
          base64String = await fileToBase64(photo);
        } else if (typeof photo === "string" && photo.startsWith("data:image/")) {
          // Já é uma string Base64
          base64String = photo;
        } else {
          throw new Error("Formato de imagem inválido");
        }

        // Preparar body com Base64 e dados adicionais
        body = JSON.stringify({
          [fieldName]: base64String,
          ...additionalData,
        });
      }

      const response = await fetch(`/api/${url}`, {
        method: "POST",
        headers: headers,
        credentials: "include",
        body: body,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.message || `HTTP error! status: ${response.status}`);
      }

      const jsonData = await response.json();
      setData(jsonData);
      setIsError(false);
      
      return jsonData;
    } catch (error) {
      console.error("Error uploading photo:", error);
      setIsError(true);
      setErrorMessage(error.message || "Erro ao fazer upload da fotografia");
      setData(null);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    uploadPhoto,
    isLoading,
    isError,
    errorMessage,
    data,
  };
};

