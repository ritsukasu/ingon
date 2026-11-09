export type Role = "user" | "assistant";

export interface ChatMessage {
  id: string;
  role: Role;
  content: string;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    requestId?: string;
  };
}
