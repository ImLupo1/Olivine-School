(() => {
  const themes = ['green', 'black'];
  let theme = 'green';
  let contrast = 'normal';
  try {
    theme = localStorage.getItem('olivine.theme') || 'green';
    contrast = localStorage.getItem('olivine.contrast') === 'true' ? 'high' : 'normal';
  } catch {}
  if (!themes.includes(theme)) theme = 'green';
  document.documentElement.dataset.theme = theme;
  document.documentElement.dataset.contrast = contrast;
  const colors = { green: '#123c34', black: '#000000' };
  const themeColor = document.querySelector('meta[name="theme-color"]');
  if (themeColor) themeColor.content = colors[theme];
})();
