async function downloadExternal(href, download) {
  try {
    const response = await fetch(href);

    if (!response.ok) {
      throw new Error('Network response error');
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const element = document.createElement('a');
    element.href = url;
    element.setAttribute('download', download);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('An error occurred while trying to download the file.', error);
  }
}

export default downloadExternal;
