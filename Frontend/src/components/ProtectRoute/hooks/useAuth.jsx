import { useState, useCallback } from "react";
import { buildApiUrl } from "../../../config/api";

export const useAuth = () => {
    const [isValidLogin, setValidLogin] = useState(false);
    const [isFetching, setFeching] = useState(true);

    const hasLogin = useCallback(() => {
        setFeching(true);
        const token = localStorage.getItem("token");
        const apiUrl = buildApiUrl('/api/auth/me');
        
        console.log('🔐 Checking authentication...');
        console.log('🔐 Token in localStorage:', token ? 'Present' : 'Not found');
        console.log('🔐 API URL:', apiUrl);
        
        const headers = {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        };
        
        // Adicionar token ao header se existir (o cookie também será enviado automaticamente)
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
            console.log('🔐 Token added to Authorization header');
        } else {
            console.log('⚠️  No token in localStorage, relying on cookie');
        }
        
        fetch(apiUrl, {
            headers: headers,
            credentials: 'include' // Importante: envia cookies mesmo em cross-origin
        })
        .then((response) => {
            console.log('🔐 Auth check response status:', response.status);
            if (!response.ok) {
                // Tentar ler o corpo da resposta para mais detalhes
                return response.json().then(body => {
                    console.error('❌ Auth check failed:', body);
                    throw new Error(`HTTP error! status: ${response.status}, message: ${body.message || body.error || 'Unknown error'}`);
                }).catch(() => {
                    throw new Error(`HTTP error! status: ${response.status}`);
                });
            }
            return response.json();
        })
        .then((response) => {
            console.log('✅ Auth check successful:', response);
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