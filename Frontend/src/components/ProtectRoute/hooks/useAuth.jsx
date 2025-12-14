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
        console.log('🔐 Token in localStorage:', token ? `Present (${token.substring(0, 20)}...)` : 'Not found');
        console.log('🔐 API URL:', apiUrl);
        console.log('🔐 Will send credentials: include (cookies)');
        
        // Construir headers - IMPORTANTE: não usar Content-Type para GET requests
        const headers = {
            'Accept': 'application/json'
        };
        
        // Adicionar token ao header se existir (o cookie também será enviado automaticamente)
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
            console.log('🔐 Token added to Authorization header');
            console.log('🔐 Token length:', token.length);
        } else {
            console.error('❌ CRITICAL: No token in localStorage!');
            console.error('❌ This will cause authentication to fail');
            // Tentar verificar se há algum token em outro lugar
            const allKeys = Object.keys(localStorage);
            console.log('🔍 All localStorage keys:', allKeys);
        }
        
        console.log('🔐 Request headers:', JSON.stringify(headers, null, 2));
        
        fetch(apiUrl, {
            headers: headers,
            credentials: 'include' // Importante: envia cookies mesmo em cross-origin
        })
        .then(async (response) => {
            console.log('🔐 Auth check response status:', response.status);
            console.log('🔐 Response headers:', Object.fromEntries(response.headers.entries()));
            
            if (!response.ok) {
                // Tentar ler o corpo da resposta para mais detalhes
                let errorBody;
                try {
                    const text = await response.text();
                    if (text && text.trim().length > 0) {
                        try {
                            errorBody = JSON.parse(text);
                        } catch {
                            errorBody = { message: text.substring(0, 200) };
                        }
                    } else {
                        errorBody = { message: 'Empty error response' };
                    }
                    console.error('❌ Auth check failed - Response body:', errorBody);
                } catch (e) {
                    console.error('❌ Auth check failed - Could not parse response body:', e);
                    errorBody = { message: 'Could not parse error response' };
                }
                
                // Verificar se é erro 401 (não autorizado)
                if (response.status === 401) {
                    console.error('❌ 401 Unauthorized - Possible causes:');
                    console.error('   1. Token not sent correctly');
                    console.error('   2. Cookie not sent (CORS issue?)');
                    console.error('   3. Token expired or invalid');
                    console.error('   4. Backend not receiving token');
                }
                
                throw new Error(`HTTP error! status: ${response.status}, message: ${errorBody?.message || errorBody?.error || 'Unknown error'}`);
            }
            
            // Verificar content-type
            const contentType = response.headers.get("content-type");
            if (!contentType || !contentType.includes("application/json")) {
                const text = await response.text();
                throw new Error(`Expected JSON but got ${contentType}. Response: ${text.substring(0, 100)}`);
            }
            
            // Ler texto primeiro e fazer parse manualmente
            const text = await response.text();
            if (!text || text.trim().length === 0) {
                throw new Error("Empty response from server");
            }
            
            try {
                return JSON.parse(text);
            } catch (jsonErr) {
                console.error('❌ JSON parsing error in useAuth:', jsonErr);
                console.error('❌ Response text:', text.substring(0, 500));
                throw new Error(`Invalid JSON response: ${jsonErr.message}`);
            }
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