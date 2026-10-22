"use client";
import { GoogleOAuthProvider } from "@react-oauth/google";
export function GoogleProvider({ children }: { children: React.ReactNode }) { return <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_WEB_CLIENT_ID || "google-oauth-not-configured"}>{children}</GoogleOAuthProvider>; }
