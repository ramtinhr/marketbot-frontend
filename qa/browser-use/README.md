# Customer QA with Browser Use and your Codex subscription

This installs Browser Use **1.0.0** as a project-local CLI/MCP browser tool.
Codex supplies the reasoning through its existing ChatGPT sign-in. It does not
extract or reuse subscription OAuth tokens in Browser Use, and does not launch
the standalone Python `Agent` (which requires separate model credentials).
No OpenAI API key or Browser Use Cloud subscription is needed for this local mode.

The workflow checks ordinary customer UI behavior, not penetration testing.
Browser Use itself has no Daybreak enrollment prerequisite for this mode. OpenAI
still applies its normal account/model safeguards; no tool can guarantee a
request will never be flagged. A refusal stops the task; do not work around it.

## Setup

Linux prerequisites: Node, npm, Python 3.11+, uv, Google Chrome. Chrome must be
able to run with its normal sandbox. `QA_CHROME_BIN` can select its executable.

```sh
npm run qa:setup
```

The Python environment, Chrome profile and logs stay in ignored `.qa/`. Chrome
uses a separate profile and a DevTools endpoint bound to loopback, port 9334.
Do not expose that port. Browser action recording is disabled by default.

## Start the lab and website

The sibling `marketbot-api` isolated lab must be running. Its setup is documented
in `../marketbot-api/security/strix/lab/README.md`. For the cached offline build
used on this workstation, run from the API repository:

```sh
STRIX_LAB_OFFLINE_DEPS=1 \
STRIX_LAB_NODE_IMAGE=node:24-alpine@sha256:116b800c3754b440ee0aa3ed2f20f5bf3d99a554bfd9adeea09ea8017f6e85f5 \
npm run security:lab:up
```

From this frontend, in separate terminals:

```sh
npm run qa:site       # customer website at http://127.0.0.1:3101
npm run qa:browser    # private headless Chrome; QA_BROWSER_HEADLESS=false for a window
npm run qa:browser:doctor
```

The QA website forces `MARKETBOT_API_URL=http://127.0.0.1:18080`, demo mode off,
and a separate Next build directory. It refuses to start if the lab is offline.
It never selects a production backend. All lab funds, OTPs and addresses are
synthetic. The lab does not run the trading engine or real payment/chain services.

## Use from Codex

After setup, run `npm run qa:context`. Ask Codex:

> Use the project's Browser Use CLI and qa/browser-use/customer-flows.md to test
> the local customer website. Record expected and observed outcomes. Use only
> fixture accounts and local simulated services. Report blocked flows honestly.

Codex can pipe Python to the local CLI immediately:

```sh
node qa/browser-use/cli.mjs exec <<'PY'
new_tab("http://127.0.0.1:3101/login")
print(page_info())
PY
```

This is interactive testing by the coding agent; `qa:browser` alone does not run
an autonomous assessment. For MCP, the equivalent stdio command is:

```sh
node /absolute/path/to/marketbot-frontend/qa/browser-use/cli.mjs mcp
```

Register it in your MCP client and restart/reload that client to load the tools.
The project setup does not replace your global Codex model/authentication config.

This workstation is already registered as `marketbot-customer-qa` in Codex.
Its enabled tools are `browser_exec` and `browser_screenshot`; the cloud-login
tool is excluded. Open a new Codex chat/reload MCP tools to see the server.
For another workstation, registration is:

```sh
codex mcp add marketbot-customer-qa -- node /absolute/path/to/marketbot-frontend/qa/browser-use/cli.mjs mcp
```

In the new `[mcp_servers.marketbot-customer-qa]` entry in your Codex config,
add `enabled_tools = ["browser_exec", "browser_screenshot"]` for the same local
tool selection. Start `qa:browser` before using this server: it deliberately
refuses to attach if the project Chrome profile is not running.

## Stop

`npm run qa:stop` stops only the project Chrome. Stop the QA site with Ctrl+C.
Stop the isolated API separately with `npm run security:lab:down` in its repo.

Sources: [Browser Use CLI](https://docs.browser-use.com/open-source/browser-use-cli),
[MCP](https://docs.browser-use.com/open-source/mcp),
[standalone model credentials](https://docs.browser-use.com/open-source/models),
[OpenAI cybersecurity safeguards](https://developers.openai.com/api/docs/guides/safety-checks/cybersecurity).
