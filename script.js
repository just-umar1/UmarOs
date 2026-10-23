'use strict';

/* Customize these entries when real project destinations or contact details are ready. */
const SITE_CONFIG = {
  creator: 'Umar',
  email: '', // Example: 'hello@example.com'
  socials: [
    // { label: 'GitHub', url: 'https://github.com/your-name' },
    // { label: 'Mastodon', url: 'https://mastodon.social/@your-name' }
  ],
  projects: [
    { number: '01', name: 'UMAR.OS', description: 'An interactive personal website and digital playground.', technologies: ['HTML', 'CSS', 'JavaScript'], url: '', availability: 'EXPERIMENT', preview: 'os' },
    { number: '02', name: 'MonoBank UI', description: 'An experimental neobank interface exploring modern, mobile-inspired design.', technologies: ['Interface study', 'CSS', 'Prototyping'], url: '', availability: 'CONCEPT', preview: 'bank' },
    { number: '03', name: 'Terminal Lab', description: 'A collection of terminal experiments, developer utilities, and small web tools.', technologies: ['JavaScript', 'CLI ideas', 'Web tools'], url: '', availability: 'IN PROGRESS', preview: 'terminal' }
  ],
  garden: [
    { title: 'A better way to build interfaces', description: 'What if the best interface got out of the way? Start with the one small decision that makes a tool feel obvious, then remove everything that distracts from it.' },
    { title: 'Small tools, big usefulness', description: 'A tiny tool used every day can matter more than a grand platform used once. Look for the repeated little friction in your own routine.' },
    { title: 'The beauty of minimal design', description: 'Minimal is not an amount of whitespace. It is the feeling that every visible thing has earned its place.' },
    { title: 'Experiments with Linux', description: 'Linux invites you to learn by looking closer. Change one small thing, understand what changed, and keep the experiment reversible.' },
    { title: 'Ideas worth exploring', description: 'Keep a list of questions, not just answers. The interesting project is often hiding inside a question you cannot stop turning over.' }
  ],
  fortunes: [
    'The bug was a feature that had not met its documentation yet.',
    'A good commit message is a postcard from your past self.',
    'The fastest code is the line you did not need to write.',
    'Somewhere, a semicolon is waiting to become important.',
    'Ship the small version. Let reality review it.',
    'A keyboard shortcut is a tiny kindness to future you.',
    'The best debugging tool is a clear question.',
    'If it works on the second try, call the first try research.'
  ],
  ideas: [
    'Build a bookmark manager for students that works entirely offline.',
    'Make a tiny color palette tool for people who design in grayscale.',
    'Create a reading timer for distracted developers with one button only.',
    'Build a local-first habit tracker that never uses a streak.',
    'Make a command-line helper for people who forget command-line flags.',
    'Create a one-screen budget planner for a weekend trip.',
    'Build a recipe notebook that turns leftovers into a shopping list.',
    'Make a focus timer that adapts to the size of the task.',
    'Create a personal changelog for small everyday improvements.',
    'Build a tiny status page for a home server with no external services.',
    'Make a keyboard shortcut trainer that works in five-minute sessions.',
    'Create a map of places worth revisiting, stored only on the device.',
    'Build a plain-text journal with a thoughtful search experience.',
    'Make an image sorter that helps people clean up a downloads folder.',
    'Create a tool that turns a messy idea into three useful next steps.',
    'Build a reading list that gently resurfaces things you saved months ago.',
    'Make a browser start page that shows one useful thing at a time.',
    'Create a tiny CSS inspector for learning how a page is put together.',
    'Build an offline flashcard tool for learning keyboard shortcuts.',
    'Make a personal link page that changes with the time of day.'
  ]
};

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const output = $('#terminal-output');
const input = $('#terminal-input');
const history = [];
let historyIndex = 0;
let matrixOn = false;
let matrixFrame = 0;
let matrixLastPaint = 0;
let matrixResizeHandler = null;
let toastTimer;
let ideaIndex = -1;

function safePreference(key, value) {
  try { if (value === undefined) return localStorage.getItem(key); localStorage.setItem(key, value); }
  catch { /* Local file and private browsing modes can restrict storage. */ }
}
function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  safePreference('umar-os-theme', theme);
  const button = $('#theme-toggle');
  const next = theme === 'dark' ? 'light' : 'dark';
  button.setAttribute('aria-label', `Switch to ${next} theme`);
  button.title = `Switch to ${next} theme`;
  $('.theme-glyph', button).textContent = theme === 'dark' ? '◐' : '◑';
}
function updateClock() {
  const now = new Date();
  $('#local-time').textContent = new Intl.DateTimeFormat(undefined, { hour: '2-digit', minute: '2-digit', hour12: false }).format(now);
}
function renderProjects() {
  const container = $('#project-grid');
  SITE_CONFIG.projects.forEach(project => {
    const article = document.createElement('article');
    article.className = 'project-card';
    const preview = createPreview(project);
    const info = document.createElement('div'); info.className = 'project-info';
    const overline = document.createElement('div'); overline.className = 'project-overline';
    const number = document.createElement('span'); number.className = 'project-number'; number.textContent = `PROJECT / ${project.number}`;
    const status = document.createElement('span'); status.className = 'project-status'; const dot = document.createElement('i'); dot.setAttribute('aria-hidden','true'); status.append(dot, document.createTextNode(project.availability));
    overline.append(number,status);
    const title = document.createElement('h3'); title.textContent = project.name;
    const description = document.createElement('p'); description.textContent = project.description;
    const tags = document.createElement('div'); tags.className = 'project-tags';
    project.technologies.forEach(tech => {const tag = document.createElement('span'); tag.textContent = tech; tags.append(tag);});
    const bottom = document.createElement('div'); bottom.className = 'project-bottom';
    if (project.url && isSafeHttpUrl(project.url)) {
      const link = document.createElement('a'); link.className = 'project-action'; link.href = project.url; link.target = '_blank'; link.rel = 'noopener noreferrer'; link.textContent = 'EXPLORE PROJECT'; const arrow = document.createElement('b'); arrow.textContent = '↗'; link.append(arrow); bottom.append(link);
    } else {
      const unavailable = document.createElement('span'); unavailable.className = 'project-action disabled'; unavailable.textContent = 'NO PUBLIC LINK'; unavailable.title = 'This experiment does not have a public project URL yet.'; bottom.append(unavailable);
    }
    const hint = document.createElement('span'); hint.className = 'project-hint'; hint.textContent = project.url ? 'EXTERNAL LINK' : 'CONCEPT / EXPERIMENT'; bottom.append(hint);
    info.append(overline,title,description,tags,bottom); article.append(preview,info); container.append(article);
  });
}
function createPreview(project) {
  const preview = document.createElement('div'); preview.className = `project-preview preview-${project.preview}`; preview.setAttribute('aria-hidden','true');
  const index = document.createElement('span'); index.className = 'preview-index'; index.textContent = `${project.number} — VISUAL STUDY`; preview.append(index);
  if (project.preview === 'os') {
    const grid = document.createElement('div'); grid.className='preview-grid'; const orbit=document.createElement('div');orbit.className='preview-orbit';
    const win=document.createElement('div');win.className='preview-window'; const head=document.createElement('div');head.className='preview-window-head';for(let i=0;i<3;i++)head.append(document.createElement('i'));
    const logo=document.createElement('div');logo.className='preview-logo';logo.append(document.createTextNode('UMAR'));const logoSuffix=document.createElement('span');logoSuffix.textContent='.OS';logo.append(logoSuffix);
    const bars=document.createElement('div');bars.className='preview-bars';for(let i=0;i<3;i++)bars.append(document.createElement('i'));win.append(head,logo,bars);preview.append(grid,orbit,win);
  } else if (project.preview === 'bank') {
    const phone=document.createElement('div');phone.className='bank-phone';const notch=document.createElement('div');notch.className='bank-notch';const greeting=document.createElement('div');greeting.className='bank-greeting';greeting.textContent='GOOD AFTERNOON';const balance=document.createElement('div');balance.className='bank-balance';balance.textContent='$2,480';const small=document.createElement('small');small.textContent='.50';balance.append(small);const chart=document.createElement('div');chart.className='bank-chart';phone.append(notch,greeting,balance,chart);for(const label of ['DAILY SPEND','SAVINGS GOAL']){const row=document.createElement('div');row.className='bank-row';row.textContent=label;phone.append(row);}const action=document.createElement('span');action.className='bank-button';action.textContent='TRANSFER';phone.append(action);preview.append(phone);
  } else {
    const ring=document.createElement('div');ring.className='terminal-ring';const lines=document.createElement('div');lines.className='terminal-lines';lines.append(document.createTextNode('visitor@lab:~$ '));const command=document.createElement('span');command.textContent='make something';lines.append(command,document.createElement('br'));lines.append(document.createTextNode('> tools for curious minds'));lines.append(document.createElement('br'));lines.append(document.createTextNode('> ideas into useful things'));lines.append(document.createElement('br'));const cursor=document.createElement('i');lines.append(document.createTextNode('$ '),cursor);preview.append(ring,lines);
  }
  return preview;
}
function isSafeHttpUrl(value) { try { const url=new URL(value); return url.protocol==='https:'||url.protocol==='http:'; } catch { return false; } }
function renderGarden() {
  const list=$('#garden-list');
  SITE_CONFIG.garden.forEach((note,index)=>{const button=document.createElement('button');button.type='button';button.className='garden-item';button.dataset.index=String(index);const label=document.createElement('span');label.textContent=note.title;button.append(label);button.addEventListener('click',()=>openGarden(index));list.append(button);});
}
function openGarden(index) {
  const note=SITE_CONFIG.garden[index]; if(!note)return;
  $('#garden-number').textContent=String(index+1).padStart(2,'0');$('#garden-title').textContent=note.title;$('#garden-description').textContent=note.description;$('#garden-dialog').showModal();
}
function renderContact() {
  const details=$('#contact-details'), socials=$('#social-list');
  if (SITE_CONFIG.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(SITE_CONFIG.email)) {
    const row=document.createElement('div');row.className='contact-email';const link=document.createElement('a');link.href=`mailto:${SITE_CONFIG.email}`;link.textContent=SITE_CONFIG.email;const copy=document.createElement('button');copy.type='button';copy.className='copy-email';copy.textContent='COPY';copy.addEventListener('click',()=>copyEmail(SITE_CONFIG.email,copy));row.append(link,copy);details.append(row);
  } else {const message=document.createElement('p');message.className='contact-unset';message.textContent='Contact details haven’t been added yet. Check back when an open channel is configured.';details.append(message);}
  const validLinks=SITE_CONFIG.socials.filter(item=>item.label&&isSafeHttpUrl(item.url));
  validLinks.forEach(item=>{const link=document.createElement('a');link.href=item.url;link.target='_blank';link.rel='noopener noreferrer';link.textContent=item.label;socials.append(link);});
  if (!validLinks.length && !SITE_CONFIG.email) {const note=document.createElement('span');note.className='sr-only';note.textContent='Social links have not been configured.';socials.append(note);}
}
async function copyEmail(email,button) {
  try { await navigator.clipboard.writeText(email); button.textContent='COPIED'; }
  catch { const temporary=document.createElement('textarea');temporary.value=email;temporary.style.position='fixed';temporary.style.opacity='0';document.body.append(temporary);temporary.select();const copied=document.execCommand('copy');temporary.remove();button.textContent=copied?'COPIED':'SELECT EMAIL'; }
  window.setTimeout(()=>button.textContent='COPY',1500);
}
function terminalLine(text,kind='response') { const line=document.createElement('p');line.className=`terminal-line ${kind}`;line.textContent=text;output.append(line);while(output.children.length>120)output.firstElementChild.remove();output.scrollTop=output.scrollHeight; }
function projectSummary() { return SITE_CONFIG.projects.map(p=>`${p.number}  ${p.name} — ${p.availability.toLowerCase()}${p.url?' · link available':' · no public link yet'}`).join('\n'); }
function commandResult(command) {
  const normalized=command.trim();const lower=normalized.toLowerCase();
  if(lower==='help')return {text:'Available commands:\n  help       Show this list\n  about      A little about this site\n  projects   Browse the work list\n  date       Your local date and time\n  whoami     Who is visiting?\n  neofetch   Website info\n  echo TEXT  Repeat text safely\n  fortune    A small developer thought\n  clear      Clear the terminal\n  matrix     Toggle the green rain\n  socials    Show configured social links\n  contact    Jump to contact\n  help me    A quick visitor guide',kind:'response'};
  if(lower==='about')return {text:`UMAR.OS is ${SITE_CONFIG.creator}’s personal corner of the internet: part developer portfolio, part digital playground, always a work in progress.`,kind:'response'};
  if(lower==='projects')return {text:projectSummary(),kind:'response'};
  if(lower==='date')return {text:new Date().toLocaleString(),kind:'response'};
  if(lower==='whoami')return {text:'You are a visitor exploring UMAR.OS. This terminal only runs small commands inside this webpage; it is not a system shell.',kind:'response'};
  if(lower==='neofetch')return {text:'  _   _ __ ___   __ _ _ __     UMAR.OS\n | | | | \'_ \\ / _` | \'__|    Personal website\n | |_| | | | | | (_| | |       HTML · CSS · JavaScript\n  \\__,_|_| |_|  \\__,_|_|       Client-side playground\n                               '+(location.hostname||'local file').replace(/[<>]/g,''),kind:'system'};
  if(lower==='fortune')return {text:SITE_CONFIG.fortunes[Math.floor(Math.random()*SITE_CONFIG.fortunes.length)],kind:'response'};
  if(lower==='clear')return {clear:true};
  if(lower==='matrix')return {matrix:true};
  if(lower==='socials') {const links=SITE_CONFIG.socials.filter(item=>item.label&&isSafeHttpUrl(item.url));return {text:links.length?links.map(item=>`${item.label}: ${item.url}`).join('\n'):'Social links have not been added yet.',kind:'response'};}
  if(lower==='contact')return {contact:true};
  if(lower==='help me')return {text:'New here?\n  1. Try "about" to meet the site.\n  2. Type "projects" to see the experiments.\n  3. Run "fortune" for a tiny dev thought.\n  4. Visit the Digital Garden or generate an idea.\n  5. Say hello in the Contact section when a channel is configured.',kind:'system'};
  if(lower==='echo')return {text:'Usage: echo <text>',kind:'error'};
  if(lower.startsWith('echo '))return {text:normalized.slice(5),kind:'response'};
  return {text:`Hmm, “${normalized}” isn’t a command I know. Try “help” to see what I can do.`,kind:'error'};
}
function executeCommand(raw) {
  const command=raw.trim();if(!command)return;
  terminalLine(`visitor@umar-os:~$ ${command}`,'command');history.push(command);historyIndex=history.length;
  const result=commandResult(command);
  if(result.clear){output.replaceChildren();return;}
  if(result.matrix){toggleMatrix();terminalLine(matrixOn?(reducedMotion()?'Static green rain displayed (reduced motion is enabled).':'Green rain is on. Type “matrix” again to stop it.'):'Green rain paused.','system');return;}
  if(result.contact){$('#contact').scrollIntoView({behavior:reducedMotion()?'auto':'smooth'});terminalLine('Taking you to the contact section.','system');return;}
  terminalLine(result.text,result.kind);
}
function reducedMotion() { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; }
document.addEventListener('visibilitychange',()=>{if(matrixOn&&!document.hidden&&!matrixFrame)startMatrix();});
function setupTerminal() {
  terminalLine('UMAR.OS playground ready. Try “help” to get started.','system');
  $('#terminal-form').addEventListener('submit',event=>{event.preventDefault();executeCommand(input.value);input.value='';});
  input.addEventListener('keydown',event=>{
    if(event.key==='ArrowUp'){event.preventDefault();if(historyIndex>0){historyIndex--;input.value=history[historyIndex];}}
    else if(event.key==='ArrowDown'){event.preventDefault();if(historyIndex<history.length-1){historyIndex++;input.value=history[historyIndex];}else{historyIndex=history.length;input.value='';}}
  });
  $$('.terminal-examples button').forEach(button=>button.addEventListener('click',()=>{const command=button.dataset.command;input.value=command;executeCommand(command);input.value='';input.focus();}));
}
function toggleMatrix() {
  matrixOn=!matrixOn;const stage=$('#matrix-stage');stage.hidden=!matrixOn;
  if(matrixOn){startMatrix();}else{cancelAnimationFrame(matrixFrame);matrixFrame=0;if(matrixResizeHandler){window.removeEventListener('resize',matrixResizeHandler);matrixResizeHandler=null;}}
}
function startMatrix() {
  if(matrixResizeHandler){window.removeEventListener('resize',matrixResizeHandler);matrixResizeHandler=null;}
  const stage=$('#matrix-stage');stage.replaceChildren();const canvas=document.createElement('canvas');stage.append(canvas);const context=canvas.getContext('2d');if(!context)return;
  const glyphs='01アイウエオカキクケコ';let columns=0,drops=[];
  function resize(){const ratio=Math.min(window.devicePixelRatio||1,1.5);canvas.width=Math.max(1,stage.clientWidth*ratio);canvas.height=Math.max(1,stage.clientHeight*ratio);context.setTransform(ratio,0,0,ratio,0,0);columns=Math.ceil(stage.clientWidth/12);drops=Array.from({length:columns},()=>Math.random()*-30);}
  function paint(timestamp){if(!matrixOn)return;if(document.hidden){matrixFrame=0;return;}if(timestamp-matrixLastPaint>100){matrixLastPaint=timestamp;context.fillStyle='rgba(5,9,5,.16)';context.fillRect(0,0,stage.clientWidth,stage.clientHeight);context.fillStyle='#a3ff70';context.font='9px monospace';drops.forEach((drop,index)=>{context.fillText(glyphs[Math.floor(Math.random()*glyphs.length)],index*12,drop*11);drops[index]=drop*11>stage.clientHeight&&Math.random()>.975?0:drop+1;});}if(!reducedMotion())matrixFrame=requestAnimationFrame(paint);}
  resize();matrixResizeHandler=resize;window.addEventListener('resize',matrixResizeHandler);matrixFrame=requestAnimationFrame(paint);
}
function generateIdea() {
  let next=Math.floor(Math.random()*SITE_CONFIG.ideas.length);if(SITE_CONFIG.ideas.length>1&&next===ideaIndex)next=(next+1)%SITE_CONFIG.ideas.length;ideaIndex=next;
  const result=$('#idea-result');result.classList.remove('generated');void result.offsetWidth;result.replaceChildren();const text=document.createElement('span');text.textContent=SITE_CONFIG.ideas[next];result.append(text);result.classList.add('generated');
}
function setupMobileNav() {
  const toggle=$('#menu-toggle'),nav=$('#mobile-nav');
  function close(){toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-label','Open navigation');nav.hidden=true;}
  toggle.addEventListener('click',()=>{const open=toggle.getAttribute('aria-expanded')!=='true';toggle.setAttribute('aria-expanded',String(open));toggle.setAttribute('aria-label',open?'Close navigation':'Open navigation');nav.hidden=!open;});
  $$('a',nav).forEach(link=>link.addEventListener('click',close));
  document.addEventListener('keydown',event=>{if(event.key==='Escape'){close();if($('#garden-dialog').open)$('#garden-dialog').close();}});
  $('#garden-dialog').addEventListener('click',event=>{if(event.target===$('#garden-dialog'))$('#garden-dialog').close();});
  $('.dialog-close').addEventListener('click',()=>$('#garden-dialog').close());
}
function setHostingStatus() {
  const hostname=location.hostname;
  const local=location.protocol==='file:'||hostname==='localhost'||hostname==='127.0.0.1'||hostname==='[::1]';
  $('#hosting-status').textContent=location.protocol==='file:'?'LOCAL FILE':local?'LOCAL HOST':`HOST · ${hostname}`;
  $('#year').textContent=new Date().getFullYear();
}
function setupAmbient() {
  const canvas=$('#starfield');const ctx=canvas.getContext('2d');if(!ctx)return;
  let width=0,height=0,dots=[];let frame=0;
  function resize(){const ratio=Math.min(window.devicePixelRatio||1,1.5);width=canvas.clientWidth;height=canvas.clientHeight;canvas.width=Math.max(1,width*ratio);canvas.height=Math.max(1,height*ratio);ctx.setTransform(ratio,0,0,ratio,0,0);const count=Math.min(45,Math.floor(width*height/18000));dots=Array.from({length:count},()=>({x:Math.random()*width,y:Math.random()*height,r:Math.random()*1.1+.3,a:Math.random()*.45+.12,phase:Math.random()*Math.PI*2}));draw(0);}
  function draw(t){ctx.clearRect(0,0,width,height);dots.forEach(dot=>{const alpha=reducedMotion()?dot.a:dot.a*(.7+.3*Math.sin(t/1500+dot.phase));ctx.fillStyle=`rgba(163,255,112,${alpha})`;ctx.fillRect(dot.x,dot.y,dot.r,dot.r);});if(!reducedMotion())frame=requestAnimationFrame(draw);}
  resize();window.addEventListener('resize',resize);if(!reducedMotion())frame=requestAnimationFrame(draw);
}
const statusMessages=['Building something new.','Exploring an idea.','Writing code.','Experimenting with the web.'];
let statusIndex=0;const statusTimer=window.setInterval(()=>{if(reducedMotion())return;const node=$('#status-message');node.classList.add('status-out');window.setTimeout(()=>{statusIndex=(statusIndex+1)%statusMessages.length;node.textContent=statusMessages[statusIndex];node.classList.remove('status-out');},180);},3600);

// Initialize the public experience; all visitor input stays in the browser.
$('#creator-name').textContent=SITE_CONFIG.creator;
applyTheme(safePreference('umar-os-theme')==='light'?'light':'dark');
$('#theme-toggle').addEventListener('click',()=>applyTheme(document.documentElement.dataset.theme==='dark'?'light':'dark'));
renderProjects();renderGarden();renderContact();setupTerminal();setupMobileNav();setupAmbient();setHostingStatus();updateClock();window.setInterval(updateClock,15000);
$('#generate-idea').addEventListener('click',generateIdea);
