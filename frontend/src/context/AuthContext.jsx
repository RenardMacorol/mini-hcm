import { createContext, useContext, useEffect, useState } from "react";
import { auth } from "../firebase";
import BACKEND_URL from "../backendConfig";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
	const [user, setUser] = useState(null);
	const [loading, setLoading] = useState(true);
	const API = (path) => `${BACKEND_URL}${path}`;

	// 🔥 Restore session on refresh
	useEffect(() => {
		const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
			if (!firebaseUser) {
				setUser(null);
				setLoading(false);
				return;
			}

			try {
				const token = await firebaseUser.getIdToken();

				const res = await fetch(API('/api/auth/me'), {
					headers: {
						Authorization: `Bearer ${token}`,
					},
				});

				const data = await res.json();

				setUser({
					uid: data.auth.uid,
					email: data.profile.email,
					name: data.profile.name,
					role: data.profile.role,
					schedule: data.profile.schedule,
					timezone: data.profile.timezone,
					token,
				});
			} catch (err) {
				console.error("Auth restore failed:", err);
				setUser(null);
			}

			setLoading(false);
		});

		return () => unsubscribe();
	}, []);

	const logout = async () => {
		await auth.signOut();
		localStorage.removeItem("authToken");
		setUser(null);
	};

	return (
		<AuthContext.Provider value={{ user, logout, loading }}>
			{children}
		</AuthContext.Provider>
	);
};

export const useAuth = () => useContext(AuthContext);
