import { supabase } from "@/integrations/supabase/client";

const SESSION_KEY = "kuka_session_id";
const DEVICE_KEY = "kuka_device_id";
const BAND_KEY = "kuka_session_band";
const STEPUP_KEY = "kuka_session_stepup";

export type RiskBand = "low" | "elevated" | "high";

export interface RiskResult {
  success: boolean;
  session_id?: string;
  score?: number;
  band?: RiskBand;
  requires_step_up?: boolean;
  reasons?: Array<Record<string, unknown>>;
}

/** Stable per-browser device id, blended with a coarse environment signature. */
export const getDeviceFingerprint = (): string => {
  if (typeof window === "undefined") return "server";
  let id = localStorage.getItem(DEVICE_KEY);
  if (!id) {
    id =
      (crypto.randomUUID?.() ??
        Math.random().toString(36).slice(2) + Date.now().toString(36));
    localStorage.setItem(DEVICE_KEY, id);
  }
  const env = [
    navigator.platform || "",
    navigator.language || "",
    String(screen.width),
    String(screen.height),
    String(new Date().getTimezoneOffset()),
  ].join("|");
  let hash = 0;
  for (let i = 0; i < env.length; i++) {
    hash = (hash * 31 + env.charCodeAt(i)) | 0;
  }
  return `${id}.${Math.abs(hash).toString(36)}`;
};

interface Geo {
  ip: string | null;
  country: string | null;
  city: string | null;
}

const fetchGeo = async (): Promise<Geo> => {
  try {
    const res = await fetch("/api/public/geo", { cache: "no-store" });
    if (res.ok) {
      const body = await res.json();
      if (body?.ip || body?.country) {
        return {
          ip: body.ip ?? null,
          country: body.country ?? null,
          city: body.city ?? null,
        };
      }
    }
  } catch {
    /* fall through */
  }
  try {
    const res = await fetch("https://api.ipify.org?format=json");
    if (res.ok) {
      const body = await res.json();
      return { ip: typeof body.ip === "string" ? body.ip : null, country: null, city: null };
    }
  } catch {
    /* ignore */
  }
  return { ip: null, country: null, city: null };
};

export const getSessionId = () =>
  typeof window === "undefined" ? null : localStorage.getItem(SESSION_KEY);

export const getSessionBand = (): RiskBand =>
  (typeof window === "undefined"
    ? "low"
    : ((localStorage.getItem(BAND_KEY) as RiskBand) || "low"));

export const isStepUpSatisfied = () =>
  typeof window !== "undefined" && sessionStorage.getItem(STEPUP_KEY) === "true";

export const clearSessionRisk = () => {
  if (typeof window === "undefined") return;
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(BAND_KEY);
  sessionStorage.removeItem(STEPUP_KEY);
};

/** Score the sign-in and record a session. Never throws. */
export const startRiskSession = async (userId: string): Promise<RiskResult> => {
  try {
    const geo = await fetchGeo();
    const { data, error } = await supabase.rpc("evaluate_session_risk", {
      _user_id: userId,
      _fingerprint: getDeviceFingerprint(),
      _ip: (geo.ip ?? null) as unknown as string,
      _country: geo.country ?? undefined,
      _city: geo.city ?? undefined,
      _user_agent: navigator.userAgent.slice(0, 400),
      _local_hour: new Date().getHours(),
    });
    if (error || !data) return { success: false };
    const result = data as unknown as RiskResult;
    if (result.session_id) localStorage.setItem(SESSION_KEY, result.session_id);
    if (result.band) localStorage.setItem(BAND_KEY, result.band);
    if (result.requires_step_up) sessionStorage.removeItem(STEPUP_KEY);
    else sessionStorage.setItem(STEPUP_KEY, "true");
    return result;
  } catch {
    return { success: false };
  }
};

/** Mark the current session as PIN-confirmed after a successful step-up. */
export const confirmStepUp = async () => {
  const id = getSessionId();
  sessionStorage.setItem(STEPUP_KEY, "true");
  if (!id) return;
  try {
    await supabase.rpc("mark_session_verified", { _session_id: id });
  } catch {
    /* non-blocking */
  }
};

export const listMySessions = async () => {
  const { data, error } = await supabase
    .from("user_sessions")
    .select("id, device_fingerprint, ip_address, country, city, user_agent, risk_band, risk_score, status, step_up_verified_at, last_seen_at, created_at")
    .order("last_seen_at", { ascending: false })
    .limit(30);
  if (error) throw error;
  return data ?? [];
};

export const endSession = async (sessionId: string) => {
  const { error } = await supabase.rpc("terminate_session", { _session_id: sessionId });
  if (error) throw error;
};

export const endOtherSessions = async () => {
  const { error } = await supabase.rpc("terminate_other_sessions", {
    _keep_session_id: (getSessionId() ?? null) as unknown as string,
  });
  if (error) throw error;
};
