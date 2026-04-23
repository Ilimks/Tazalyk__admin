/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  readonly VITE_API_TIMEOUT: string;

  readonly VITE_ADMIN_USERNAME: string;
  readonly VITE_ADMIN_PASSWORD: string;
  readonly VITE_CONTENT_USERNAME: string;
  readonly VITE_CONTENT_PASSWORD: string;
  readonly VITE_PROCUREMENT_USERNAME: string;
  readonly VITE_PROCUREMENT_PASSWORD: string;
  readonly VITE_VIEWER_USERNAME: string;
  readonly VITE_VIEWER_PASSWORD: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module '*.module.scss' {
  const classes: { readonly [key: string]: string };
  export default classes;
}

declare module '*.svg' {
  const content: string;
  export default content;
}

declare module '*.png' {
  const content: string;
  export default content;
}

declare module '*.jpg' {
  const content: string;
  export default content;
}

declare module '*.jpeg' {
  const content: string;
  export default content;
}