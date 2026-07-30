import { create } from "zustand";

// Lista inicial de usuarios si no existe base de datos en localStorage
const INITIAL_USERS = [
  // Alumno original
  {
    id: "u-student-0",
    email: "alumno@unsaac.edu.pe",
    password: "alumno123",
    name: "Alumno UNSAAC Principal",
    role: "student",
  },
  // 10 Alumnos nuevos
  ...Array.from({ length: 10 }, (_, i) => ({
    id: `u-student-${i + 1}`,
    email: `alumno${i + 1}@unsaac.edu.pe`,
    password: "alumno123",
    name: `Alumno UNSAAC ${i + 1}`,
    role: "student",
  })),
  // Admin original
  {
    id: "u-admin-0",
    email: "admin@unsaac.edu.pe",
    password: "admin123",
    name: "Administrador Comedor Principal",
    role: "admin",
  },
  // 5 Admins nuevos
  ...Array.from({ length: 5 }, (_, i) => ({
    id: `u-admin-${i + 1}`,
    email: `admin${i + 1}@unsaac.edu.pe`,
    password: "admin123",
    name: `Administrador Comedor ${i + 1}`,
    role: "admin",
  })),
];

// Obtener o inicializar la base de datos de usuarios simulada
const getUsersDB = () => {
  try {
    const raw = localStorage.getItem("qremoto_users_db");
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error("Error reading users db", e);
  }
  localStorage.setItem("qremoto_users_db", JSON.stringify(INITIAL_USERS));
  return INITIAL_USERS;
};

// Guardar en base de datos
const saveUsersDB = (users) => {
  localStorage.setItem("qremoto_users_db", JSON.stringify(users));
};

// Recuperar sesión guardada
const savedSession = (() => {
  try {
    const raw = localStorage.getItem("qremoto_user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
})();

export const useAuthStore = create((set, get) => ({
  user: savedSession,
  isAuthenticated: !!savedSession,
  error: null,

  login: (email, password) => {
    const db = getUsersDB();
    const found = db.find(
      (u) => u.email === email.trim().toLowerCase() && u.password === password
    );
    if (!found) {
      set({ error: "Correo o contraseña incorrectos" });
      return false;
    }
    const { password: _pw, ...safeUser } = found;
    localStorage.setItem("qremoto_user", JSON.stringify(safeUser));
    set({ user: safeUser, isAuthenticated: true, error: null });
    return true;
  },

  logout: () => {
    localStorage.removeItem("qremoto_user");
    set({ user: null, isAuthenticated: false, error: null });
  },

  changePassword: (oldPassword, newPassword) => {
    const currentUser = get().user;
    if (!currentUser) {
      set({ error: "No hay sesión activa" });
      return false;
    }

    const db = getUsersDB();
    const userIdx = db.findIndex((u) => u.id === currentUser.id);

    if (userIdx === -1) {
      set({ error: "Usuario no encontrado en la base de datos" });
      return false;
    }

    // Validar contraseña antigua
    if (db[userIdx].password !== oldPassword) {
      set({ error: "La contraseña actual es incorrecta" });
      return false;
    }

    // Actualizar contraseña
    db[userIdx].password = newPassword;
    saveUsersDB(db);
    set({ error: null });
    return true;
  },

  clearError: () => set({ error: null }),
}));
