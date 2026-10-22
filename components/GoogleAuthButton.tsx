"use client";
import { useEffect, useRef, useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { LoaderCircle } from "lucide-react";

export function GoogleAuthButton({ onCredential, disabled = false }: { onCredential: (credential: string) => Promise<void>; disabled?: boolean }) {
  const container = useRef<HTMLDivElement>(null); const [width, setWidth] = useState(320), [loading, setLoading] = useState(false), [error, setError] = useState("");
  const configured = Boolean(process.env.NEXT_PUBLIC_GOOGLE_WEB_CLIENT_ID);
  useEffect(() => { const resize = () => setWidth(Math.max(200, Math.min(400, Math.floor(container.current?.clientWidth || 320)))); resize(); const observer = new ResizeObserver(resize); if (container.current) observer.observe(container.current); return () => observer.disconnect(); }, []);
  return <><div className="auth-divider"><span/>OR<span/></div><div ref={container} className="google-button-wrap" aria-busy={loading}>{loading ? <div className="google-loading"><LoaderCircle className="spin" size={19}/>Signing in with Google…</div> : configured ? <GoogleLogin width={width} size="large" shape="pill" text="continue_with" theme="outline" logo_alignment="left" onSuccess={async response => { if (!response.credential) return setError("Google did not return a valid credential."); setLoading(true); setError(""); try { await onCredential(response.credential); } catch (reason: any) { setError(reason.message || "Google sign-in failed."); } finally { setLoading(false); } }} onError={() => setError("Google sign-in was cancelled or failed.")} /> : <button type="button" className="google-placeholder" disabled={disabled}>G&nbsp;&nbsp; Continue with Google</button>}</div>{!configured && <p className="google-config-note">Google sign-in will be enabled after the web client ID is added.</p>}{error && <div className="notice error" style={{marginTop:10}}>{error}</div>}</>;
}
