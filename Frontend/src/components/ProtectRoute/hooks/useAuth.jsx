import { useState, useCallback } from "react";
import { buildApiUrl } from "../../../config/api";

export const useAuth = () => {
    const [isValidLogin, setValidLogin] = useState(false);
    const [isFetching, setFeching] = useState(true);

    const hasLogin = useCallback(() => {
        setFeching(true);
        const token = localStorage.getItem("token");
        const headers = {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        };
        
        // Adicionar token ao header se existir
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        fetch(buildApiUrl('/api/auth/me'), {
            headers: headers,
            credentials: 'include'
        })
        .then((response) => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then((response) => {
            console.log('🔐 Auth check response:', response);
            setValidLogin(Boolean(response.auth));
        })
        .catch((error) => {
            console.error('❌ Auth check error:', error);
            setValidLogin(false);
        }).finally(() => {
            setFeching(false);
        })
    }, []);


    //if fething
    return {
        isValidLogin,
        hasLogin,
        isFetching
    }
}