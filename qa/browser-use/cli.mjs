import { spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, openSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const state = join(root, '.qa');
const venv = join(state, 'browser-use-venv');
const cli = join(venv, 'bin/browser-use');
const origin = 'http://127.0.0.1:3101';
const backend = 'http://127.0.0.1:18080';
const cdp = 'http://127.0.0.1:9334';
const action = process.argv[2];
mkdirSync(state, { recursive: true, mode: 0o700 });
const env = {
  ...process.env,
  BU_NAME: 'marketbot-customer-qa',
  BU_CDP_URL: cdp,
  BH_RECORD: '0',
  BH_TAB_MARKER: '0',
};

function run(command, args, extra = {}) {
  const result = spawnSync(command, args, { cwd: root, env, stdio: 'inherit', ...extra });
  if (result.error) throw result.error;
  if (result.status !== 0)
    throw new Error(`${command} exited with ${result.status ?? result.signal}`);
}
async function get(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(4000) });
  if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
  return response.json();
}
function requireCli() {
  if (!existsSync(cli)) throw new Error('Run npm run qa:setup first.');
}
async function requireBrowser() {
  const pidfile = join(state, 'chrome.pid');
  if (!existsSync(pidfile)) throw new Error('Run npm run qa:browser first.');
  const pid = Number(readFileSync(pidfile, 'utf8'));
  const command = readFileSync(`/proc/${pid}/cmdline`, 'utf8');
  if (!command.includes(join(state, 'chrome-profile')))
    throw new Error('The QA browser process does not match this project.');
  await get(`${cdp}/json/version`);
}

async function main() {
  if (action === 'setup') {
    if (!existsSync(venv)) run('uv', ['venv', venv]);
    run('uv', [
      'pip',
      'install',
      '--python',
      join(venv, 'bin/python'),
      '-r',
      join(root, 'qa/browser-use/requirements.txt'),
    ]);
    run(cli, ['--version']);
  } else if (action === 'site') {
    await get(`${backend}/health`).catch(() => {
      throw new Error(
        'The isolated API lab is offline. See qa/browser-use/README.md; no production fallback is configured.',
      );
    });
    run(
      process.execPath,
      ['node_modules/next/dist/bin/next', 'dev', '--hostname', '127.0.0.1', '--port', '3101'],
      {
        env: {
          ...env,
          MARKETBOT_API_URL: backend,
          MARKETBOT_APP_ORIGIN: origin,
          MARKETBOT_DEMO_MODE: 'false',
          MARKETBOT_TRUST_INGRESS: 'false',
          NEXT_BUILD_DIR: '.next-browser-qa',
        },
      },
    );
  } else if (action === 'browser') {
    let responding = false;
    try {
      await get(`${cdp}/json/version`);
      responding = true;
    } catch {}
    if (responding) {
      await requireBrowser();
      console.log('Project QA browser is already running.');
      return;
    }
    if (existsSync(join(state, 'chrome.pid'))) {
      const pid = Number(readFileSync(join(state, 'chrome.pid'), 'utf8'));
      try {
        process.kill(pid, 0);
        throw new Error(
          'QA Chrome is running but its CDP endpoint is unavailable; inspect .qa/chrome.log.',
        );
      } catch (check) {
        if (check.code !== 'ESRCH') throw check;
      }
    }
    // Never attach to a personal Chrome profile or expose the CDP port publicly.
    const chrome = process.env.QA_CHROME_BIN || 'google-chrome';
    const args = [
      '--remote-debugging-address=127.0.0.1',
      '--remote-debugging-port=9334',
      '--window-size=1280,900',
      `--user-data-dir=${join(state, 'chrome-profile')}`,
      '--no-first-run',
      '--no-default-browser-check',
      '--disable-sync',
      '--disable-background-networking',
    ];
    if (process.env.QA_BROWSER_HEADLESS !== 'false') args.push('--headless=new');
    const log = openSync(join(state, 'chrome.log'), 'a', 0o600);
    const browser = spawn(chrome, [...args, 'about:blank'], {
      cwd: root,
      env,
      detached: true,
      stdio: ['ignore', log, log],
    });
    browser.on('error', (error) => console.error(error.message));
    browser.unref();
    if (!browser.pid) throw new Error('Could not launch Chrome.');
    writeFileSync(join(state, 'chrome.pid'), String(browser.pid), { mode: 0o600 });
    for (let i = 0; i < 30; i++) {
      try {
        await requireBrowser();
        console.log('QA browser ready: isolated profile, loopback CDP, recordings disabled.');
        return;
      } catch {}
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
    throw new Error('Chrome did not become ready; inspect .qa/chrome.log.');
  } else if (['exec', 'mcp', 'doctor'].includes(action)) {
    requireCli();
    await requireBrowser();
    run(cli, action === 'mcp' ? ['--cli-mcp'] : action === 'doctor' ? ['--doctor'] : [], {
      stdio: 'inherit',
    });
  } else if (action === 'context') {
    console.log(
      JSON.stringify(
        {
          website: origin,
          api: backend,
          cdp,
          phone: '09100000001',
          plan: 'qa/browser-use/customer-flows.md',
          mode: 'functional QA through Codex; no separate LLM API key',
        },
        null,
        2,
      ),
    );
  } else if (action === 'stop') {
    const pidfile = join(state, 'chrome.pid');
    if (existsSync(pidfile)) {
      const pid = Number(readFileSync(pidfile, 'utf8'));
      try {
        if (readFileSync(`/proc/${pid}/cmdline`, 'utf8').includes(join(state, 'chrome-profile')))
          process.kill(pid, 'SIGTERM');
      } catch (error) {
        if (!['ENOENT', 'ESRCH'].includes(error.code)) throw error;
      }
    }
    console.log('QA browser stopped. Stop qa:site with Ctrl+C in its terminal.');
  } else throw new Error('Use setup, site, browser, exec, mcp, doctor, context or stop.');
}
main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
