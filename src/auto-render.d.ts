declare module 'katex/dist/contrib/auto-render.mjs' {
  export interface RenderMathInElementOptions {
    delimiters?: Array<{
      left: string;
      right: string;
      display: boolean;
    }>;
    ignoredTags?: string[];
    ignoredClasses?: string[];
    errorCallback?: (msg: string, err: Error) => void;
    preProcess?: (math: string) => string;
    throwOnError?: boolean;
  }

  export default function renderMathInElement(
    elem: HTMLElement,
    options?: RenderMathInElementOptions
  ): void;
}
