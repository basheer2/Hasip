export function ThemeScript() {
  const code = `(function(){try{var t=localStorage.getItem('app-theme')||'system';var d=t==='dark'||(t==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);var c=document.documentElement.classList;c.remove('light','dark');c.add(d?'dark':'light');}catch(e){}})();`
  return <script dangerouslySetInnerHTML={{ __html: code }} />
}
