// ep1_keys.js
// Handles OB row click progression (label → detail → box)

document
  .querySelectorAll('.pane-ob .ob_row')
  .forEach(initOBRow);

function initOBRow(row) {
  const label = row.querySelector('.ob_label');
  const detail = row.querySelector('.ob_detail');

  let step = 0; // 0 = none, 1 = label, 2 = detail, 3 = box shown

  row.addEventListener('click', (e) => {
    e.stopPropagation();

    if (step === 0) {
      label.classList.add('active');
      step = 1;
      return;
    }

    if (step === 1) {
      detail.classList.add('active');
      step = 2;

      // notify connections.js
      if (window.checkOBActivationState) {
        window.checkOBActivationState();
      }
      return;
    }

    if (step === 2) {
      // 🔑 third click → show the box
      if (window.showKeyBoxForOBRow) {
        window.showKeyBoxForOBRow(row);
      }
      step = 3;
    }
  });
}
