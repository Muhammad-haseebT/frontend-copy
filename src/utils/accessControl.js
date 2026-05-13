import Cookies from "js-cookie";

export function getAccountFromCookie() {
  try {
    const account = Cookies.get("account");
    return account ? JSON.parse(account) : null;
  } catch (error) {
    console.error("Error parsing user cookie:", error);
    return null;
  }
}

export function isAdminAccount(account) {
  return account?.role?.toUpperCase() === "ADMIN";
}

export function getMatchAccess(scorerId, mediaScorerUsername) {
  const account = getAccountFromCookie();
  const username = account?.username;
  const isAdmin = isAdminAccount(account);
  const isScorer = isAdmin || username == scorerId;
  const isMediaPerson = isAdmin || username == mediaScorerUsername;

  return {
    account,
    isAdmin,
    isScorer,
    isMediaPerson,
    canEditMatch: isAdmin || isScorer || isMediaPerson,
  };
}
