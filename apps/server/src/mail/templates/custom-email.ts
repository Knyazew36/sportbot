// Транзакционный шаблон письма: заголовок, абзацы, опциональный код и кнопка-CTA.
// Plain-HTML (без react-email) — почтовым клиентам нужен инлайновый стиль, рантайм-зависимостей не тянем.

// Читается при рендере письма, а не при импорте: модуль загружается раньше, чем ConfigModule прочитает .env
const brand = (): string => process.env.APP_NAME?.trim() || 'App';
const BRAND_COLOR = '#524ae9';

export interface CustomEmailParams {
  previewText: string;
  heading: string;
  paragraphs: string[];
  code?: string;
  buttonLabel?: string;
  buttonUrl?: string;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function renderCustomEmail({
  previewText,
  heading,
  paragraphs,
  code,
  buttonLabel,
  buttonUrl,
}: CustomEmailParams): string {
  const preview = escapeHtml(previewText);

  const paragraphsHtml = paragraphs
    .map(
      (p) =>
        `<p style="font-size:15px;line-height:24px;color:#374151;margin:0 0 12px">${escapeHtml(p)}</p>`,
    )
    .join('');

  const codeHtml = code
    ? `<p style="background-color:#f4f5f7;border:1px solid #e5e7eb;border-radius:8px;color:${BRAND_COLOR};font-family:'JetBrains Mono',monospace;font-size:28px;font-weight:700;letter-spacing:6px;text-align:center;padding:16px;margin:4px 0 20px">${escapeHtml(code)}</p>`
    : '';

  const buttonHtml =
    buttonLabel && buttonUrl
      ? `<a href="${escapeHtml(buttonUrl)}" style="background-color:${BRAND_COLOR};border-radius:8px;color:#ffffff;font-size:15px;font-weight:600;text-decoration:none;padding:12px 20px;display:inline-block;margin:8px 0 20px">${escapeHtml(buttonLabel)}</a>`
      : '';

  return `<!doctype html>
<html>
  <head><meta charset="utf-8" /><title>${escapeHtml(heading)}</title></head>
  <body style="background-color:#f4f5f7;font-family:'Onest','Golos Text',Arial,sans-serif;padding:24px 0;margin:0">
    <span style="display:none;max-height:0;overflow:hidden">${preview}</span>
    <div style="background-color:#ffffff;border-radius:12px;margin:0 auto;padding:32px;max-width:480px">
      <p style="color:${BRAND_COLOR};font-size:14px;font-weight:700;letter-spacing:0.5px;text-transform:uppercase;margin:0 0 16px">${brand()}</p>
      <h1 style="font-size:22px;font-weight:700;color:#111827;margin:0 0 16px">${escapeHtml(heading)}</h1>
      ${paragraphsHtml}
      ${codeHtml}
      ${buttonHtml}
      <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0 16px" />
      <p style="font-size:12px;color:#9ca3af;margin:0">Это письмо отправлено сервисом «${brand()}».</p>
    </div>
  </body>
</html>`;
}
