import http from "k6/http";
import { check, sleep } from "k6";

const BASE_URL = __ENV.BASE_URL || "http://localhost:8080/api";
const AUTH_TOKEN = __ENV.AUTH_TOKEN || "";
const TIMEOUT = __ENV.TIMEOUT || "30s";

const commonHeaders = {
  "Content-Type": "application/json",
};

if (AUTH_TOKEN) {
  commonHeaders.Authorization = `Bearer ${AUTH_TOKEN}`;
}

export const options = {
  scenarios: {
    auth_critical_flow: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "1m", target: 40 },
        { duration: "3m", target: 40 },
        { duration: "1m", target: 0 },
      ],
      gracefulRampDown: "30s",
      exec: "authCriticalScenario",
    },
    dashboard_bootstrap_flow: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "2m", target: 100 },
        { duration: "6m", target: 100 },
        { duration: "2m", target: 0 },
      ],
      gracefulRampDown: "30s",
      exec: "dashboardBootstrapScenario",
    },
  },
  thresholds: {
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(95)<600", "p(99)<1200"],
    "http_req_duration{endpoint:auth_disponibilidad}": ["p(95)<450", "p(99)<900"],
    "http_req_duration{endpoint:dashboard_campos}": ["p(95)<600", "p(99)<1200"],
    "http_req_duration{endpoint:dashboard_lotes}": ["p(95)<700", "p(99)<1400"],
    "http_req_duration{endpoint:dashboard_campanias}": ["p(95)<600", "p(99)<1200"],
    checks: ["rate>0.99"],
    "checks{critical:auth}": ["rate>0.99"],
    "checks{critical:dashboard}": ["rate>0.99"],
  },
};

function randomSuffix() {
  return `${__VU}-${__ITER}-${Date.now()}`;
}

export function authCriticalScenario() {
  const response = http.post(
    `${BASE_URL}/public/auth/registro/validar-disponibilidad`,
    JSON.stringify({
      email: `qa.${randomSuffix()}@agronex.test`,
      dni: `${Math.floor(10000000 + Math.random() * 89999999)}`,
    }),
    {
      headers: commonHeaders,
      timeout: TIMEOUT,
      tags: { endpoint: "auth_disponibilidad", critical: "auth" },
    }
  );

  check(
    response,
    {
      "POST /public/auth/registro/validar-disponibilidad -> 2xx/4xx": (r) =>
        (r.status >= 200 && r.status < 300) || (r.status >= 400 && r.status < 500),
    },
    { critical: "auth" }
  );

  sleep(1);
}

export function dashboardBootstrapScenario() {
  const t = Date.now();

  const requests = {
    campos: {
      method: "GET",
      url: `${BASE_URL}/campos?t=${t}`,
      params: {
        headers: commonHeaders,
        timeout: TIMEOUT,
        tags: { endpoint: "dashboard_campos", critical: "dashboard" },
      },
    },
    lotes: {
      method: "GET",
      url: `${BASE_URL}/lotes?t=${t}`,
      params: {
        headers: commonHeaders,
        timeout: TIMEOUT,
        tags: { endpoint: "dashboard_lotes", critical: "dashboard" },
      },
    },
    campanias: {
      method: "GET",
      url: `${BASE_URL}/campanias?t=${t}`,
      params: {
        headers: commonHeaders,
        timeout: TIMEOUT,
        tags: { endpoint: "dashboard_campanias", critical: "dashboard" },
      },
    },
  };

  const responses = http.batch(requests);

  check(
    responses.campos,
    {
      "GET /campos -> 200": (r) => r.status === 200,
    },
    { critical: "dashboard" }
  );
  check(
    responses.lotes,
    {
      "GET /lotes -> 200": (r) => r.status === 200,
    },
    { critical: "dashboard" }
  );
  check(
    responses.campanias,
    {
      "GET /campanias -> 200": (r) => r.status === 200,
    },
    { critical: "dashboard" }
  );

  sleep(1);
}
