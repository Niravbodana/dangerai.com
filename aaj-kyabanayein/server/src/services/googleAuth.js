import { OAuth2Client } from "google-auth-library";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export async function verifyGoogleIdToken(idToken) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    throw new Error("Google login abhi configure nahi hai. GOOGLE_CLIENT_ID set karein.");
  }

  const ticket = await client.verifyIdToken({
    idToken,
    audience: clientId,
  });

  const payload = ticket.getPayload();
  if (!payload?.email) {
    throw new Error("Google account se email nahi mili");
  }

  if (payload.email_verified === false) {
    throw new Error("Google email verified nahi hai");
  }

  return {
    googleId: payload.sub,
    email: payload.email.toLowerCase(),
    name: payload.name || payload.email.split("@")[0],
    picture: payload.picture || null,
  };
}
