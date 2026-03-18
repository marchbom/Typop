/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly MAIN_VITE_GENIUS_TOKEN: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
