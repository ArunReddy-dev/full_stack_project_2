const API_BASE =
  (import.meta.env.VITE_API_BASE_URL as string) || "http://localhost:8000/api";

type RequestOptions = {
  method?: string;
  body?: any;
  headers?: Record<string, string>;
};

async function request(path: string, opts: RequestOptions = {}) {
  const url = path.startsWith("http") ? path : `${API_BASE}${path}`;

  const stored = localStorage.getItem("user");
  const token = stored
    ? (JSON.parse(stored).token as string | undefined)
    : undefined;

  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(opts.headers || {}),
  };

  if (opts.body && !(opts.body instanceof FormData)) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    method: opts.method || "GET",
    headers,
    body:
      opts.body instanceof FormData
        ? opts.body
        : opts.body
        ? JSON.stringify(opts.body)
        : undefined,
  });

  const text = await res.text();
  let data: any = undefined;
  try {
    data = text ? JSON.parse(text) : undefined;
  } catch {
    data = text;
  }

  if (!res.ok) {
    const err = new Error(
      data?.detail || data?.message || res.statusText || "Request failed"
    );
    // @ts-ignore
    err.status = res.status;
    // @ts-ignore
    err.data = data;
    throw err;
  }

  return data;
}

export const api = {
  get: (path: string, headers?: Record<string, string>) =>
    request(path, { method: "GET", headers }),
  post: (path: string, body?: any, headers?: Record<string, string>) =>
    request(path, { method: "POST", body, headers }),
  put: (path: string, body?: any, headers?: Record<string, string>) =>
    request(path, { method: "PUT", body, headers }),
  patch: (path: string, body?: any, headers?: Record<string, string>) =>
    request(path, { method: "PATCH", body, headers }),
  del: (path: string, headers?: Record<string, string>) =>
    request(path, { method: "DELETE", headers }),
  API_BASE,
};

export default api;
