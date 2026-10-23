# UMAR.OS

UMAR.OS is a public-facing personal website: a minimalist developer portfolio and interactive digital playground. It introduces its creator, presents three example project concepts, and gives visitors a browser-only terminal, digital garden, and idea generator.

## Run locally

Open `index.html` directly in a modern browser. No server, build step, framework, or package installation is needed. The site uses system font stacks and has no remote asset dependencies.

## Customize the content

Edit the clearly marked `SITE_CONFIG` object near the top of `script.js`:

- `creator`: the name used in the site identity copy.
- `email`: set a real email address to enable the `mailto:` link and copy button. Leave it empty to show the honest not-configured message.
- `socials`: add objects such as `{ label: 'GitHub', url: 'https://github.com/your-name' }`. Only HTTP(S) URLs are rendered.
- `projects`: edit names, descriptions, technology tags, availability labels, preview type (`os`, `bank`, or `terminal`) and URL. A blank URL displays “NO PUBLIC LINK”; no destination is invented.
- `garden`: edit the five idea tiles and their descriptions.
- `fortunes` and `ideas`: edit the messages used by the terminal and generator.

The three included projects are labeled as concepts or experiments. They do not link anywhere until you configure a URL.

## Interactive features

The page has smooth section navigation, a responsive mobile menu, persistent light/dark theme preference, an accessible garden dialog, and a visitor terminal. Terminal commands are handled by a fixed set of JavaScript branches; visitor input is displayed with `textContent` and is never evaluated or sent to a shell. `matrix` draws a small canvas animation only while enabled and stops when toggled off. The generator selects from twenty sample project prompts.

The terminal supports `help`, `about`, `projects`, `date`, `whoami`, `neofetch`, `echo <text>`, `fortune`, `clear`, `matrix`, `socials`, `contact`, and `help me`. Up/Down navigate command history. Clicking a command example runs it.

## Privacy and browser limits

The only stored visitor preference is the color theme (`umar-os-theme` in LocalStorage). No analytics, backend, visitor tracking, or contact form is included. A configured email opens the visitor’s email application; it does not submit anything to this site. The footer reports whether the page was opened as a local file, from a localhost hostname, or from another hostname. That label only describes the current URL and does not make a security or deployment claim.

The browser sandbox limits this website to client-side interactions. The terminal is a safe site toy, not a real operating-system shell. The decorative previews are HTML/CSS visual studies, not screenshots of deployed products.
