import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

/**
 * Root HTML untuk export web statis (hanya dijalankan di Node.js saat build).
 *
 * HTML statis selalu dirender dengan tema light. Script di bawah berjalan sebelum halaman tampil:
 * bila pengguna menyimpan tema dark, latar langsung gelap dan #root disembunyikan sampai
 * AppThemeProvider selesai memasang tema (lalu menghapus atribut data-theme-pending).
 * Tanpa ini pengguna dark mode melihat kilasan tampilan light setiap kali halaman dimuat.
 */
const THEME_BOOT_SCRIPT = `try{var s=JSON.parse(localStorage.getItem('bubox-theme-storage')||'null');if(s&&s.state&&s.state.themeMode==='dark'){document.documentElement.setAttribute('data-theme-pending','dark');setTimeout(function(){document.documentElement.removeAttribute('data-theme-pending')},4000)}}catch(e){}`;

/**
 * Area admin selalu tampilan desktop (lihat useDesktopViewport): bila halaman admin dibuka langsung,
 * meta viewport diganti sebelum halaman tampil supaya browser HP langsung merender versi desktop.
 * Lebar 1280 = ADMIN_DESKTOP_WIDTH.
 */
const ADMIN_VIEWPORT_BOOT_SCRIPT = `try{var p=location.pathname;if(p==='/admin'||p.indexOf('/admin/')===0){var w=1280,sw=(screen&&screen.width)||w,m=document.querySelector('meta[name="viewport"]');if(m)m.setAttribute('content','width='+w+', initial-scale='+Math.min(1,sw/w).toFixed(3))}}catch(e){}`;

const THEME_BOOT_STYLE = `html[data-theme-pending=dark],html[data-theme-pending=dark] body{background-color:#0A0A0A}html[data-theme-pending=dark] #root{visibility:hidden}`;

export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="id">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <ScrollViewStyleReset />
        <style dangerouslySetInnerHTML={{ __html: THEME_BOOT_STYLE }} />
        <script dangerouslySetInnerHTML={{ __html: ADMIN_VIEWPORT_BOOT_SCRIPT }} />
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT_SCRIPT }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
