#!/usr/bin/env node
// dotagents: collega la configurazione del repo a Claude Code e Codex. Windows, Linux, macOS.
//
//   node install.mjs [plan]       mostra cosa cambierebbe, non modifica nulla (default)
//   node install.mjs apply        mostra il piano e lo applica (chiede conferma se sostituisce/rimuove)
//   node install.mjs restore [d]  rimuove i link e rimette un backup (default: l'ultimo)
//
// Flag: --yes/-y, --dry-run, --verbose/-v, --plugins, --codex-only, --help/-h
// Variabili: CLAUDE_CONFIG_DIR, CODEX_HOME
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import readline from 'node:readline/promises';
import { spawnSync } from 'node:child_process';

const REPO = path.dirname(fileURLToPath(import.meta.url));
const HOME = os.homedir();
const WIN = process.platform === 'win32';
const OS_NAME = { win32: 'windows', darwin: 'macos', linux: 'linux' }[process.platform];
const CLAUDE_DIR = process.env.CLAUDE_CONFIG_DIR || path.join(HOME, '.claude');
const CODEX_DIR = process.env.CODEX_HOME || path.join(HOME, '.codex');
const LEGACY_DIR = path.join(HOME, '.agents', 'skills');
const BACKUP_ROOT = path.join(REPO, 'backup');
const C = path.join(REPO, 'claude');
const X = path.join(REPO, 'codex');

// ---------- argomenti ----------
const KNOWN_FLAGS = new Set(['--yes', '-y', '--dry-run', '--verbose', '-v', '--plugins', '--codex-only', '--help', '-h']);
const argv = process.argv.slice(2);
const unknown = argv.filter((a) => a.startsWith('-') && !KNOWN_FLAGS.has(a));
const pos = argv.filter((a) => !a.startsWith('-'));
const has = (...n) => n.some((f) => argv.includes(f));
const opts = { yes: has('--yes', '-y'), dry: has('--dry-run'), verbose: has('--verbose', '-v'), plugins: has('--plugins'), codexOnly: has('--codex-only') };
const cmd = pos[0] ?? 'plan';

// ---------- output ----------
const tty = process.stdout.isTTY && !process.env.NO_COLOR;
const paint = (code) => (s) => (tty ? `\x1b[${code}m${s}\x1b[0m` : String(s));
const green = paint(32), yellow = paint(33), red = paint(31), dim = paint(2), bold = paint(1), cyan = paint(36);
const out = (s = '') => console.log(s);
const tilde = (p) => (p.toLowerCase().startsWith(HOME.toLowerCase()) ? '~' + p.slice(HOME.length).replaceAll('\\', '/') : p);
const rel = (p) => path.relative(REPO, p).replaceAll('\\', '/');
const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;

// ---------- fs ----------
const norm = (p) => (WIN ? path.resolve(p).toLowerCase() : path.resolve(p));
const same = (a, b) => norm(a) === norm(b);
const lstat = (p) => { try { return fs.lstatSync(p); } catch { return null; } };

function linkedTo(dest, src) {
  if (!lstat(dest)) return false;
  try { if (same(fs.realpathSync(dest), fs.realpathSync(src))) return true; } catch { /* link rotto */ }
  try { // hard link (fallback Windows senza permessi per i symlink)
    const a = fs.statSync(dest, { bigint: true }), b = fs.statSync(src, { bigint: true });
    if (a.isFile() && a.ino !== 0n && a.ino === b.ino && a.dev === b.dev) return true;
  } catch { /* ignora */ }
  return false;
}

function describeExisting(p) {
  const st = lstat(p);
  if (!st) return 'niente';
  if (st.isSymbolicLink()) { try { return `link → ${tilde(fs.readlinkSync(p))}`; } catch { return 'link'; } }
  return st.isDirectory() ? 'cartella' : 'file';
}

function removeLink(p) {
  try { fs.unlinkSync(p); } catch { fs.rmdirSync(p); } // junction / symlink a cartella su Windows
}

function moveItem(from, to) {
  fs.mkdirSync(path.dirname(to), { recursive: true });
  try { fs.renameSync(from, to); }
  catch (e) {
    if (e.code !== 'EXDEV') throw e;
    fs.cpSync(from, to, { recursive: true, verbatimSymlinks: true });
    if (lstat(from).isSymbolicLink()) removeLink(from); else fs.rmSync(from, { recursive: true, force: true });
  }
}

function makeLink(src, dest) {
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  const isDir = fs.statSync(src).isDirectory();
  try { fs.symlinkSync(src, dest, isDir ? 'dir' : 'file'); return 'symlink'; }
  catch (e) {
    if (!WIN || !['EPERM', 'EACCES', 'UNKNOWN'].includes(e.code)) throw e;
    if (isDir) { fs.symlinkSync(src, dest, 'junction'); return 'junction'; }
    fs.linkSync(src, dest); return 'hardlink';
  }
}

// ---------- modello: cosa gestiamo ----------
// section: Claude | Codex | Legacy. agent: cartella di backup. rel: percorso relativo nel backup.
function buildEntries() {
  const entries = [];
  const link = (section, agentDir, src, dest) =>
    entries.push({ type: 'link', section, agent: section.toLowerCase(), src, dest, name: path.relative(agentDir, dest).replaceAll('\\', '/'), rel: path.relative(agentDir, dest) });
  const seed = (section, agentDir, src, dest) =>
    entries.push({ type: 'seed', section, agent: section.toLowerCase(), src, dest, name: path.relative(agentDir, dest).replaceAll('\\', '/'), rel: path.relative(agentDir, dest) });

  if (!opts.codexOnly) {
    link('Claude', CLAUDE_DIR, path.join(C, 'CLAUDE.md'), path.join(CLAUDE_DIR, 'CLAUDE.md'));
    link('Claude', CLAUDE_DIR, path.join(C, `settings.${OS_NAME}.json`), path.join(CLAUDE_DIR, 'settings.json'));
    for (const d of ['agents', 'hooks', 'statusline', 'themes', ...(WIN ? ['chrome'] : []), 'skills']) {
      link('Claude', CLAUDE_DIR, path.join(C, d), path.join(CLAUDE_DIR, d));
    }
    const mods = path.join(C, 'mods');
    if (fs.existsSync(mods) && fs.readdirSync(mods).length) link('Claude', CLAUDE_DIR, mods, path.join(CLAUDE_DIR, 'mods'));
  }

  // config.toml NON è un link: Codex vi scrive trust dei progetti e path locali. Si copia solo se manca.
  seed('Codex', CODEX_DIR, path.join(X, 'config.toml'), path.join(CODEX_DIR, 'config.toml'));
  link('Codex', CODEX_DIR, path.join(X, 'AGENTS.md'), path.join(CODEX_DIR, 'AGENTS.md'));
  link('Codex', CODEX_DIR, path.join(C, 'hooks', 'guard.js'), path.join(CODEX_DIR, 'hooks', 'guard.js')); // hook condiviso con Claude
  link('Codex', CODEX_DIR, path.join(X, 'rules', 'dotagents.rules'), path.join(CODEX_DIR, 'rules', 'dotagents.rules'));
  const agents = path.join(X, 'agents'); // un file per volta: ~/.codex/agents può contenere agent locali
  if (fs.existsSync(agents)) {
    for (const f of fs.readdirSync(agents).filter((n) => n.endsWith('.toml')).sort()) link('Codex', CODEX_DIR, path.join(agents, f), path.join(CODEX_DIR, 'agents', f));
  }
  link('Codex', CODEX_DIR, path.join(X, 'skills'), path.join(CODEX_DIR, 'skills'));
  return entries;
}

function evaluate(entry) {
  const item = { ...entry };
  if (!fs.existsSync(entry.src)) return { ...item, status: 'skip', note: `manca nel repo: ${rel(entry.src)}` };
  const existing = lstat(entry.dest);
  if (entry.type === 'seed') {
    return existing ? { ...item, status: 'ok', note: 'esistente, non toccato' } : { ...item, status: 'create', note: `copia di ${rel(entry.src)}` };
  }
  if (linkedTo(entry.dest, entry.src)) return { ...item, status: 'ok', note: 'già a posto' };
  if (!existing) return { ...item, status: 'create', note: `nuovo link → ${rel(entry.src)}` };
  return { ...item, status: 'replace', note: `sostituisce ${describeExisting(entry.dest)} → ${rel(entry.src)}`, existing: describeExisting(entry.dest) };
}

// Vecchi link per-skill in ~/.agents/skills (puntano al repo o a ~/.claude/skills/synced): Codex li leggerebbe come duplicati.
function legacyItems() {
  const items = [];
  const synced = path.join(CLAUDE_DIR, 'skills', 'synced');
  let names = [];
  try { names = fs.readdirSync(LEGACY_DIR); } catch { return items; }
  for (const n of names.sort()) {
    const p = path.join(LEGACY_DIR, n);
    const st = lstat(p);
    if (!st?.isSymbolicLink()) continue;
    let target;
    try { target = path.resolve(path.dirname(p), fs.readlinkSync(p)); } catch { continue; }
    const t = norm(target);
    if (t.startsWith(norm(REPO) + path.sep) || t.startsWith(norm(synced) + path.sep) || t === norm(synced)) {
      items.push({ type: 'remove', section: 'Legacy', agent: 'codex', dest: p, name: n, rel: path.join('agents-skills', n), status: 'remove', note: `vecchio link → ${tilde(target)}` });
    }
  }
  return items;
}

function buildPlan() {
  const items = buildEntries().map(evaluate);
  items.push(...legacyItems());
  return items;
}

// ---------- stampa ----------
const SYMBOL = { ok: dim('='), create: green('+'), replace: yellow('~'), remove: red('-'), skip: yellow('?') };
const SECTION_DIR = { Claude: CLAUDE_DIR, Codex: CODEX_DIR, Legacy: LEGACY_DIR };
const SECTION_TITLE = { Claude: 'Claude Code', Codex: 'Codex', Legacy: 'Vecchi link' };

function count(items) {
  const c = { ok: 0, create: 0, replace: 0, remove: 0, skip: 0 };
  for (const i of items) c[i.status]++;
  return c;
}

function summaryParts(c, labels) {
  return [
    c.ok && `${c.ok} ${labels.ok}`,
    c.create && `${c.create} ${labels.create}`,
    c.replace && `${c.replace} ${labels.replace}`,
    c.remove && `${c.remove} ${labels.remove}`,
    c.skip && `${c.skip} ${labels.skip}`,
  ].filter(Boolean).join(' · ') || 'niente';
}

const PLAN_LABELS = { ok: 'già a posto', create: 'da creare', replace: 'da sostituire', remove: 'da rimuovere', skip: 'saltati' };

function printPlan(items) {
  for (const section of ['Claude', 'Codex', 'Legacy']) {
    const sec = items.filter((i) => i.section === section);
    if (!sec.length) continue;
    out(`${bold(SECTION_TITLE[section])} ${dim(tilde(SECTION_DIR[section]))}`);
    out(`  ${summaryParts(count(sec), PLAN_LABELS)}`);
    const shown = sec.filter((i) => opts.verbose || i.status !== 'ok');
    const collapse = section === 'Legacy' && !opts.verbose && shown.length > 5;
    if (collapse) out(`  ${SYMBOL.remove} ${plural(shown.length, 'link vecchio', 'link vecchi')} da rimuovere ${dim('(--verbose per l\'elenco)')}`);
    else for (const i of shown) out(`  ${SYMBOL[i.status]} ${i.name.padEnd(24)} ${dim(i.note)}`);
    out();
  }
}

function pluginCommands() {
  const file = path.join(C, 'plugins.json');
  if (!opts.plugins || opts.codexOnly || !fs.existsSync(file)) return { cmds: [], warnings: [] };
  const p = JSON.parse(fs.readFileSync(file, 'utf8'));
  const cmds = [], warnings = [];
  for (const [name, s] of Object.entries(p.marketplaces ?? {})) {
    if (s.source === 'directory') { warnings.push(`marketplace locale ${name} (${s.path}): aggiungilo a mano`); continue; }
    cmds.push(['plugin', 'marketplace', 'add', s.repo || s.url || s.path]);
  }
  for (const [id, on] of Object.entries(p.enabledPlugins ?? {})) if (on) cmds.push(['plugin', 'install', id]);
  return { cmds, warnings };
}

function printPlugins({ cmds, warnings }) {
  if (!opts.plugins) return;
  out(bold('Plugin Claude'));
  for (const w of warnings) out(`  ${SYMBOL.skip} ${w}`);
  if (!cmds.length) out(`  ${dim('niente da eseguire')}`);
  else if (opts.verbose) for (const c of cmds) out(`  + claude ${c.join(' ')}`);
  else out(`  + ${plural(cmds.length, 'comando', 'comandi')} claude plugin ${dim('(--verbose per l\'elenco)')}`);
  out();
}

// ---------- apply ----------
function newBackup() {
  const d = new Date(), p = (n) => String(n).padStart(2, '0');
  const stamp = `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
  const dir = path.join(BACKUP_ROOT, stamp);
  const manifest = [];
  return {
    stamp, dir, used: false, manifest,
    take(item) { // sposta l'originale in backup/<data>/<agent>/<rel>
      const target = path.join(dir, item.agent, item.rel);
      moveItem(item.dest, target);
      this.used = true;
      manifest.push({ agent: item.agent, rel: item.rel, dest: item.dest });
      fs.writeFileSync(path.join(dir, 'manifest.json'), JSON.stringify(manifest, null, 2));
      return target;
    },
    undo(item) { // se il link fallisce, rimette l'originale al suo posto
      const target = path.join(dir, item.agent, item.rel);
      moveItem(target, item.dest);
      manifest.splice(manifest.findIndex((m) => m.dest === item.dest), 1);
      fs.writeFileSync(path.join(dir, 'manifest.json'), JSON.stringify(manifest, null, 2));
    },
  };
}

function applyItem(item, backup) {
  if (item.status === 'create') {
    if (item.type === 'seed') {
      fs.mkdirSync(path.dirname(item.dest), { recursive: true });
      fs.copyFileSync(item.src, item.dest);
      return 'copiato';
    }
    const kind = makeLink(item.src, item.dest);
    return kind === 'symlink' ? 'collegato' : `collegato (${kind})`;
  }
  if (item.status === 'replace') {
    backup.take(item);
    try {
      const kind = makeLink(item.src, item.dest);
      return `sostituito, originale in backup${kind === 'symlink' ? '' : ` (${kind})`}`;
    } catch (e) { backup.undo(item); throw e; }
  }
  if (item.status === 'remove') { backup.take(item); return 'rimosso, in backup'; }
  return null;
}

async function confirm(question) {
  if (!process.stdin.isTTY) { out(red('Serve conferma ma stdin non è interattivo: usa --yes.')); process.exit(1); }
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const a = (await rl.question(`${question} [y/N] `)).trim().toLowerCase();
  rl.close();
  return a === 'y' || a === 'yes' || a === 's' || a === 'si' || a === 'sì';
}

function runPlugins({ cmds }) {
  if (!cmds.length) return 0;
  if (spawnSync('claude', ['--version'], { shell: WIN, stdio: 'ignore' }).status !== 0) {
    out(yellow('claude non nel PATH: salto i plugin')); return 0;
  }
  let fails = 0;
  out(bold('Plugin Claude'));
  for (const c of cmds) {
    const r = spawnSync('claude', c, { shell: WIN, encoding: 'utf8' });
    if (r.status === 0) out(`  ${green('+')} claude ${c.join(' ')}`);
    else { fails++; out(`  ${red('!')} claude ${c.join(' ')} ${dim((r.stderr || r.stdout || '').trim().split('\n')[0])}`); }
  }
  out();
  return fails;
}

async function cmdApply() {
  const items = buildPlan();
  const plugins = pluginCommands();
  out(bold(`dotagents ${opts.dry ? 'plan' : 'apply'}`) + dim(`  repo: ${REPO}`));
  out();
  printPlan(items);
  printPlugins(plugins);

  const c = count(items);
  const changes = items.filter((i) => ['create', 'replace', 'remove'].includes(i.status));
  out(`Piano: ${summaryParts(c, PLAN_LABELS)}`);
  if (opts.dry) return 0;
  if (!changes.length && !plugins.cmds.length) { out(green('Niente da fare.')); return 0; }

  const destructive = c.replace + c.remove > 0;
  if (destructive && !opts.yes) {
    out(`Gli originali sostituiti/rimossi vanno in ${tilde(BACKUP_ROOT)}/<data>/ (ripristinabili con "restore").`);
    if (!(await confirm('Applico?'))) { out('Annullato, nessuna modifica.'); return 0; }
  }
  out();

  // Il piano sopra elenca già le voci: qui si stampano solo errori e fallback.
  const backup = newBackup();
  const done = { create: 0, replace: 0, remove: 0 };
  const fallbacks = [];
  let errors = 0;
  for (const item of changes) {
    try {
      const msg = applyItem(item, backup);
      done[item.status]++;
      const fb = msg.match(/\((junction|hardlink)\)/);
      if (fb) fallbacks.push(fb[1]);
      if (opts.verbose) out(`  ${SYMBOL[item.status]} ${item.section.padEnd(6)} ${item.name.padEnd(24)} ${dim(msg)}`);
    } catch (e) {
      errors++;
      out(`  ${red('!')} ${item.section.padEnd(6)} ${item.name.padEnd(24)} ${red(e.message)}`);
    }
  }
  errors += runPlugins(plugins);
  if (fallbacks.length) out(yellow(`Nota: symlink non permessi, usati ${plural(fallbacks.length, 'junction/hardlink', 'junction/hardlink')} (per symlink veri abilita la Modalità sviluppatore).`));

  out(`${errors ? red('Finito con errori') : green('Fatto')}: ${summaryParts({ ...done, ok: c.ok, skip: c.skip },
    { ok: 'invariati', create: 'creati', replace: 'sostituiti', remove: 'rimossi', skip: 'saltati' })}${errors ? ` · ${red(plural(errors, 'errore', 'errori'))}` : ''}`);
  if (backup.used) out(`Backup: ${tilde(backup.dir)}  ${dim(`(per tornare indietro: node install.mjs restore ${backup.stamp})`)}`);
  return errors ? 1 : 0;
}

// ---------- restore ----------
function listBackups() {
  try {
    return fs.readdirSync(BACKUP_ROOT).filter((n) => fs.existsSync(path.join(BACKUP_ROOT, n, 'manifest.json'))).sort();
  } catch { return []; }
}

async function cmdRestore() {
  const stamps = listBackups();
  if (!stamps.length) { out('Nessun backup in ' + tilde(BACKUP_ROOT)); return 0; }
  const stamp = pos[1] ?? stamps.at(-1);
  if (!stamps.includes(stamp)) { out(red(`Backup "${stamp}" non trovato. Disponibili: ${stamps.join(', ')}`)); return 1; }
  const dir = path.join(BACKUP_ROOT, stamp);
  const manifest = JSON.parse(fs.readFileSync(path.join(dir, 'manifest.json'), 'utf8'));

  const links = buildEntries().filter((e) => e.type === 'link' && fs.existsSync(e.src) && linkedTo(e.dest, e.src));
  out(bold('dotagents restore') + dim(`  backup: ${stamp}`));
  out();
  out(bold('Link da rimuovere'));
  if (!links.length) out(`  ${dim('nessuno')}`);
  for (const l of links) out(`  ${SYMBOL.remove} ${l.section.padEnd(6)} ${l.name}`);
  out();
  out(bold('Da rimettere dal backup'));
  for (const m of manifest) out(`  ${SYMBOL.create} ${m.agent.padEnd(6)} ${m.rel.replaceAll('\\', '/')} ${dim('→ ' + tilde(m.dest))}`);
  out();
  if (opts.dry) return 0;
  if (!opts.yes && !(await confirm('Procedo?'))) { out('Annullato, nessuna modifica.'); return 0; }

  let errors = 0, removed = 0, restored = 0, skipped = 0;
  for (const l of links) {
    try { removeLink(l.dest); removed++; } catch (e) { errors++; out(`  ${red('!')} ${l.name}: ${red(e.message)}`); }
  }
  for (const m of manifest) {
    const from = path.join(dir, m.agent, m.rel);
    if (!lstat(from)) continue;
    if (lstat(m.dest)) { skipped++; out(`  ${SYMBOL.skip} ${tilde(m.dest)} esiste già, lo lascio (backup intatto in ${tilde(from)})`); continue; }
    try { moveItem(from, m.dest); restored++; } catch (e) { errors++; out(`  ${red('!')} ${tilde(m.dest)}: ${red(e.message)}`); }
  }
  out(`${errors ? red('Finito con errori') : green('Fatto')}: ${removed} link rimossi · ${restored} ripristinati${skipped ? ` · ${skipped} saltati` : ''}${errors ? ` · ${red(plural(errors, 'errore', 'errori'))}` : ''}`);
  return errors ? 1 : 0;
}

// ---------- main ----------
function help() {
  out(`dotagents: collega la configurazione del repo a Claude Code e Codex

  node install.mjs [plan]          mostra cosa cambierebbe, non modifica nulla (default)
  node install.mjs apply           applica; chiede conferma se sostituisce o rimuove qualcosa
  node install.mjs restore [data]  rimuove i link e rimette il backup (default: l'ultimo)

  --yes, -y        non chiedere conferma
  --dry-run        con apply/restore: solo il piano
  --verbose, -v    elenca anche le voci già a posto
  --plugins        con apply: installa marketplace e plugin di claude/plugins.json
  --codex-only     salta la parte Claude

Backup: ${tilde(BACKUP_ROOT)}/<data>/<claude|codex>/ (in .gitignore).`);
}

if (unknown.length) { out(red(`Flag sconosciuto: ${unknown.join(' ')}`)); help(); process.exit(2); }
if (has('--help', '-h') || cmd === 'help') { help(); process.exit(0); }

try {
  if (cmd === 'plan') {
    opts.dry = true;
    const items = buildPlan();
    out(bold('dotagents plan') + dim(`  repo: ${REPO}`));
    out();
    printPlan(items);
    printPlugins(pluginCommands());
    const c = count(items);
    out(`Piano: ${summaryParts(c, PLAN_LABELS)}`);
    if (c.create + c.replace + c.remove) out(dim('Per applicare: node install.mjs apply'));
    process.exit(0);
  } else if (cmd === 'apply') process.exit(await cmdApply());
  else if (cmd === 'restore') process.exit(await cmdRestore());
  else { out(red(`Comando sconosciuto: ${cmd}`)); help(); process.exit(2); }
} catch (e) {
  out(red(`Errore: ${e.message}`));
  process.exit(1);
}
