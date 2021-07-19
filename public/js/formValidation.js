// (function () {
//   const forms = document.querySelectorAll('.validate-form');
//   console.log(forms);
//   Array.from(forms).forEach(form => {
//     form.addEventListener(
//       'submit',
//       e => {
//         if (!form.checkValidity()) {
//           e.preventDefault();
//           e.stopPropagation();
//         }
//         // form.children.forEach(element => {
//         for (let child of form.childern) {
//           if (child.tagName === 'DIV') {
//             // document.querySelector('.validation-text').hidden = false;
//             console.log('hi');
//           }
//         }
//       },
//       false
//     );
//   });
// })();
// (function () {
//   const newForm = document.querySelector('.validate-form-new');
//   const titleInput = document.querySelector('.title-input');
//   const urlInput = document.querySelector('.url-input');
//   const descriptionInput = document.querySelector('.description-input');
//   console.log(newForm);
//   newForm.addEventListener(
//     'submit',
//     e => {
//       if (!form.checkValidity()) {
//         e.preventDefault();
//         e.stopPropagation();
//       }
//       titleInput.classList.add('is-danger');
//       urlInput.classList.add('is-danger');
//       descriptionInput.classList.add('is-danger');

//       document.querySelector('.validation-text').style.display = 'visible';
//     },
//     false
//   );
// })();
