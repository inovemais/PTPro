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
        
        const headers = {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        };
        
        // Adicionar token ao header se existir (o cookie também será enviado automaticamente)
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
            console.log('🔐 Token added to Authorization header');
        } else {
            console.log('⚠️  No token in localStorage, relying on cookie only');
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
                    errorBody = await response.json();
                    console.error('❌ Auth check failed - Response body:', errorBody);
                } catch (e) {
                    console.error('❌ Auth check failed - Could not parse response body');
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