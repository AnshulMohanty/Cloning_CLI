import type { VirtualFile } from "@/lib/types";

const SITE_PATHS = [
  {
    index: "generated-site/index.html",
    styles: "generated-site/styles.css",
    script: "generated-site/script.js"
  },
  {
    index: "scaler-clone/index.html",
    styles: "scaler-clone/styles.css",
    script: "scaler-clone/script.js"
  }
];

export function buildPreviewHtml(files: VirtualFile[]): string | null {
  const paths = SITE_PATHS.find((sitePaths) =>
    files.some((file) => file.path === sitePaths.index)
  );

  if (!paths) {
    return null;
  }

  const indexFile = files.find((file) => file.path === paths.index);

  if (!indexFile) {
    return null;
  }

  const styles = files.find((file) => file.path === paths.styles)?.content;
  const script = files.find((file) => file.path === paths.script)?.content;

  let html = indexFile.content;

  if (styles) {
    const styleTag = `<style>${styles}</style>`;

    if (/<\/head>/i.test(html)) {
      html = html.replace(/<\/head>/i, `${styleTag}</head>`);
    } else {
      html = `${styleTag}${html}`;
    }
  }

  if (script) {
    const scriptTag = `<script>${script}</script>`;

    if (/<\/body>/i.test(html)) {
      html = html.replace(/<\/body>/i, `${scriptTag}</body>`);
    } else {
      html = `${html}${scriptTag}`;
    }
  }

  return html;
}
