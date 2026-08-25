const header = document.querySelector('[data-header]');
const menuToggle = document.querySelector('[data-menu-toggle]');
const nav = document.querySelector('[data-nav]');

window.addEventListener('scroll', () => {
  header.classList.toggle('scrolled', window.scrollY > 40);
}, { passive: true });

function closeMenu() {
  nav.classList.remove('open');
  menuToggle.setAttribute('aria-expanded', 'false');
  menuToggle.setAttribute('aria-label', 'Abrir menu');
  document.body.classList.remove('menu-open');
}

menuToggle.addEventListener('click', () => {
  const open = menuToggle.getAttribute('aria-expanded') === 'true';
  menuToggle.setAttribute('aria-expanded', String(!open));
  menuToggle.setAttribute('aria-label', open ? 'Abrir menu' : 'Fechar menu');
  nav.classList.toggle('open', !open);
  document.body.classList.toggle('menu-open', !open);
});

nav.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
window.addEventListener('keydown', event => { if (event.key === 'Escape') closeMenu(); });

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -40px' });

document.querySelectorAll('.reveal').forEach(element => revealObserver.observe(element));

const projectTrack = document.querySelector('[data-project-track]');
const projectScrollButtons = document.querySelectorAll('[data-project-scroll]');
const projectLinks = document.querySelectorAll('[data-project-link]');

function createProjectClone(link) {
  const clone = link.cloneNode(true);
  clone.dataset.projectClone = link.dataset.projectLink;
  clone.removeAttribute('data-project-link');
  clone.removeAttribute('aria-current');
  clone.setAttribute('tabindex', '-1');
  return clone;
}

const leadingProjectClones = [
  createProjectClone(projectLinks[projectLinks.length - 2]),
  createProjectClone(projectLinks[projectLinks.length - 1])
];
const trailingProjectClones = [
  createProjectClone(projectLinks[0]),
  createProjectClone(projectLinks[1])
];

projectTrack.prepend(...leadingProjectClones);
projectTrack.append(...trailingProjectClones);

function updateProjectCurrent(projectId) {
  projectLinks.forEach(link => {
    const active = link.dataset.projectLink === projectId;
    if (active) link.setAttribute('aria-current', 'true');
    else link.removeAttribute('aria-current');
  });
}

function centerProjectCard(link, behavior = 'smooth') {
  link.scrollIntoView({ behavior, block: 'nearest', inline: 'center' });
}

function goToProjectAfterCarousel(link) {
  const target = document.getElementById(link.dataset.projectLink);
  const earliestNavigation = window.performance.now() + 450;
  let completed = false;

  const goToProject = () => {
    if (completed) return;
    completed = true;
    projectTrack.removeEventListener('scrollend', queueGoToProject);
    window.history.pushState(null, '', link.hash);
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const queueGoToProject = () => {
    const remainingTime = Math.max(0, earliestNavigation - window.performance.now());
    window.setTimeout(goToProject, remainingTime);
  };

  projectTrack.addEventListener('scrollend', queueGoToProject, { once: true });
  window.setTimeout(goToProject, 700);
}

const projectSlides = projectTrack.querySelectorAll('.project-jump-card');

function getClosestProjectSlide() {
  const trackCenter = projectTrack.getBoundingClientRect().left + projectTrack.clientWidth / 2;
  return Array.from(projectSlides).reduce((closestSlide, slide) => {
    const rect = slide.getBoundingClientRect();
    const distance = Math.abs(rect.left + rect.width / 2 - trackCenter);
    const closestRect = closestSlide.getBoundingClientRect();
    const closestDistance = Math.abs(closestRect.left + closestRect.width / 2 - trackCenter);
    return distance < closestDistance ? slide : closestSlide;
  }, projectSlides[0]);
}

let isLoopRepositioning = false;
let loopFallbackTimer;

function jumpToEquivalentProject(link) {
  const trackRect = projectTrack.getBoundingClientRect();
  const linkRect = link.getBoundingClientRect();
  const destination = projectTrack.scrollLeft + linkRect.left + linkRect.width / 2 - trackRect.left - trackRect.width / 2;

  isLoopRepositioning = true;
  projectTrack.style.scrollBehavior = 'auto';
  projectTrack.style.scrollSnapType = 'none';
  projectTrack.scrollLeft = destination;

  window.requestAnimationFrame(() => {
    projectTrack.style.removeProperty('scroll-behavior');
    projectTrack.style.removeProperty('scroll-snap-type');
    isLoopRepositioning = false;
  });
}

function normalizeCarouselLoop() {
  if (isLoopRepositioning) return;
  const closestSlide = getClosestProjectSlide();
  const clonedProjectId = closestSlide.dataset.projectClone;
  if (!clonedProjectId) return;

  const equivalentProject = Array.from(projectLinks).find(link => link.dataset.projectLink === clonedProjectId);
  jumpToEquivalentProject(equivalentProject);
}

projectTrack.addEventListener('scrollend', normalizeCarouselLoop);
projectTrack.addEventListener('scroll', () => {
  window.clearTimeout(loopFallbackTimer);
  loopFallbackTimer = window.setTimeout(normalizeCarouselLoop, 140);
}, { passive: true });

projectSlides.forEach(slide => {
  slide.addEventListener('click', event => {
    event.preventDefault();
    const projectId = slide.dataset.projectLink || slide.dataset.projectClone;
    const projectLink = Array.from(projectLinks).find(link => link.dataset.projectLink === projectId);
    updateProjectCurrent(projectId);
    centerProjectCard(slide);
    goToProjectAfterCarousel(projectLink);
  });
});

projectScrollButtons.forEach(button => {
  button.addEventListener('click', () => {
    const direction = Number(button.dataset.projectScroll);
    const currentSlide = getClosestProjectSlide();
    const currentIndex = Array.from(projectSlides).indexOf(currentSlide);
    const targetIndex = Math.max(0, Math.min(projectSlides.length - 1, currentIndex + direction));
    const targetSlide = projectSlides[targetIndex];
    const targetProjectId = targetSlide.dataset.projectLink || targetSlide.dataset.projectClone;
    updateProjectCurrent(targetProjectId);
    centerProjectCard(targetSlide);
  });
});

window.requestAnimationFrame(() => {
  jumpToEquivalentProject(projectLinks[0]);
});

const projectObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    updateProjectCurrent(entry.target.id);
  });
}, { rootMargin: '-30% 0px -55% 0px', threshold: 0 });

document.querySelectorAll('.case[id]').forEach(project => projectObserver.observe(project));

const heroTitle = document.querySelector('[data-hero-title]');
const heroRotator = document.querySelector('[data-hero-rotator]');
const heroLineOne = document.querySelector('[data-hero-line-one]');
const heroLineTwo = document.querySelector('[data-hero-line-two]');

const heroMessages = [
  { first: 'Sites com', second: 'presença', className: '' },
  { first: 'Chatbots', second: 'quase humanos', className: 'is-chatbot' },
  { first: 'Soluções', second: 'digitais', className: '' }
];

let heroMessageIndex = 0;

window.setInterval(() => {
  heroRotator.classList.add('is-changing');

  window.setTimeout(() => {
    heroMessageIndex = (heroMessageIndex + 1) % heroMessages.length;
    const message = heroMessages[heroMessageIndex];
    heroLineOne.textContent = message.first;
    heroLineTwo.textContent = message.second;
    heroTitle.classList.toggle('is-chatbot', message.className === 'is-chatbot');
    heroTitle.setAttribute('aria-label', `${message.first} ${message.second}.`);
    heroRotator.classList.remove('is-changing');
  }, 160);
}, 3200);

const chatBody = document.querySelector('[data-chat-body]');
const chatOptions = document.querySelector('[data-chat-options]');
const resetChat = document.querySelector('[data-reset-chat]');

const chatContent = {
  processo: {
    question: 'Como funciona o processo?',
    answer: 'Eu organizo a jornada em etapas simples, mostro onde você está e indico a próxima ação. Assim, você não precisa procurar a informação em vários lugares.'
  },
  documentos: {
    question: 'Quais documentos preciso?',
    answer: 'Posso apresentar uma lista de documentos conforme a etapa escolhida e explicar para que cada item serve. Nesta demo, as respostas são pré-configuradas e não geram custo de API.'
  },
  humano: {
    question: 'Posso falar com uma pessoa?',
    answer: 'Sim. Quando a dúvida exige análise individual, eu encaminho a conversa para o canal certo com um resumo do que já foi informado.'
  }
};

const initialChat = chatBody.innerHTML;

function addBubble(text, type) {
  const bubble = document.createElement('div');
  bubble.className = `bubble ${type}`;
  bubble.textContent = text;
  chatBody.appendChild(bubble);
  chatBody.scrollTop = chatBody.scrollHeight;
}

chatOptions.addEventListener('click', event => {
  const button = event.target.closest('[data-question]');
  if (!button || button.disabled) return;
  const item = chatContent[button.dataset.question];
  addBubble(item.question, 'user');
  chatOptions.querySelectorAll('button').forEach(option => { option.disabled = true; });

  const typing = document.createElement('div');
  typing.className = 'bubble bot typing';
  typing.setAttribute('aria-label', 'Aluísia está digitando');
  typing.innerHTML = '<i></i><i></i><i></i>';
  chatBody.appendChild(typing);
  chatBody.scrollTop = chatBody.scrollHeight;

  window.setTimeout(() => {
    typing.remove();
    addBubble(item.answer, 'bot');
    button.style.display = 'none';
    chatOptions.querySelectorAll('button').forEach(option => { option.disabled = false; });
  }, 650);
});

resetChat.addEventListener('click', () => {
  chatBody.innerHTML = initialChat;
  chatOptions.querySelectorAll('button').forEach(option => {
    option.disabled = false;
    option.style.display = '';
  });
});

const contactOpen = document.querySelector('[data-contact-open]');
const contactModal = document.querySelector('[data-contact-modal]');
const contactPanel = document.querySelector('[data-contact-panel]');
const contactClose = document.querySelector('[data-contact-close]');
let contactCloseTimer;

function getContactFocusableElements() {
  return Array.from(contactModal.querySelectorAll('a[href], button:not([disabled])'));
}

function openContactModal() {
  window.clearTimeout(contactCloseTimer);
  contactModal.hidden = false;
  document.body.classList.add('modal-open');

  window.requestAnimationFrame(() => {
    contactModal.classList.add('is-open');
    contactClose.focus();
  });
}

function closeContactModal() {
  contactModal.classList.remove('is-open');
  document.body.classList.remove('modal-open');
  contactOpen.focus();

  contactCloseTimer = window.setTimeout(() => {
    contactModal.hidden = true;
  }, 180);
}

contactOpen.addEventListener('click', openContactModal);
contactClose.addEventListener('click', closeContactModal);
contactModal.addEventListener('click', event => {
  if (event.target === contactModal) closeContactModal();
});

contactPanel.addEventListener('keydown', event => {
  if (event.key !== 'Tab') return;
  const focusable = getContactFocusableElements();
  const first = focusable[0];
  const last = focusable[focusable.length - 1];

  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
});

window.addEventListener('keydown', event => {
  if (event.key === 'Escape' && contactModal.classList.contains('is-open')) {
    closeContactModal();
  }
});

document.querySelector('[data-year]').textContent = new Date().getFullYear();
