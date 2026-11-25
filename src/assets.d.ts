/// <reference types="vite/client" />
declare module "*.png?inline" {
  const url: string;
  export default url;
}
declare module "*.webp?inline" {
  const url: string;
  export default url;
}

declare module "*.webp?url" {
  const url: string;
  export default url;
}
