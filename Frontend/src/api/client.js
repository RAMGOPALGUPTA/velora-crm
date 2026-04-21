import axios from "axios";

export const AUTH_STORAGE_KEY = "crm-auth";
export const AUTH_EXPIRED_EVENT = "crm-auth-expired";

const client = axios.create({
  baseURL: "https://velora-crm.onrender.com/" || "/api"
});

const readStoredAuth = () => {
  try {
    const savedAuth = localStorage.getItem(AUTH_STORAGE_KEY);
    return savedAuth ? JSON.parse(savedAuth) : null;
  } catch {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
};

client.interceptors.request.use((config) => {
  const savedAuth = readStoredAuth();

  if (savedAuth) {
    const { token } = savedAuth;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  return config;
});

client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
    }

    return Promise.reject(error);
  }
);

export const authApi = {
  login: async (payload) => {
    const { data } = await client.post("/auth/login", payload);
    return data;
  },
  register: async (payload) => {
    const { data } = await client.post("/auth/register", payload);
    return data;
  }
};

export const leadsApi = {
  getLeads: async (params) => {
    const { data } = await client.get("/leads", { params });
    return data;
  },
  getStats: async () => {
    const { data } = await client.get("/leads/stats");
    return data;
  },
  createLead: async (payload) => {
    const { data } = await client.post("/leads", payload);
    return data;
  },
  updateLead: async (leadId, payload) => {
    const { data } = await client.put(`/leads/${leadId}`, payload);
    return data;
  },
  addNote: async (leadId, note) => {
    const { data } = await client.post(`/leads/${leadId}/notes`, { note });
    return data;
  },
  completeFollowUp: async (leadId) => {
    const { data } = await client.post(`/leads/${leadId}/follow-up-complete`);
    return data;
  },
  deleteLead: async (leadId) => {
    const { data } = await client.delete(`/leads/${leadId}`);
    return data;
  }
};

export const usersApi = {
  getUsers: async () => {
    const { data } = await client.get("/users");
    return data;
  }
};
