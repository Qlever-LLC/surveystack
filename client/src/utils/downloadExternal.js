function downloadExternal(href, download) {
  const element = document.createElement('a');
  element.setAttribute('href', href);
  element.setAttribute('download', download);
  element.style.display = 'none';
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
}

export default downloadExternal;
