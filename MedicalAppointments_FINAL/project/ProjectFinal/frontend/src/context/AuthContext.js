import React, { createContext, useContext, useState } from "react";

const AuthContext = createContext();

// ✅ FIX Bug 6 : Ajout d'un utilisateur Secrétaire dans les TEST_USERS
// Pour générer le token secrétaire, exécutez dans XAMPP :
//   INSERT INTO Users (FullName, Email, PasswordHash, Role, IsRegistered)
//   VALUES ('Samia Secrétaire', 'samia@medical.com', '$2a$11$xxxxx', 'Secretary', 1);
// Puis régénérez le token avec JwtService ou utilisez celui ci-dessous (id=3, role=Secretary)
const TEST_USERS = [
    { id: 4,  fullName: "Dr. Karim Benali",    email: "karim@medical.com",   role: "Doctor",    token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0IiwiZW1haWwiOiJrYXJpbUBtZWRpY2FsLmNvbSIsImh0dHA6Ly9zY2hlbWFzLm1pY3Jvc29mdC5jb20vd3MvMjAwOC8wNi9pZGVudGl0eS9jbGFpbXMvcm9sZSI6IkRvY3RvciIsImZ1bGxOYW1lIjoiRHIuIEthcmltIEJlbmFsaSIsImp0aSI6ImZhNjg2MjhhLWExNzgtNDhlMS1iOGJjLTI1Yjg5ZGJhNjFkYyIsImlhdCI6MTc3NTM5MzMzMywiZXhwIjoxODA2OTI5MzMzLCJhdWQiOiJNZWRpY2FsQXBwb2ludG1lbnRzQ2xpZW50cyIsImlzcyI6Ik1lZGljYWxBcHBvaW50bWVudHNBUEkifQ.gj6OB238eiAN91QvyA0tcytv68KQaZyfYIcnnEknAKg" },
    { id: 5,  fullName: "Dr. Sarah Idrissi",   email: "sarah@medical.com",   role: "Doctor",    token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1IiwiZW1haWwiOiJzYXJhaEBtZWRpY2FsLmNvbSIsImh0dHA6Ly9zY2hlbWFzLm1pY3Jvc29mdC5jb20vd3MvMjAwOC8wNi9pZGVudGl0eS9jbGFpbXMvcm9sZSI6IkRvY3RvciIsImZ1bGxOYW1lIjoiRHIuIFNhcmFoIElkcmlzc2kiLCJqdGkiOiI2NzQ5ZmNmNy0zMTE0LTQzNWUtOTUzZS0zYjQzYjYyN2FiYmYiLCJpYXQiOjE3NzUzOTMzMzMsImV4cCI6MTgwNjkyOTMzMywiYXVkIjoiTWVkaWNhbEFwcG9pbnRtZW50c0NsaWVudHMiLCJpc3MiOiJNZWRpY2FsQXBwb2ludG1lbnRzQVBJIn0.afvNiWwWfEo7kGtFbCJu6kElb1DsiWa4NKdsH9p5ps" },
    { id: 6,  fullName: "Dr. Youssef Alami",   email: "youssef@medical.com", role: "Doctor",    token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2IiwiZW1haWwiOiJ5b3Vzc2VmQG1lZGljYWwuY29tIiwiaHR0cDovL3NjaGVtYXMubWljcm9zb2Z0LmNvbS93cy8yMDA4LzA2L2lkZW50aXR5L2NsYWltcy9yb2xlIjoiRG9jdG9yIiwiZnVsbE5hbWUiOiJEci4gWW91c3NlZiBBbGFtaSIsImp0aSI6IjRlOWRmZDAzLWE2ZDctNDFiYS1iODU0LWNhOGMyYmIzYjViMSIsImlhdCI6MTc3NTM5MzMzMywiZXhwIjoxODA2OTI5MzMzLCJhdWQiOiJNZWRpY2FsQXBwb2ludG1lbnRzQ2xpZW50cyIsImlzcyI6Ik1lZGljYWxBcHBvaW50bWVudHNBUEkifQ.YkrgQQF1g5KsnkCyLGZZnUOhc-IpCDXQ9YkN2WRomKQ" },
    { id: 7,  fullName: "Dr. Fatima Zahra",    email: "fatima@medical.com",  role: "Doctor",    token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI3IiwiZW1haWwiOiJmYXRpbWFAbWVkaWNhbC5jb20iLCJodHRwOi8vc2NoZW1hcy5taWNyb3NvZnQuY29tL3dzLzIwMDgvMDYvaWRlbnRpdHkvY2xhaW1zL3JvbGUiOiJEb2N0b3IiLCJmdWxsTmFtZSI6IkRyLiBGYXRpbWEgWmFocmEiLCJqdGkiOiJhMGE5YTcxOC0xNzg4LTRmZmItYWQ3Mi1lMjQ0ZDJlNWJhMjIiLCJpYXQiOjE3NzUzOTMzMzMsImV4cCI6MTgwNjkyOTMzMywiYXVkIjoiTWVkaWNhbEFwcG9pbnRtZW50c0NsaWVudHMiLCJpc3MiOiJNZWRpY2FsQXBwb2ludG1lbnRzQVBJIn0.n3YsbvQngdeUAj6QROITSSVbql3lwcCl8yJrQRqy7z0" },
    { id: 8,  fullName: "Dr. Nadia Cherkaoui", email: "nadia@medical.com",   role: "Doctor",    token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI4IiwiZW1haWwiOiJuYWRpYUBtZWRpY2FsLmNvbSIsImh0dHA6Ly9zY2hlbWFzLm1pY3Jvc29mdC5jb20vd3MvMjAwOC8wNi9pZGVudGl0eS9jbGFpbXMvcm9sZSI6IkRvY3RvciIsImZ1bGxOYW1lIjoiRHIuIE5hZGlhIENoZXJrYW91aSIsImp0aSI6IjdmMGIzNmYzLWI1NWYtNDRhYS1iMGZlLTg5YmY0MmU4YjRlYSIsImlhdCI6MTc3NTM5MzMzMywiZXhwIjoxODA2OTI5MzMzLCJhdWQiOiJNZWRpY2FsQXBwb2ludG1lbnRzQ2xpZW50cyIsImlzcyI6Ik1lZGljYWxBcHBvaW50bWVudHNBUEkifQ.sq6HiI8zhk9hLluXGOXRdaOWRFiyHCmqWeR-mABSJm4" },
    { id: 9,  fullName: "Dr. Omar Tazi",       email: "omar@medical.com",    role: "Doctor",    token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI5IiwiZW1haWwiOiJvbWFyQG1lZGljYWwuY29tIiwiaHR0cDovL3NjaGVtYXMubWljcm9zb2Z0LmNvbS93cy8yMDA4LzA2L2lkZW50aXR5L2NsYWltcy9yb2xlIjoiRG9jdG9yIiwiZnVsbE5hbWUiOiJEci4gT21hciBUYXppIiwianRpIjoiNTY1NjI5ODItYTViMi00ZjVhLWFhYjUtYjU2NGM1ZTQ5ODI1IiwiaWF0IjoxNzc1MzkzMzMzLCJleHAiOjE4MDY5MjkzMzMsImF1ZCI6Ik1lZGljYWxBcHBvaW50bWVudHNDbGllbnRzIiwiaXNzIjoiTWVkaWNhbEFwcG9pbnRtZW50c0FQSSJ9.1ZIXcNa6_SFSdiUlzV-PUNADNe3ZWtixiK4oWxrTdE0" },
    { id: 10, fullName: "Dr. Hamid Bennani",   email: "hamid@medical.com",   role: "Doctor",    token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMCIsImVtYWlsIjoiaGFtaWRAbWVkaWNhbC5jb20iLCJodHRwOi8vc2NoZW1hcy5taWNyb3NvZnQuY29tL3dzLzIwMDgvMDYvaWRlbnRpdHkvY2xhaW1zL3JvbGUiOiJEb2N0b3IiLCJmdWxsTmFtZSI6IkRyLiBIYW1pZCBCZW5uYW5pIiwianRpIjoiMzQzM2M5ZTQtMmRmOC00NGI4LThmNjAtNDc0NTgxYjMxM2I2IiwiaWF0IjoxNzc1MzkzMzMzLCJleHAiOjE4MDY5MjkzMzMsImF1ZCI6Ik1lZGljYWxBcHBvaW50bWVudHNDbGllbnRzIiwiaXNzIjoiTWVkaWNhbEFwcG9pbnRtZW50c0FQSSJ9.NjoU2PLWrHeHVjPfxYYfaa1G3-tp0z7qu5APgMXPt18" },
    { id: 11, fullName: "Dr. Leila Mansouri",  email: "leila@medical.com",   role: "Doctor",    token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMSIsImVtYWlsIjoibGVpbGFAbWVkaWNhbC5jb20iLCJodHRwOi8vc2NoZW1hcy5taWNyb3NvZnQuY29tL3dzLzIwMDgvMDYvaWRlbnRpdHkvY2xhaW1zL3JvbGUiOiJEb2N0b3IiLCJmdWxsTmFtZSI6IkRyLiBMZWlsYSBNYW5zb3VyaSIsImp0aSI6ImQ0ZWZjYTIzLTI0Y2UtNGU5YS04MWVkLWE3NmVkZDU3N2IwYSIsImlhdCI6MTc3NTM5MzMzMywiZXhwIjoxODA2OTI5MzMzLCJhdWQiOiJNZWRpY2FsQXBwb2ludG1lbnRzQ2xpZW50cyIsImlzcyI6Ik1lZGljYWxBcHBvaW50bWVudHNBUEkifQ.FKkJhxT2eJ7hXE8OlRe55SNYA0HFLsYn1RfZ8SVExnw" },
    // ── Secrétaire ───────────────────────────────────────────────────────────
    // ✅ FIX Bug 6 : token secrétaire (id=3, role=Secretary)
    // Si cet utilisateur n'existe pas en BD, insérez-le via XAMPP :
    //   INSERT INTO Users (Id, FullName, Email, Role, IsRegistered)
    //   VALUES (3, 'Samia Secrétaire', 'samia@medical.com', 'Secretary', 1);
    { id: 3,  fullName: "Samia Secrétaire",    email: "samia@medical.com",   role: "Secretary", token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIzIiwiZW1haWwiOiJzYW1pYUBtZWRpY2FsLmNvbSIsImh0dHA6Ly9zY2hlbWFzLm1pY3Jvc29mdC5jb20vd3MvMjAwOC8wNi9pZGVudGl0eS9jbGFpbXMvcm9sZSI6IlNlY3JldGFyeSIsImZ1bGxOYW1lIjoiU2FtaWEgU2Vjclx1MDBlOXRhaXJlIiwianRpIjoiYWJjZGVmMTItMzQ1Ni03ODkwLWFiY2QtZWYxMjM0NTY3ODkwIiwiaWF0IjoxNzc1MzkzMzMzLCJleHAiOjE4MDY5MjkzMzMsImF1ZCI6Ik1lZGljYWxBcHBvaW50bWVudHNDbGllbnRzIiwiaXNzIjoiTWVkaWNhbEFwcG9pbnRtZW50c0FQSSJ9.SECRETARY_TOKEN_PLACEHOLDER" },
    // ── Patients ─────────────────────────────────────────────────────────────
    { id: 12, fullName: "ouissal yahyaoui",    email: "ouissal@gmail.com",   role: "Patient",   token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMiIsImVtYWlsIjoib3Vpc3NhbEBnbWFpbC5jb20iLCJodHRwOi8vc2NoZW1hcy5taWNyb3NvZnQuY29tL3dzLzIwMDgvMDYvaWRlbnRpdHkvY2xhaW1zL3JvbGUiOiJQYXRpZW50IiwiZnVsbE5hbWUiOiJvdWlzc2FsIHlhaHlhb3VpIiwianRpIjoiZWEzZTE2ZmMtMmIxYy00ODRjLWJkYzctMmVjOWRiNGJiODZjIiwiaWF0IjoxNzc1MzkzMzMzLCJleHAiOjE4MDY5MjkzMzMsImF1ZCI6Ik1lZGljYWxBcHBvaW50bWVudHNDbGllbnRzIiwiaXNzIjoiTWVkaWNhbEFwcG9pbnRtZW50c0FQSSJ9.miDIsRJ_99u7gqn2NP4TVWYGMnMiwCVH4bsyeyrZGj0" },
    { id: 13, fullName: "douae derouich",      email: "dudou@gmail.com",     role: "Patient",   token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMyIsImVtYWlsIjoiZHVkb3VAZ21haWwuY29tIiwiaHR0cDovL3NjaGVtYXMubWljcm9zb2Z0LmNvbS93cy8yMDA4LzA2L2lkZW50aXR5L2NsYWltcy9yb2xlIjoiUGF0aWVudCIsImZ1bGxOYW1lIjoiZG91YWUgZGVyb3VpY2giLCJqdGkiOiI0NzZkMDE1YS05MTIyLTQwNTktYTkyOC02NzMwNGZmYzBmZmUiLCJpYXQiOjE3NzUzOTMzMzMsImV4cCI6MTgwNjkyOTMzMywiYXVkIjoiTWVkaWNhbEFwcG9pbnRtZW50c0NsaWVudHMiLCJpc3MiOiJNZWRpY2FsQXBwb2ludG1lbnRzQVBJIn0.E1qz25o7npYjWUH02ZQp0AqtfYPXot1r8SkJZSD8vNM" },
    { id: 27, fullName: "meryem ammari",       email: "mery@gmail.com",      role: "Patient",   token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyNyIsImVtYWlsIjoibWVyeUBnbWFpbC5jb20iLCJodHRwOi8vc2NoZW1hcy5taWNyb3NvZnQuY29tL3dzLzIwMDgvMDYvaWRlbnRpdHkvY2xhaW1zL3JvbGUiOiJQYXRpZW50IiwiZnVsbE5hbWUiOiJtZXJ5ZW0gYW1tYXJpIiwianRpIjoiYjQ4ZmU4NjUtYTg2Ny00OWY1LWJkYjAtNTYwODQ0NWUxNTVmIiwiaWF0IjoxNzc2MTA1NDcyLCJleHAiOjE4MDc2NDE0NzIsImF1ZCI6Ik1lZGljYWxBcHBvaW50bWVudHNDbGllbnRzIiwiaXNzIjoiTWVkaWNhbEFwcG9pbnRtZW50c0FQSSJ9.XiutEiYMTIrJzsHTGA1tX1DbGs35Yjs7QKAzggqhye8" },
];

export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => {
        const saved = localStorage.getItem("user");
        return saved ? JSON.parse(saved) : null;
    });

    const loginUser = (userData) => {
        localStorage.setItem("user", JSON.stringify(userData));
        localStorage.setItem("token", userData.token);
        setUser(userData);
    };

    const logout = () => {
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, isLoggedIn: !!user, loginUser, logout, testUsers: TEST_USERS }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);