export function getAccessToken(): string | null {
  const token = localStorage.getItem("accessToken");
  const expiry = localStorage.getItem("tokenExpiry");

  if (!token || !expiry) return null;

  const isExpired = new Date().getTime() > parseInt(expiry);
  if (isExpired) {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("tokenExpiry");
      return null;
  }

  return token;
}
