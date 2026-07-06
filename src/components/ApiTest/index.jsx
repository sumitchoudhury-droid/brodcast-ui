import { useState } from "react";
import { BASE_URL } from "../../api/api.jsx";

const HEADERS = {
  TenantId: "tenant-001",
  OrganizationId: "1",
  "X-Correlation-ID": "postman-test-001"
};

const ENDPOINTS = [
  { label: "Get All Templates", path: "/api/v1/templates" },
  { label: "Get Template By Id", path: "/api/v1/templates/1" },
  { label: "Get Templates By Type", path: "/api/v1/templates/type/NEW" },
  {
    label: "Get Template List (Filtered)",
    path: "/api/v1/templates/list?templateType=NEW&includeInactive=false"
  }
];

export default function ApiTest() {
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState({});

  const testEndpoint = async (endpoint) => {
    setLoading((prev) => ({ ...prev, [endpoint.path]: true }));
    setResults((prev) => ({ ...prev, [endpoint.path]: null }));

    const start = Date.now();
    try {
      const res = await fetch(`${BASE_URL}${endpoint.path}`, {
        method: "GET",
        headers: HEADERS
      });
      const elapsed = Date.now() - start;
      let body;
      const text = await res.text();
      try {
        body = JSON.parse(text);
      } catch {
        body = text;
      }
      setResults((prev) => ({
        ...prev,
        [endpoint.path]: {
          ok: res.ok,
          status: res.status,
          statusText: res.statusText,
          elapsed,
          body
        }
      }));
    } catch (err) {
      setResults((prev) => ({
        ...prev,
        [endpoint.path]: {
          ok: false,
          status: null,
          statusText: null,
          elapsed: Date.now() - start,
          error: err.message
        }
      }));
    } finally {
      setLoading((prev) => ({ ...prev, [endpoint.path]: false }));
    }
  };

  const testAll = () => ENDPOINTS.forEach(testEndpoint);

  return (
    <div style={{ padding: "32px", fontFamily: "monospace", maxWidth: 900 }}>
      <h2 style={{ marginBottom: 4 }}>API Connectivity Test</h2>
      <p style={{ color: "#666", marginBottom: 24, fontSize: 13 }}>
        Base URL: <strong>{BASE_URL}</strong>
      </p>

      <div style={{ marginBottom: 24 }}>
        <p style={{ fontSize: 13, color: "#444", marginBottom: 8 }}>
          Headers sent with every request:
        </p>
        <pre
          style={{
            background: "#f4f4f4",
            padding: "10px 14px",
            borderRadius: 6,
            fontSize: 12
          }}
        >
          {JSON.stringify(HEADERS, null, 2)}
        </pre>
      </div>

      <button
        onClick={testAll}
        style={{
          marginBottom: 24,
          padding: "8px 20px",
          background: "#1a73e8",
          color: "#fff",
          border: "none",
          borderRadius: 6,
          cursor: "pointer",
          fontSize: 14
        }}
      >
        Test All Endpoints
      </button>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {ENDPOINTS.map((ep) => {
          const result = results[ep.path];
          const isLoading = loading[ep.path];
          return (
            <div
              key={ep.path}
              style={{
                border: "1px solid #ddd",
                borderRadius: 8,
                padding: 16,
                background: result
                  ? result.ok
                    ? "#f0fdf4"
                    : "#fff1f1"
                  : "#fafafa"
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 8
                }}
              >
                <div>
                  <span
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      background: "#e8f0fe",
                      color: "#1a73e8",
                      padding: "2px 8px",
                      borderRadius: 4,
                      marginRight: 10
                    }}
                  >
                    GET
                  </span>
                  <span style={{ fontWeight: 600, fontSize: 14 }}>
                    {ep.label}
                  </span>
                </div>
                <button
                  onClick={() => testEndpoint(ep)}
                  disabled={isLoading}
                  style={{
                    padding: "5px 14px",
                    background: isLoading ? "#ccc" : "#1a73e8",
                    color: "#fff",
                    border: "none",
                    borderRadius: 5,
                    cursor: isLoading ? "not-allowed" : "pointer",
                    fontSize: 13
                  }}
                >
                  {isLoading ? "Testing..." : "Test"}
                </button>
              </div>

              <code style={{ fontSize: 12, color: "#555" }}>
                {BASE_URL}
                {ep.path}
              </code>

              {result && (
                <div style={{ marginTop: 12 }}>
                  <div style={{ display: "flex", gap: 16, marginBottom: 8 }}>
                    <span
                      style={{
                        fontWeight: 700,
                        color: result.ok ? "#16a34a" : "#dc2626",
                        fontSize: 14
                      }}
                    >
                      {result.error
                        ? "NETWORK ERROR"
                        : `${result.status} ${result.statusText}`}
                    </span>
                    <span style={{ color: "#888", fontSize: 13 }}>
                      {result.elapsed}ms
                    </span>
                  </div>

                  {result.error ? (
                    <pre
                      style={{
                        background: "#fff1f1",
                        color: "#dc2626",
                        padding: "8px 12px",
                        borderRadius: 5,
                        fontSize: 12,
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-all"
                      }}
                    >
                      {result.error}
                    </pre>
                  ) : (
                    <pre
                      style={{
                        background: "#f4f4f4",
                        padding: "8px 12px",
                        borderRadius: 5,
                        fontSize: 12,
                        maxHeight: 200,
                        overflow: "auto",
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-all"
                      }}
                    >
                      {typeof result.body === "string"
                        ? result.body
                        : JSON.stringify(result.body, null, 2)}
                    </pre>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
