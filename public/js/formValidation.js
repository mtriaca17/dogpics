(function () {
  const forms = document.querySelectorAll('.validate-form');
  console.log(forms);
  Array.from(forms).forEach(form => {
    form.addEventListener(
      'submit',
      e => {
        if (!form.checkValidity()) {
          e.preventDefault();
          e.stopPropagation();
        }
        // form.children.forEach(element => {
        //   console.log(element);
        // });
        for (let child of form.children) {
          if (child.tagName === 'DIV') {
          }
        }
        // form.classList.add('help', 'is-danger');
      },
      false
    );
  });
})();
