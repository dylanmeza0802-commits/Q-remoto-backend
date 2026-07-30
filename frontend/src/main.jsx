import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login        from "./pages/Login.jsx";
import JoinQueue    from "./pages/JoinQueue.jsx";
import StudentView  from "./pages/StudentView.jsx";
import AdminPanel   from "./pages/AdminPanel.jsx";
import CanastaConfig from "./pages/CanastaConfig.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        {/* Pública */}
        <Route path="/login" element={<Login />} />

        {/* Redirigir raíz a login */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Rutas protegidas – solo alumnos */}
        <Route path="/join" element={
          <ProtectedRoute allowedRole="student"><JoinQueue /></ProtectedRoute>
        } />
        <Route path="/queue/:queueId" element={
          <ProtectedRoute allowedRole="student"><StudentView /></ProtectedRoute>
        } />

        {/* Rutas protegidas – solo admin */}
        <Route path="/admin" element={
          <ProtectedRoute allowedRole="admin"><AdminPanel /></ProtectedRoute>
        } />
        <Route path="/canasta" element={
          <ProtectedRoute allowedRole="admin"><CanastaConfig /></ProtectedRoute>
        } />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);