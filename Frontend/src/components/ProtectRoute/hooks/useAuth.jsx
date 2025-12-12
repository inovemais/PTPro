import { useState, useCallback } from "react";

export const useAuth = () => {
    const [isValidLogin, setValidLogin] = useState(false);
    const [isFetching, setFeching] = useState(true);

    const hasLogin = useCallback(() => {
        setFeching(true);
        fetch('/api/auth/me', {
            headers: { 'Accept': 'application/json' },
            credentials: 'include'
        })
        .then((response) => response.json())
        .then((response) => {
            setValidLogin(response.auth);
        })
        .catch(() => {
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