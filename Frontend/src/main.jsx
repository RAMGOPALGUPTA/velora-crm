import React from "react";
import ReactDOM from "react-dom/client";
import { Toaster } from "react-hot-toast";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "#fffaf4",
              color: "#172033",
              border: "1px solid rgba(23, 32, 51, 0.08)"
            }
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
