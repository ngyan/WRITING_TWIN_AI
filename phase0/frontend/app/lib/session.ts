import { v4 as uuidv4 } from "uuid";

const KEY = "wt_session_id";

export function getSessionId(): string {
  if (typeof window === "undefined") return uuidv4();
  let id = sessionStorage.getItem(KEY);
  if (!id) {
    id = uuidv4();
    sessionStorage.setItem(KEY, id);
  }
  return id;
}
