const scenesInput = document.getElementById('scenes');
const sceneCount = document.getElementById('sceneCount');
const ratios = document.querySelectorAll('.ratio');
const analyzeBtn = document.getElementById('analyze');
const storyboardBtn = document.getElementById('storyboard');
const scriptInput = document.getElementById('script');
const synopsisInput = document.getElementById('synopsis');
const styleInput = document.getElementById('style');
const summaryBtn = document.getElementById('showSummary');
const openChatGptAllBtn = document.getElementById('openChatGptAll');
const emptyState = document.getElementById('emptyState');
const workspaceContent = document.getElementById('workspaceContent');
const summaryBox = document.getElementById('summaryBox');
const cardsContainer = document.getElementById('cards');
const toast = document.getElementById('toast');

const state = {
  ratio: '16:9',
  scenes: [],
  prompts: [],
};

scenesInput.addEventListener('input', () => {
  sceneCount.textContent = `${scenesInput.value}컷`;
});

ratios.forEach((btn) => {
  btn.addEventListener('click', () => {
    ratios.forEach((el) => el.classList.remove('active'));
    btn.classList.add('active');
    state.ratio = btn.dataset.ratio;
  });
});

analyzeBtn.addEventListener('click', () => {
  const script = scriptInput.value.trim();
  if (!script) {
    showToast('대본을 먼저 입력해주세요.');
    scriptInput.focus();
    return;
  }

  state.scenes = splitIntoScenes(script, Number(scenesInput.value));
  state.prompts = state.scenes.map((scene, index) =>
    buildPrompt({
      index: index + 1,
      scene,
      style: styleInput.value,
      ratio: state.ratio,
      synopsis: synopsisInput.value.trim(),
    }),
  );

  storyboardBtn.disabled = false;
  storyboardBtn.style.background = '#4d4ae6';
  storyboardBtn.style.color = '#fff';
  openChatGptAllBtn.disabled = false;
  summaryBox.textContent = buildSummary();

  showToast('장면 분석 완료! 스토리보드를 생성해보세요.');
});

storyboardBtn.addEventListener('click', () => {
  if (!state.prompts.length) {
    showToast('먼저 "등장인물 분석 & 이미지 프롬프트 생성"을 실행해주세요.');
    return;
  }

  emptyState.classList.add('hidden');
  workspaceContent.classList.remove('hidden');
  renderCards();
});

summaryBtn.addEventListener('click', () => {
  if (workspaceContent.classList.contains('hidden')) {
    showToast('요약본을 보려면 먼저 스토리보드를 생성해주세요.');
    return;
  }
  summaryBox.scrollIntoView({ behavior: 'smooth', block: 'start' });
});

openChatGptAllBtn.addEventListener('click', async () => {
  if (!state.prompts.length) {
    showToast('먼저 프롬프트를 생성해주세요.');
    return;
  }

  const mergedPrompt = `아래 장면별 설명으로 이미지를 순서대로 생성해줘.\n\n${state.prompts
    .map((p, i) => `[장면 ${i + 1}]\n${p}`)
    .join('\n\n')}`;

  await copyToClipboard(mergedPrompt);
  openChatGpt();
  showToast('전체 프롬프트를 복사했고 ChatGPT를 열었습니다.');
});

function splitIntoScenes(script, maxScenes) {
  const byLine = script
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

  const units = byLine.length
    ? byLine
    : script
        .split(/(?<=[.!?。！？])\s+/)
        .map((s) => s.trim())
        .filter(Boolean);

  if (units.length <= maxScenes) return units;

  const chunkSize = Math.ceil(units.length / maxScenes);
  const grouped = [];
  for (let i = 0; i < units.length; i += chunkSize) {
    grouped.push(units.slice(i, i + chunkSize).join(' '));
  }
  return grouped.slice(0, maxScenes);
}

function buildPrompt({ index, scene, style, ratio, synopsis }) {
  const synopsisText = synopsis ? `시놉시스: ${synopsis}\n` : '';

  return `너는 영상 스토리보드용 이미지 생성 프롬프트 작성자야.\n${synopsisText}장면 번호: ${index}\n장면 설명: ${scene}\n스타일: ${style}\n화면비: ${ratio}\n요구사항: 인물/배경/조명/구도/감정을 명확히 쓰고, 텍스트 없는 고품질 이미지용 프롬프트를 한국어로 작성.`;
}

function buildSummary() {
  return [
    `총 장면 수: ${state.scenes.length}`,
    `스타일: ${styleInput.value}`,
    `화면비: ${state.ratio}`,
    '',
    ...state.scenes.map((s, i) => `${i + 1}. ${s}`),
  ].join('\n');
}

function renderCards() {
  cardsContainer.innerHTML = '';

  state.prompts.forEach((prompt, index) => {
    const card = document.createElement('article');
    card.className = 'card';
    card.innerHTML = `
      <h4>장면 ${index + 1}</h4>
      <p>${escapeHtml(state.scenes[index])}</p>
      <textarea readonly>${prompt}</textarea>
      <div class="btn-row">
        <button class="small-btn copy" type="button">프롬프트 복사</button>
        <button class="small-btn chat" type="button">ChatGPT에서 생성</button>
      </div>
    `;

    const copyBtn = card.querySelector('.copy');
    const chatBtn = card.querySelector('.chat');

    copyBtn.addEventListener('click', async () => {
      await copyToClipboard(prompt);
      showToast(`장면 ${index + 1} 프롬프트를 복사했습니다.`);
    });

    chatBtn.addEventListener('click', async () => {
      await copyToClipboard(prompt);
      openChatGpt();
      showToast(`장면 ${index + 1} 프롬프트를 복사하고 ChatGPT를 열었습니다.`);
    });

    cardsContainer.appendChild(card);
  });
}

function openChatGpt() {
  window.open('https://chatgpt.com/', '_blank', 'noopener,noreferrer');
}

async function copyToClipboard(text) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const temp = document.createElement('textarea');
  temp.value = text;
  document.body.appendChild(temp);
  temp.select();
  document.execCommand('copy');
  temp.remove();
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 1800);
}

function escapeHtml(text) {
  return text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
