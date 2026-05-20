import axios from "axios";

export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

export const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("joblify.token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const clearPersistedAuth = () => {
  localStorage.removeItem("joblify.token");
  localStorage.removeItem("joblify.refresh");
  localStorage.removeItem("joblify.user");
  localStorage.removeItem("joblify.auth");
  localStorage.removeItem("joblify.session");
};

const shouldRedirectToLogin = () => {
  const path = window.location.pathname;
  return path.startsWith("/app") || path === "/feed";
};

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config || {};
    const requestUrl = typeof original.url === "string" ? original.url : "";
    const isAuthRequest =
      requestUrl.includes("/auth/login") ||
      requestUrl.includes("/auth/register") ||
      requestUrl.includes("/auth/verify-email") ||
      requestUrl.includes("/auth/resend-verification") ||
      requestUrl.includes("/auth/forgot-password") ||
      requestUrl.includes("/auth/refresh");

    if (error.response?.status === 401 && !original._retry && !isAuthRequest) {
      original._retry = true;
      const storedToken = localStorage.getItem("joblify.token");
      const refresh = localStorage.getItem("joblify.refresh");

      if (!storedToken && !refresh) {
        return Promise.reject(error);
      }

      if (refresh) {
        try {
          const { data } = await axios.post(`${API_URL}/auth/refresh`, { refreshToken: refresh });
          localStorage.setItem("joblify.token", data.accessToken);
          localStorage.setItem("joblify.refresh", data.refreshToken);
          original.headers = original.headers || {};
          original.headers.Authorization = `Bearer ${data.accessToken}`;
          return api(original);
        } catch {
          clearPersistedAuth();
          if (shouldRedirectToLogin()) {
            window.location.href = "/login";
          }
        }
      } else {
        clearPersistedAuth();
        if (shouldRedirectToLogin()) {
          window.location.href = "/login";
        }
      }
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  register: (data: { email: string; password: string; name: string; role: string; headline?: string; location?: string; profileData?: Record<string, unknown> }) =>
    api.post("/auth/register", data),
  login: (data: { email: string; password: string }) =>
    api.post("/auth/login", data),
  verifyEmail: (data: { email: string; code: string }) =>
    api.post("/auth/verify-email", data),
  resendVerification: (email: string) =>
    api.post("/auth/resend-verification", { email }),
  me: () => api.get("/auth/me"),
  forgotPassword: (email: string) => api.post("/auth/forgot-password", { email }),
  logout: (refreshToken: string) => api.post("/auth/logout", { refreshToken }),
};

export const jobsApi = {
  list: (params?: Record<string, string | number>) => api.get("/jobs", { params }),
  get: (id: string) => api.get(`/jobs/${id}`),
  create: (data: Record<string, unknown>) => api.post("/jobs", data),
  update: (id: string, data: Record<string, unknown>) => api.put(`/jobs/${id}`, data),
  myPosted: () => api.get("/jobs/my/posted"),
};

export const companiesApi = {
  get: (id: string) => api.get(`/companies/${id}`),
};

export const applicationsApi = {
  apply: (jobId: string, coverLetter?: string) => api.post("/applications", { jobId, coverLetter }),
  applyWithDocuments: (payload: {
    jobId: string;
    coverLetter?: string;
    cvFile?: File;
    recommendationLetterFile?: File;
  }) => {
    const formData = new FormData();
    formData.append("jobId", payload.jobId);
    if (payload.coverLetter) {
      formData.append("coverLetter", payload.coverLetter);
    }
    if (payload.cvFile) {
      formData.append("cv", payload.cvFile);
    }
    if (payload.recommendationLetterFile) {
      formData.append("recommendationLetter", payload.recommendationLetterFile);
    }
    return api.post("/applications", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 30000,
    });
  },
  withdraw: (applicationId: string) => api.delete(`/applications/${applicationId}`),
  my: () => api.get("/applications/my"),
  byJob: (jobId: string) => api.get(`/applications/job/${jobId}`),
  trackCvEvent: (applicationId: string, event: "viewed" | "downloaded") =>
    api.post(`/applications/${applicationId}/cv-event`, { event }),
  saveAnalysis: (
    applicationId: string,
    data: {
      score: number;
      executiveSummary: string;
      strengths: string[];
      risks: string[];
      recommendation: string;
      recommendationReason: string;
      rawText?: string;
    }
  ) => api.post(`/applications/${applicationId}/analysis`, data),
  updateStatus: (
    id: string,
    payload: {
      status: string;
      notes?: string;
      sendEmail?: boolean;
      companyBranding?: { displayName?: string; logoUrl?: string };
      interview?: {
        mode: "REMOTO" | "PRESENCIAL";
        scheduledAt: string;
        timezone?: string;
        location?: string;
        meetingLink?: string;
        notes?: string;
      };
    }
  ) => api.patch(`/applications/${id}/status`, payload),
  closeJob: (jobId: string) => api.post(`/applications/job/${jobId}/close`),
};

export const feedApi = {
  posts: (page = 1) => api.get("/feed", { params: { page } }),
  publicPosts: (page = 1) => api.get("/feed/public", { params: { page } }),
  createPost: (data: { content: string; imageUrl?: string; tag?: string }) => api.post("/feed", data),
  likePost: (id: string) => api.post(`/feed/${id}/like`),
  comments: (id: string) => api.get(`/feed/${id}/comments`),
  addComment: (id: string, content: string) => api.post(`/feed/${id}/comments`, { content }),
  byUser: (userId: string, page = 1) => api.get(`/feed/user/${userId}`, { params: { page } }),
};

export const aiApi = {
  chat: (message: string, context: string, sessionId?: string, jobId?: string) =>
    api.post("/ai/chat", { message, context, sessionId, jobId }),
  generateJobDraft: (data: {
    prompt?: string;
    brief?: {
      roleTitle?: string;
      seniority?: string;
      industry?: string;
      modality?: "REMOTO" | "HIBRIDO" | "PRESENCIAL";
      contractType?: "FULL_TIME" | "PART_TIME" | "FREELANCE" | "PASANTIA";
      location?: string;
      responsibilities?: string;
      mustHaveSkills?: string[];
      niceToHaveSkills?: string[];
      englishLevel?: string;
      minSalary?: number;
      maxSalary?: number;
      currency?: string;
    };
  }) => api.post("/ai/job-draft", data, { timeout: 30000 }),
  match: (jobId: string) => api.post("/ai/match", { jobId }, { timeout: 30000 }),
  improveProfile: () => api.post("/ai/improve-profile"),
  moderateContent: (text: string, context: "post" | "comment" | "message" | "general" = "general") =>
    api.post("/ai/moderate-content", { text, context }, { timeout: 20000 }),
  generatePitch: (payload: { name: string; description: string; stage?: string; sector?: string; roles?: string[] }) =>
    api.post("/ai/pitch", payload, { timeout: 120000 }),
  recommendations: () => api.get("/ai/recommendations", { timeout: 30000 }),
};

export const userApi = {
  me: () => api.get("/users/me", { timeout: 20000 }),
  getProfile: (id: string) => api.get(`/users/${id}`),
  getMyStats: () => api.get("/users/me/stats", { timeout: 20000 }),
  getWorkAreas: () => api.get("/users/work-areas", { timeout: 20000 }),
  search: (q: string, role?: string, page = 1, pageSize = 20) =>
    api.get("/users", { params: { q, role, page, pageSize } }),
  searchPublic: (q: string, role?: string, page = 1, pageSize = 20) =>
    api.get("/users/public", { params: { q, role, page, pageSize } }),
  followStatus: (id: string) => api.get(`/users/${id}/follow-status`),
  toggleFollow: (id: string) => api.post(`/users/${id}/follow`),
  updateMe: (data: Record<string, unknown>) => api.put("/users/me", data, { timeout: 30000 }),
  addSkills: (skills: string[]) => api.post("/users/me/skills", { skills }),
  syncSkills: (skills: string[]) => api.put("/users/me/skills", { skills }, { timeout: 30000 }),
  addExperience: (data: Record<string, unknown>) => api.post("/users/me/experience", data),
  updateExperience: (id: string, data: Record<string, unknown>) => api.put(`/users/me/experience/${id}`, data),
  deleteExperience: (id: string) => api.delete(`/users/me/experience/${id}`),
  addEducation: (data: Record<string, unknown>) => api.post("/users/me/education", data),
  updateEducation: (id: string, data: Record<string, unknown>) => api.put(`/users/me/education/${id}`, data),
  deleteEducation: (id: string) => api.delete(`/users/me/education/${id}`),
};

export const messagesApi = {
  contacts: (q = "") => api.get("/messages/contacts", { params: { q } }),
  conversations: () => api.get("/messages/conversations"),
  getConversation: (id: string) => api.get(`/messages/conversations/${id}`),
  respondRequest: (id: string, action: "accept" | "reject") =>
    api.patch(`/messages/conversations/${id}/request`, { action }),
  send: (receiverId: string, content: string, conversationId?: string) =>
    api.post("/messages", { receiverId, content, conversationId }),
};

export const notificationsApi = {
  list: () => api.get("/notifications"),
  readAll: () => api.patch("/notifications/read-all"),
};

export const savedApi = {
  getJobs: () => api.get("/saved/jobs"),
  toggleJob: (id: string) => api.post(`/saved/jobs/${id}`),
  getPosts: () => api.get("/saved/posts"),
  togglePost: (id: string) => api.post(`/saved/posts/${id}`),
};

export const profileApi = {
  uploadCV: (file: File) => {
    const formData = new FormData();
    formData.append("cv", file);
    return api.post("/profile/upload-cv", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 120000,
    });
  },
};

export const freelanceApi = {
  getMyProfile: () => api.get("/freelance/me/profile", { timeout: 20000 }),
  getMyServices: () => api.get("/freelance/my/services", { timeout: 20000 }),
  getProjects: () => api.get("/freelance/projects", { timeout: 20000 }),
  submitProposal: (projectId: string, data: Record<string, unknown>) =>
    api.post(`/freelance/projects/${projectId}/proposals`, data, { timeout: 30000 }),
  getMyProposals: () => api.get("/freelance/my/proposals", { timeout: 20000 }),
  getMyEarnings: () => api.get("/freelance/my/earnings", { timeout: 20000 }),
  createService: (data: Record<string, unknown>) => api.post("/freelance/services", data, { timeout: 30000 }),
  updateService: (id: string, data: Record<string, unknown>) => api.put(`/freelance/services/${id}`, data, { timeout: 30000 }),
  deleteService: (id: string) => api.delete(`/freelance/services/${id}`, { timeout: 20000 }),
  getFreelancerReviews: (id: string) => api.get(`/freelance/reviews/${id}`, { timeout: 20000 }),
};

export const startupApi = {
  list: (params?: Record<string, string | number>) => api.get("/startups", { params, timeout: 20000 }),
  get: (id: string) => api.get(`/startups/${id}`, { timeout: 20000 }),
  create: (data: Record<string, unknown>) => api.post("/startups", data, { timeout: 30000 }),
  myOwned: () => api.get("/startups/my/owned", { timeout: 20000 }),
  overview: () => api.get("/startups/my/overview", { timeout: 20000 }),
  update: (id: string, data: Record<string, unknown>) => api.put(`/startups/${id}`, data, { timeout: 30000 }),
  archive: (id: string) => api.delete(`/startups/${id}`),
  createRole: (startupId: string, data: Record<string, unknown>) => api.post(`/startups/${startupId}/roles`, data, { timeout: 20000 }),
  updateRole: (roleId: string, data: Record<string, unknown>) => api.patch(`/startups/roles/${roleId}`, data, { timeout: 20000 }),
  deleteRole: (roleId: string) => api.delete(`/startups/roles/${roleId}`),
  myApplications: () => api.get("/startups/my/applications", { timeout: 20000 }),
  updateApplicationStatus: (id: string, status: "PENDIENTE" | "EN_REVISION" | "ACEPTADO" | "RECHAZADO") =>
    api.patch(`/startups/applications/${id}/status`, { status }, { timeout: 20000 }),
};
