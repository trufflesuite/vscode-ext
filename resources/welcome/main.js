$(function () {
  main();
});

function main() {
  const vscode = acquireVsCodeApi();
  $("a").click(function() {
    if (this.href) {
      vscode.postMessage({
        href: this.href
      });
    } else {
      vscode.postMessage({ command: this.id});
    }

    if ($(this).hasClass('action')) {
      $(this.closest('.required-app')).toggleClass('disabled');
    }
  });

  $(".interactive").click((event) => {
    if (!$(event.target).is("a") && !$(event.target).is(".detail") &&
      $(event.target).parents(".detail").length === 0) {
      $(event.currentTarget).find(".detail").toggle(1000);
      $(event.currentTarget).find(".arrow").toggleClass("arrow-up");
      vscode.postMessage({
        href: `toggle:${$(event.currentTarget).attr("id")}`
      });
    }
  });

  $(window).scroll(() => {
    let offset = 250;
    let duration = 600;
    if ($(this).scrollTop() >= offset) {
      $('#back-to-top').fadeIn(duration);
    } else {
      $('#back-to-top').fadeOut(duration);
    }
  });

  $(document).ready(() => {
    vscode.postMessage({ command: 'documentReady'});
  });

  $('#showOnStartup').change(function() {
    vscode.postMessage({ command: 'toggleShowPage', value: this.checked});
  });

  window.addEventListener('message', (event) => {
    const message = event.data; // The JSON data our extension sent

    if (message.command === 'versions') {
      const versions = message.value;
      if (Array.isArray(versions)) {
        versions.forEach((version) => {
          const element = $(`#${version.app}`);
          const spinner = $(`#${version.app} .spinner`);
          element.toggleClass('disabled', version.isValid);
          spinner.toggleClass('spinner', false);
        });
      }
    }
    if (message.command === 'showOnStartup') {
      $('#showOnStartup').attr('checked', !!message.value);
    }
  });
}
