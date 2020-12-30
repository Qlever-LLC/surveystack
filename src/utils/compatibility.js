export function isIos() {
  const userAgent = window.navigator.userAgent.toLowerCase();
  return /iphone|ipad|ipod/.test(userAgent);
}

export function isIosSafari() {
  const userAgent = window.navigator.userAgent.toLowerCase();
  return /(iphone|ipad|ipod).*version/.test(userAgent);
}

export function isSafari() {
  return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
}

export function isInStandaloneMode() {
  return ('standalone' in window.navigator)
    && window.navigator.standalone;
}
