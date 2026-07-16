import { ClinicInfo } from './services/clinic-info.service';

export function letterheadStyles(): string {
  return `
  .letterhead { display: flex; align-items: center; gap: 16px; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 2px solid #ddd; }
  .letterhead-logo { width: 64px; height: 64px; object-fit: contain; }
  .letterhead-name { font-size: 20px; font-weight: 700; }
  .letterhead-detail { font-size: 11px; color: #555; }`;
}

export function letterheadHtml(clinicInfo: ClinicInfo, logoBase64?: string): string {
  const c = clinicInfo;
  const logoSrc = logoBase64 || c.logoUrl;
  const contactParts = [c.phone, c.email].filter(Boolean);
  return `
  <div class="letterhead">
    ${logoSrc ? `<img class="letterhead-logo" src="${logoSrc}" alt="${c.name}" />` : ''}
    <div>
      ${c.name ? `<div class="letterhead-name">${c.name}</div>` : ''}
      ${c.address ? `<div class="letterhead-detail">${c.address}</div>` : ''}
      ${contactParts.length ? `<div class="letterhead-detail">${contactParts.join(' &middot; ')}</div>` : ''}
    </div>
  </div>`;
}

export async function fetchLogoAsBase64(url: string): Promise<string | undefined> {
  if (!url) return undefined;
  try {
    const response = await fetch(url, { credentials: 'include' });
    if (!response.ok) return undefined;
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(undefined);
      reader.readAsDataURL(blob);
    });
  } catch {
    return undefined;
  }
}
