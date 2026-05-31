function svgData(svg: string) {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

export function fallbackBiographyIllustrationDataUrl(promptHint: string) {
  const lazy = /(懒|不想干|摆烂|躺|低能量)/.test(promptHint);
  const work = /(职场|老板|领导|工作|被骂|不重视)/.test(promptHint);
  const figure = lazy
    ? `<path d="M260 526c36-42 95-42 132 0 22-28 55-31 80-8 25 24 21 72-9 91-48 30-154 25-196-8-25-20-26-51-7-75Z" fill="#f7e8c9" stroke="#2b2118" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>
       <path d="M294 513l-19-37M446 512l22-36M337 555c9 9 20 9 29 0M408 555c9 9 20 9 29 0M354 586c22 17 45 17 66 0" fill="none" stroke="#2b2118" stroke-width="7" stroke-linecap="round"/>
       <path d="M188 642c114 33 247 34 360 0" fill="none" stroke="#7a5428" stroke-width="11" stroke-linecap="round" opacity=".55"/>`
    : work
      ? `<path d="M202 574c82 44 230 44 312 0-27 55-90 88-156 88s-129-33-156-88Z" fill="#f7e8c9" stroke="#2b2118" stroke-width="9" stroke-linejoin="round"/>
         <path d="M358 268v294M358 268c41 45 77 91 108 139-44-11-79-11-108 0M358 268c-36 48-68 95-96 141 34-11 66-11 96 0" fill="none" stroke="#2b2118" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
         <path d="M170 681c124 23 255 23 380 0" fill="none" stroke="#7a5428" stroke-width="10" stroke-linecap="round" opacity=".55"/>`
      : `<rect x="242" y="350" width="236" height="230" rx="16" fill="#f7e8c9" stroke="#2b2118" stroke-width="9"/>
         <path d="M274 410h170M274 462h170M274 514h112" stroke="#2b2118" stroke-width="7" stroke-linecap="round" opacity=".72"/>
         <path d="M198 644c108 30 223 31 344 0" fill="none" stroke="#7a5428" stroke-width="10" stroke-linecap="round" opacity=".55"/>`;
  return svgData(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 920">
  <defs>
    <radialGradient id="paper" cx="42%" cy="22%" r="86%"><stop offset="0" stop-color="#f3e4bf"/><stop offset="1" stop-color="#d7bd83"/></radialGradient>
    <filter id="grain"><feTurbulence type="fractalNoise" baseFrequency=".78" numOctaves="4"/><feColorMatrix type="saturate" values=".18"/><feBlend in="SourceGraphic" mode="multiply"/></filter>
  </defs>
  <rect width="720" height="920" rx="34" fill="url(#paper)"/>
  <path d="M96 230c86-39 174-43 263-13 77 26 160 20 249-22" fill="none" stroke="#2b2118" stroke-width="8" stroke-linecap="round" opacity=".18"/>
  <path d="M118 728c140 45 306 45 482 0" fill="none" stroke="#2b2118" stroke-width="8" stroke-linecap="round" opacity=".16"/>
  ${figure}
  <path d="M272 800c56 20 120 20 176 0" fill="none" stroke="#7a5428" stroke-width="8" stroke-linecap="round" opacity=".42"/>
  <rect width="720" height="920" rx="34" fill="transparent" filter="url(#grain)" opacity=".18"/>
</svg>`);
}
