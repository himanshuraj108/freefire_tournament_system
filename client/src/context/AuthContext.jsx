import { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkUserLoggedIn();
    }, []);

    const checkUserLoggedIn = async () => {
        const token = localStorage.getItem('token');
        if (token) {
            axios.defaults.headers.common['x-auth-token'] = token;
            try {
                const res = await axios.get('http://localhost:5000/api/auth/user');
                setUser(res.data);
            } catch (err) {
                localStorage.removeItem('token');
                delete axios.defaults.headers.common['x-auth-token'];
            }
        }
        setLoading(false);
    };

    const login = async (ffUid, password) => {
        const res = await axios.post('http://localhost:5000/api/auth/login', { ffUid, password });
        localStorage.setItem('token', res.data.token);
        axios.defaults.headers.common['x-auth-token'] = res.data.token;
        setUser(res.data.user);
    };

    const register = async (name, ffUid, password, email) => {
        const res = await axios.post('http://localhost:5000/api/auth/register', { name, ffUid, password, email });
        localStorage.setItem('token', res.data.token);
        axios.defaults.headers.common['x-auth-token'] = res.data.token;
        setUser(res.data.user);
    };

    const logout = () => {
        localStorage.removeItem('token');
        delete axios.defaults.headers.common['x-auth-token'];
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout, loading, loadUser: checkUserLoggedIn }}>
            {children}
        </AuthContext.Provider>
    );
};
