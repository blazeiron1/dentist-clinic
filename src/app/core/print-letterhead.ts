export const CLINIC_INFO = {
  name: 'Mersiha Dental',
  address: 'ul. Dame Gruev br. 11a, Ohrid 6000',
  phone: '076454024',
  email: 'dmersihaljato@gmail.com',
  logoUrl: '/logo.png',
};

export function letterheadStyles(): string {
  return `
  .letterhead { display: flex; align-items: center; gap: 16px; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 2px solid #ddd; }
  .letterhead-logo { width: 64px; height: 64px; object-fit: contain; }
  .letterhead-name { font-size: 20px; font-weight: 700; }
  .letterhead-detail { font-size: 11px; color: #555; }`;
}

export function letterheadHtml(): string {
  const c = CLINIC_INFO;
  return `
  <div class="letterhead">
    <img class="letterhead-logo" src="${c.logoUrl}" alt="${c.name}" />
    <div>
      <div class="letterhead-name">${c.name}</div>
      <div class="letterhead-detail">${c.address}</div>
      <div class="letterhead-detail">${c.phone} &middot; ${c.email}</div>
    </div>
  </div>`;
}
