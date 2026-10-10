(() => {
  const board = document.querySelector('.project-possibilities');
  const form = document.querySelector('#inquiry-form');
  const service = document.querySelector('#service');
  if (!board || !form || !service) return;

  const choices = [...board.querySelectorAll('[data-brief-service]')];
  const scene = board.querySelector('.possibilities-scene');
  const caption = board.querySelector('#possibilities-caption');
  const number = board.querySelector('#possibilities-number');
  const status = board.querySelector('#possibilities-status');
  const progress = document.querySelector('.inquiry-progress');
  const fields = ['name', 'email', 'service', 'message', 'consent'].map((name) =>
    form.elements.namedItem(name),
  );
  const initialImage = scene.querySelector('img');
  const initial = { src: initialImage.getAttribute('src'), alt: initialImage.alt };
  let direction = null;
  let imageRequest = 0;
  const reduced = () =>
    document.documentElement.classList.contains('motion-paused') ||
    matchMedia('(prefers-reduced-motion:reduce)').matches;

  function changeImage(choice) {
    const request = ++imageRequest;
    const image = new Image();
    image.width = 1536;
    image.height = 1024;
    image.alt = choice ? choice.dataset.alt : initial.alt;
    image.onload = () => {
      if (request !== imageRequest) return;
      const previous = [...scene.querySelectorAll('img')];
      previous.forEach((item) => item.setAttribute('aria-hidden', 'true'));
      scene.insertBefore(image, scene.querySelector('figcaption'));
      if (reduced()) previous.forEach((item) => item.remove());
      else {
        const transition = image.animate(
          [
            { opacity: 0, transform: 'scale(1.035)' },
            { opacity: 1, transform: 'scale(1)' },
          ],
          { duration: 650, easing: 'cubic-bezier(.22,1,.36,1)' },
        );
        transition.finished
          .then(() => previous.forEach((item) => item.remove()))
          .catch(() => previous.forEach((item) => item.remove()));
      }
    };
    image.src = choice ? `assets/images/${choice.dataset.image}.webp` : initial.src;
  }

  function update() {
    const selected = service.value;
    const choice = choices.find((item) => item.dataset.briefService === selected);
    choices.forEach((item) => {
      const active = item === choice;
      item.setAttribute('aria-pressed', String(active));
      item.querySelector('.possibility-check').textContent = active ? '✓' : '↗';
    });
    board.classList.toggle('has-direction', !!selected);
    if (direction !== selected) {
      if (direction !== null || selected) changeImage(choice);
      direction = selected;
      caption.textContent = choice ? choice.dataset.caption : 'Every possibility starts here.';
      number.textContent = choice ? choice.dataset.number : '00';
      status.textContent = selected
        ? `${selected} · Added to your inquiry.`
        : 'Your selection will be added to the inquiry.';
    }
    const complete = fields.filter((field) =>
      field.type === 'checkbox' ? field.checked : !!field.value.trim() && field.validity.valid,
    ).length;
    if (progress) {
      progress.querySelector('span').textContent =
        `${String(complete).padStart(2, '0')} / 05 DETAILS READY`;
      progress.querySelector('i').style.transform = `scaleX(${complete / fields.length})`;
    }
  }

  choices.forEach((choice) =>
    choice.addEventListener('click', () => {
      if (service.value === choice.dataset.briefService) return;
      service.value = choice.dataset.briefService;
      service.dispatchEvent(new Event('change', { bubbles: true }));
    }),
  );
  form.addEventListener('input', update);
  form.addEventListener('change', update);
  form.addEventListener('reset', () => setTimeout(update, 0));
  board.querySelector('.possibilities-controls').hidden = false;
  if (progress) progress.hidden = false;
  update();
})();
