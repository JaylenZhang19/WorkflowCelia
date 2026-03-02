export interface QueryMessage {
  header: Header;

  payload: Payload;
}

export interface Header {
  namespace: string;

  name: string;
}

export interface Payload {
  args: Record<string, object>;
}