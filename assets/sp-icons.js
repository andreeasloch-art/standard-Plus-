/* Standard Plus – Icon-Sprite (ersetzt sämtliche Emojis)
   Wird beim Laden einmal in den DOM injiziert. Verwendung:
   <svg class="ic" aria-hidden="true"><use href="#i-target"></use></svg>          */
(function () {
  'use strict';
  var I = {
    /* Navigation & Struktur */
    bulb:'<path d="M9 18h6"/><path d="M10 21.5h4"/><path d="M12 2.5a6.5 6.5 0 0 0-4 11.6c.7.6 1 1.4 1 2.3v1.1h6v-1.1c0-.9.4-1.7 1-2.3a6.5 6.5 0 0 0-4-11.6z"/>',
    karten:'<rect x="7.5" y="3" width="13" height="16" rx="2"/><path d="M4.5 6.5v12a2.5 2.5 0 0 0 2.5 2.5h9"/>',
    undo:'<path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>',
    grid:'<rect x="3" y="3" width="7.5" height="7.5" rx="1.5"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="1.5"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="1.5"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.5"/>',
    target:'<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.4"/>',
    users:'<circle cx="9" cy="7.5" r="3.8"/><path d="M2.5 20.5v-1a6 6 0 0 1 6-6h1a6 6 0 0 1 6 6v1"/><path d="M17 4.2a3.8 3.8 0 0 1 0 6.6"/><path d="M21.5 20.5v-1a6 6 0 0 0-3-5.2"/>',
    user:'<circle cx="12" cy="8" r="4"/><path d="M4.5 20.5v-.8a6 6 0 0 1 6-6h3a6 6 0 0 1 6 6v.8"/>',
    search:'<circle cx="11" cy="11" r="7"/><path d="M16.2 16.2 21 21"/>',
    list:'<circle cx="4" cy="6" r="1.2"/><circle cx="4" cy="12" r="1.2"/><circle cx="4" cy="18" r="1.2"/><path d="M9 6h12M9 12h12M9 18h12"/>',
    doc:'<path d="M13 2.5H7a1.5 1.5 0 0 0-1.5 1.5v16A1.5 1.5 0 0 0 7 21.5h10a1.5 1.5 0 0 0 1.5-1.5V8z"/><path d="M13 2.5V8h5.5"/><path d="M9 13h6M9 17h6"/>',
    chat:'<path d="M20.5 14.5a2 2 0 0 1-2 2H8l-4.5 4V5.5a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2z"/><path d="M8 8.5h8M8 12h5"/>',
    video:'<rect x="2.5" y="6" width="13" height="12" rx="2.5"/><path d="M15.5 11 21 7.5v9L15.5 13z"/>',
    globe:'<circle cx="12" cy="12" r="9"/><path d="M3.2 9.5h17.6M3.2 14.5h17.6"/><path d="M12 3c2.6 3 2.6 15 0 18M12 3c-2.6 3-2.6 15 0 18"/>',
    bus:'<rect x="3.5" y="3.5" width="17" height="13" rx="2.5"/><path d="M3.5 11.5h17"/><path d="M7 20.5v-1.5M17 20.5v-1.5"/><circle cx="7.5" cy="14" r="1"/><circle cx="16.5" cy="14" r="1"/>',
    chart:'<path d="M3.5 20.5h17"/><path d="M6.5 20.5V12M11.5 20.5V4.5M16.5 20.5v-6"/>',
    sliders:'<path d="M4 7h4M12 7h8M4 12h10M18 12h2M4 17h6M14 17h6"/><circle cx="10" cy="7" r="2"/><circle cx="16" cy="12" r="2"/><circle cx="12" cy="17" r="2"/>',
    bell:'<path d="M18 16.5v-5.2a6 6 0 1 0-12 0v5.2l-1.8 2h15.6z"/><path d="M9.8 21.2a2.6 2.6 0 0 0 4.4 0"/>',
    /* Sicherheit */
    shield:'<path d="M12 2.8 20 5.6v6.1c0 5-3.4 8.3-8 9.5-4.6-1.2-8-4.5-8-9.5V5.6z"/>',
    shieldcheck:'<path d="M12 2.8 20 5.6v6.1c0 5-3.4 8.3-8 9.5-4.6-1.2-8-4.5-8-9.5V5.6z"/><path d="M8.7 11.8 11.2 14.4 15.6 9.8"/>',
    lock:'<rect x="4" y="10" width="16" height="11" rx="2.5"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/><circle cx="12" cy="15.5" r="1.3"/>',
    key:'<circle cx="8" cy="15" r="4"/><path d="M10.9 12.1 20 3M17 6l2.5 2.5M14.5 8.5 17 11"/>',
    fingerprint:'<path d="M12 11v2.5a7 7 0 0 1-1.4 4.2"/><path d="M8.5 12a3.5 3.5 0 0 1 7 0v1a11 11 0 0 1-.8 4"/><path d="M5.5 12a6.5 6.5 0 0 1 13 0v1.5a15 15 0 0 1-.5 3.7"/><path d="M2.8 9.6A9.6 9.6 0 0 1 12 2.5a9.6 9.6 0 0 1 8 4.3"/><path d="M6 19.6A9 9 0 0 0 8 15"/>',
    server:'<rect x="3" y="3.5" width="18" height="7" rx="2"/><rect x="3" y="13.5" width="18" height="7" rx="2"/><path d="M7 7h.01M7 17h.01"/><path d="M11 7h5M11 17h5"/>',
    eye:'<path d="M2 12s3.6-6.2 10-6.2S22 12 22 12s-3.6 6.2-10 6.2S2 12 2 12z"/><circle cx="12" cy="12" r="2.6"/>',
    eyeoff:'<path d="M4 4 20 20"/><path d="M9.6 9.7A2.6 2.6 0 0 0 12 14.6"/><path d="M6.3 6.6C3.8 8.2 2 12 2 12s3.6 6.2 10 6.2c1.6 0 3-.4 4.2-1"/><path d="M18.6 15.3C20.9 13.7 22 12 22 12s-3.6-6.2-10-6.2c-.9 0-1.7.1-2.5.3"/>',
    alert:'<path d="M12 3.5 21.5 20H2.5z"/><path d="M12 10v4"/><circle cx="12" cy="17" r=".9" fill="currentColor" stroke="none"/>',
    /* Aktionen */
    check:'<path d="M4.5 12.5 9.5 17.5 19.5 6.5"/>',
    x:'<path d="M6 6 18 18M18 6 6 18"/>',
    plus:'<path d="M12 5v14M5 12h14"/>',
    minus:'<path d="M5 12h14"/>',
    heart:'<path d="M12 20.3S3.8 15.4 3.8 10.2A4.2 4.2 0 0 1 12 8.3a4.2 4.2 0 0 1 8.2 1.9c0 5.2-8.2 10.1-8.2 10.1z"/>',
    arrowright:'<path d="M4.5 12h14M13 6.5 18.5 12 13 17.5"/>',
    arrowleft:'<path d="M19.5 12h-14M11 6.5 5.5 12 11 17.5"/>',
    arrowup:'<path d="M12 19.5v-15M6.5 10 12 4.5 17.5 10"/>',
    arrowdown:'<path d="M12 4.5v15M6.5 14 12 19.5 17.5 14"/>',
    chevrondown:'<path d="m6 9.5 6 6 6-6"/>',
    external:'<path d="M14 4h6v6M20 4l-9 9"/><path d="M18 14v5.5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5.5"/>',
    download:'<path d="M12 3.5v11M7.5 10.5 12 15l4.5-4.5"/><path d="M4 20.5h16"/>',
    upload:'<path d="M12 15.5v-11M7.5 8.5 12 4l4.5 4.5"/><path d="M4 20.5h16"/>',
    trash:'<path d="M4 6.5h16"/><path d="M9.5 6.5V4.8A1.3 1.3 0 0 1 10.8 3.5h2.4a1.3 1.3 0 0 1 1.3 1.3v1.7"/><path d="M6.5 6.5 7.4 19.7a1.3 1.3 0 0 0 1.3 1.2h6.6a1.3 1.3 0 0 0 1.3-1.2l.9-13.2"/><path d="M10.5 10.5v6M13.5 10.5v6"/>',
    refresh:'<path d="M20.5 12a8.5 8.5 0 1 1-2.6-6.1"/><path d="M20.5 4v5h-5"/>',
    filter:'<path d="M3.5 5.5h17l-6.5 7.5v6l-4 2v-8z"/>',
    logout:'<path d="M10 3.5H6.5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2H10"/><path d="M15 8l4 4-4 4"/><path d="M9 12h10"/>',
    menu:'<path d="M4 6.5h16M4 12h16M4 17.5h16"/>',
    play:'<path d="M7.5 5 19 12 7.5 19z"/>',
    pause:'<rect x="7" y="5" width="3.5" height="14" rx="1"/><rect x="13.5" y="5" width="3.5" height="14" rx="1"/>',
    star:'<path d="m12 3.6 2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.5 9.8l5.9-.9z"/>',
    clock:'<circle cx="12" cy="12" r="9"/><path d="M12 6.8V12l3.4 2"/>',
    calendar:'<rect x="3.5" y="5" width="17" height="16" rx="2"/><path d="M3.5 10h17M8.5 3v4M15.5 3v4"/>',
    mail:'<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="M3.6 6.8 12 13l8.4-6.2"/>',
    pin:'<path d="M12 21.2s7-6.4 7-11.2a7 7 0 1 0-14 0c0 4.8 7 11.2 7 11.2z"/><circle cx="12" cy="10" r="2.5"/>',
    euro:'<path d="M17.5 6.6A6.4 6.4 0 0 0 8 12a6.4 6.4 0 0 0 9.5 5.4"/><path d="M4.5 10.2h8.5M4.5 13.8h8.5"/>',
    building:'<path d="M4 21V4.5A1.5 1.5 0 0 1 5.5 3h9A1.5 1.5 0 0 1 16 4.5V21"/><path d="M16 10h2.5A1.5 1.5 0 0 1 20 11.5V21"/><path d="M2.5 21h19"/><path d="M7.5 7h1.5M11.5 7H13M7.5 11h1.5M11.5 11H13M7.5 15h1.5M11.5 15H13"/>',
    briefcase:'<rect x="3" y="7" width="18" height="13.5" rx="2.5"/><path d="M8.5 7V5.2A1.7 1.7 0 0 1 10.2 3.5h3.6A1.7 1.7 0 0 1 15.5 5.2V7"/><path d="M3 12.5h18"/>',
    handshake:'<path d="m2.5 12 3.5-3.5 3 1.5 3-1.5 3 1.5 3.5-1.5 3 3.5-3.5 4-2.5-1.5-3 2-3-2-2.5 1.5z"/>',
    cpu:'<rect x="5" y="5" width="14" height="14" rx="3"/><rect x="9" y="9" width="6" height="6" rx="1.5"/><path d="M9 2.5V5M15 2.5V5M9 19v2.5M15 19v2.5M2.5 9H5M2.5 15H5M19 9h2.5M19 15h2.5"/>',
    translate:'<path d="M3 5.5h9"/><path d="M7.5 3.5v2"/><path d="M10.2 5.5c0 3.8-2.7 7-6.7 8.5"/><path d="M5.2 9.4c1.3 2.4 3.4 4 6 4.6"/><path d="M12.5 20.5 17 10l4.5 10.5"/><path d="M14 17h6"/>',
    mic:'<rect x="9" y="2.8" width="6" height="11" rx="3"/><path d="M5.2 11.5a6.8 6.8 0 0 0 13.6 0"/><path d="M12 18.3v2.9"/>',
    micoff:'<path d="M4 4 20 20"/><path d="M9 5.5A3 3 0 0 1 15 6v5"/><path d="M5.2 11.5a6.8 6.8 0 0 0 10.3 5.8M12 18.3v2.9"/>',
    camera:'<rect x="2.5" y="6" width="13" height="12" rx="2.5"/><path d="M15.5 11 21 7.5v9L15.5 13z"/>',
    cameraoff:'<path d="M4 4 20 20"/><path d="M15.5 11 21 7.5v9l-2-1.3"/><path d="M13.5 6H5a2.5 2.5 0 0 0-2.5 2.5v7A2.5 2.5 0 0 0 5 18h9"/>',
    monitor:'<rect x="3" y="4" width="18" height="12.5" rx="2.5"/><path d="M8.5 20.5h7M12 16.5v4"/>',
    phoneoff:'<path d="M3.5 5.2 6 3l3 4-2 2a12 12 0 0 0 2.6 3.4"/><path d="M13.4 15.2 15 13.5l4.5 2.5-2.2 2.5c-2.4.3-5-.7-7.3-2.5"/><path d="M3 21 21 3"/>',
    /* Branchen */
    health:'<path d="M9.5 3.5h5v6h6v5h-6v6h-5v-6h-6v-5h6z"/>',
    helmet:'<path d="M3 17.5h18"/><path d="M5.2 17.5a6.8 6.8 0 0 1 13.6 0"/><path d="M10 4h4v3.2"/><path d="M12 4v3"/>',
    truck:'<rect x="1.5" y="6.5" width="12.5" height="9.5" rx="1.5"/><path d="M14 10h3.6l3 3.2V16H14z"/><circle cx="6" cy="18.5" r="1.8"/><circle cx="17.5" cy="18.5" r="1.8"/>',
    code:'<path d="M8.5 8 4 12l4.5 4M15.5 8 20 12l-4.5 4M13.5 5 10.5 19"/>',
    utensils:'<path d="M6 3v6.5a2.2 2.2 0 0 0 4.4 0V3"/><path d="M8.2 9.5V21"/><path d="M17.5 3c-1.8 1.6-2.4 4-1.6 6.2.3.9 1 1.5 1.6 1.8V21"/>',
    office:'<rect x="3.5" y="3.5" width="17" height="17" rx="2"/><path d="M8 8h3M13 8h3M8 12h3M13 12h3M8 16h8"/>',
    leaf:'<path d="M20 4C10.6 4 4 8.4 4 15.2c0 1.8.6 3.4 1.4 4.6"/><path d="M20 4c1 8.6-4 13.5-10.4 13.5-1.6 0-3-.4-4.2-1.3"/><path d="M18 6.5C13 8.5 8.5 12.5 6 19"/>',
    factory:'<path d="M3 21V11l5.5 3.2V11L14 14.2V11l5.5 3.2V6.5H21V21z"/><path d="M2 21h20"/><path d="M7 18h1.5M12 18h1.5M17 18h1.5"/>',
    cap:'<path d="m2.5 9 9.5-4 9.5 4-9.5 4z"/><path d="M6.5 11v4.4c0 1.7 2.5 3.1 5.5 3.1s5.5-1.4 5.5-3.1V11"/><path d="M21.5 9v5"/>',
    bolt:'<path d="M13.5 2.5 5 13.5h6l-1 8 8.5-11h-6z"/>',
    cart:'<circle cx="9.5" cy="20" r="1.5"/><circle cx="17.5" cy="20" r="1.5"/><path d="M2.5 3.5h2.6l2.6 11.3h11l2.3-8.3H6.3"/>',
    rocket:'<path d="M12 2.5c3 2.3 4.8 6 4.8 9.7l-2.6 3H9.8l-2.6-3C7.2 8.5 9 4.8 12 2.5z"/><circle cx="12" cy="10" r="1.8"/><path d="M9.5 18.5 7 21.5l3.2-.9M14.5 18.5l2.5 3-3.2-.9"/>',
    scale:'<path d="M12 4v17M6.5 21h11"/><path d="M3.5 9h17M12 4l-8.5 5M12 4l8.5 5"/><path d="M3.5 9 1 15a3 3 0 0 0 5 0zM20.5 9 18 15a3 3 0 0 0 5 0z"/>',
    palette:'<path d="M12 3.5a8.5 8.5 0 0 0 0 17c1.4 0 2.2-.9 2.2-2 0-1.5-1.3-1.8-1.3-3 0-.9.8-1.6 1.8-1.6h2A4.8 4.8 0 0 0 21.5 9c-.6-3.3-4.7-5.5-9.5-5.5z"/><circle cx="8" cy="9" r="1.1" fill="currentColor" stroke="none"/><circle cx="12" cy="7.2" r="1.1" fill="currentColor" stroke="none"/><circle cx="16" cy="9" r="1.1" fill="currentColor" stroke="none"/>',
    flask:'<path d="M10 3.5v5.8L4.6 18a2 2 0 0 0 1.7 3h11.4a2 2 0 0 0 1.7-3L14 9.3V3.5"/><path d="M8.5 3.5h7"/><path d="M7.4 14.5h9.2"/>',
    /* Sonstiges */
    info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v5.5"/><circle cx="12" cy="8" r=".9" fill="currentColor" stroke="none"/>',
    help:'<circle cx="12" cy="12" r="9"/><path d="M9.6 9.3a2.5 2.5 0 0 1 4.9.6c0 1.7-2.5 2-2.5 3.6"/><circle cx="12" cy="17" r=".9" fill="currentColor" stroke="none"/>',
    bridge:'<path d="M2.5 17.5h19"/><path d="M4.5 17.5V9M19.5 17.5V9"/><path d="M2.5 10.5c4-3.5 6.5-5 9.5-5s5.5 1.5 9.5 5"/><path d="M9 17.5v-4.2M15 17.5v-4.2M12 17.5V12"/>',
    chevrons:'<path d="m5 6 6 6-6 6M13 6l6 6-6 6"/>',
    settings:'<circle cx="12" cy="12" r="3.2"/><path d="M19.4 14.5a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-2.9 1.2v.2a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-2.9-1.2l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0-1.2-2.9H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.2-2.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 2.9-1.2V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 2.9 1.2l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0 1.2 2.9h.2a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.6 1.5z"/>',
    verified:'<path d="m12 2.5 2.4 1.8 3-.2 1 2.8 2.5 1.6-1 2.9 1 2.9-2.5 1.6-1 2.8-3-.2L12 21.5l-2.4-1.8-3 .2-1-2.8-2.5-1.6 1-2.9-1-2.9 2.5-1.6 1-2.8 3 .2z"/><path d="m8.8 12 2.3 2.3 4.1-4.4"/>',
    portrait:'<circle cx="12" cy="9" r="4.2"/><path d="M3.5 22a8.5 8.5 0 0 1 17 0z"/>'
  };
  var s = '<svg xmlns="http://www.w3.org/2000/svg" class="svg-sprite" aria-hidden="true" focusable="false">';
  for (var k in I) { if (Object.prototype.hasOwnProperty.call(I, k)) {
    s += '<symbol id="i-' + k + '" viewBox="0 0 24 24">' + I[k] + '</symbol>';
  } }
  s += '</svg>';
  function inject(){ var d = document.createElement('div'); d.setAttribute('aria-hidden','true');
    d.className = 'svg-sprite';
    d.innerHTML = s; document.body.insertBefore(d, document.body.firstChild); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', inject);
  else inject();
})();
