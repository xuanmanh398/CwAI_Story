/// <reference types="vite/client" />

declare global {
  interface Response {
    json(): Promise<any>;
  }
}

export {};
