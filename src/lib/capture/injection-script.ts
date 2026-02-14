/**
 * Returns the JS to inject into captured pages.
 * This script:
 * 1. Intercepts ALL form submissions
 * 2. STRIPS all credential data (clears inputs before any network request)
 * 3. Sends only a boolean event { token, submitted: true } to the landing server
 * 4. Redirects the user to the learning moment page
 */
export function getInjectionScript(appUrl: string): string {
  return `
(function() {
  // Get token from URL query param
  var params = new URLSearchParams(window.location.search);
  var token = params.get('t');
  if (!token) return;

  // Intercept all form submissions
  document.addEventListener('submit', function(e) {
    e.preventDefault();
    e.stopPropagation();

    // Clear all input values immediately (credential stripping)
    var inputs = document.querySelectorAll('input, textarea, select');
    for (var i = 0; i < inputs.length; i++) {
      inputs[i].value = '';
    }

    // Send ONLY boolean event to the landing server's /submit endpoint
    var xhr = new XMLHttpRequest();
    xhr.open('POST', '/submit', true);
    xhr.setRequestHeader('Content-Type', 'application/json');
    xhr.onreadystatechange = function() {
      if (xhr.readyState === 4) {
        // Redirect to learning moment page regardless of response
        window.location.href = '${appUrl}/learn/' + token;
      }
    };
    xhr.send(JSON.stringify({ token: token, submitted: true }));
  }, true);

  // Also intercept click-based submits on buttons
  document.addEventListener('click', function(e) {
    var target = e.target;
    while (target && target !== document) {
      if (target.type === 'submit' || (target.tagName === 'BUTTON' && target.closest('form'))) {
        // Let the submit event handler above deal with it
        return;
      }
      target = target.parentElement;
    }
  }, true);

  // Block any fetch/XHR to original form actions
  var origFetch = window.fetch;
  window.fetch = function(url, opts) {
    if (typeof url === 'string' && !url.includes('/submit')) {
      return Promise.resolve(new Response('blocked'));
    }
    return origFetch.apply(this, arguments);
  };

  var origXHROpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function(method, url) {
    if (typeof url === 'string' && !url.includes('/submit')) {
      this._blocked = true;
    }
    return origXHROpen.apply(this, arguments);
  };

  var origXHRSend = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.send = function() {
    if (this._blocked) return;
    return origXHRSend.apply(this, arguments);
  };
})();
`;
}
