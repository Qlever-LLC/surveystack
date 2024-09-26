function copyTextToClipboard(text) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).catch((err) => {
      console.error('Async: Could not copy text: ', err);
    });
  } else {
    console.warn("Can't copy to clipboard:", text);
  }
}

export default copyTextToClipboard;
