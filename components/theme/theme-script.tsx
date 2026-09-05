/**
 * Blocking inline script that applies the stored theme before first paint.
 * Must be rendered in <head> to avoid a flash of the wrong theme.
 */
export function ThemeScript() {
  const script = `(function(){try{var k=${JSON.stringify("lifekit-theme")};var t=localStorage.getItem(k)||"system";var d=t==="dark"||(t!=="light"&&window.matchMedia("(prefers-color-scheme: dark)").matches);var r=document.documentElement;r.classList.toggle("dark",d);r.style.colorScheme=d?"dark":"light";}catch(e){}})();`;

  return (
    <script
      dangerouslySetInnerHTML={{ __html: script }}
      suppressHydrationWarning
    />
  );
}
