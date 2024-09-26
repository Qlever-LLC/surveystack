async function downloadExternal(store, href, download) {
  console.log('downloadExternal', href);
  try {
    const response = await fetch(href);
    console.log('response', response);

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
    store.dispatch('feedback/add', 'An error occurred while trying to download the file.', { root: true });
  }
}

export default downloadExternal;
