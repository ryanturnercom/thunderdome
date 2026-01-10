import { SessionOptions, getIronSession } from "iron-session";
import { cookies } from "next/headers";
import { SessionData, defaultSession } from "@/types/auth";

export const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET || "complex_password_at_least_32_characters_long",
  cookieName: "thunderdome_session",
  cookieOptions: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24, // 24 hours
  },
};

export async function getSession() {
  const cookieStore = await cookies();
  const session = await getIronSession<SessionData>(cookieStore, sessionOptions);

  if (!session.isAuthenticated) {
    session.isAuthenticated = defaultSession.isAuthenticated;
  }

  return session;
}
