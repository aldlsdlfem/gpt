const scenesInput = document.getElementById('scenes');
const sceneCount = document.getElementById('sceneCount');
const ratios = document.querySelectorAll('.ratio');
const analyzeBtn = document.getElementById('analyze');
const storyboardBtn = document.getElementById('storyboard');

scenesInput.addEventListener('input', () => {
  sceneCount.textContent = `${scenesInput.value}컷`;
});

ratios.forEach((btn) => {
  btn.addEventListener('click', () => {
    ratios.forEach((el) => el.classList.remove('active'));
    btn.classList.add('active');
  });
});

analyzeBtn.addEventListener('click', () => {
  storyboardBtn.disabled = false;
  storyboardBtn.style.background = '#4d4ae6';
  storyboardBtn.style.color = '#fff';
});
