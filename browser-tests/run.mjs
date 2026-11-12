#!/usr/bin/env node
/**
 * Zero-dependency Chrome CDP smoke + scenario tests.
 * Uses Node built-ins only (child_process, fetch, WebSocket).
 * Runs in a visible Chrome window (not headless).
 * Requires Google Chrome installed and the app running on:
 *   API  http://localhost:8000
 *   SPA  http://localhost:5173
 */

import { spawn } from 'node:child_process'
import { setTimeout as delay } from 'node:timers/promises'

const CHROME =
  process.env.CHROME_PATH ??
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const FRONTEND = process.env.FRONTEND_URL ?? 'http://localhost:5173'
const DEBUG_PORT = Number(process.env.CDP_PORT ?? 9222)

const VIEWPORTS = [
  { name: 'desktop', width: 1280, height: 800 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'mobile', width: 375, height: 667 },
]

class CdpClient {
  /** @param {WebSocket} ws */
  constructor(ws) {
    this.ws = ws
    this.nextId = 1
    /** @type {Map<number, {resolve: Function, reject: Function}>} */
    this.pending = new Map()

    ws.addEventListener('message', (event) => {
      const message = JSON.parse(String(event.data))
      if (message.id && this.pending.has(message.id)) {
        const { resolve, reject } = this.pending.get(message.id)
        this.pending.delete(message.id)
        if (message.error) {
          reject(new Error(message.error.message ?? JSON.stringify(message.error)))
        } else {
          resolve(message.result)
        }
      }
    })
  }

  /**
   * @param {string} method
   * @param {Record<string, unknown>} [params]
   */
  send(method, params = {}) {
    const id = this.nextId++
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject })
      this.ws.send(JSON.stringify({ id, method, params }))
    })
  }

  close() {
    this.ws.close()
  }
}

async function waitForJson(url, attempts = 30) {
  for (let i = 0; i < attempts; i += 1) {
    try {
      const response = await fetch(url)
      if (response.ok) {
        return response.json()
      }
    } catch {
      // retry
    }
    await delay(200)
  }
  throw new Error(`Timed out waiting for ${url}`)
}

async function evaluate(cdp, expression) {
  const result = await cdp.send('Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue: true,
  })
  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.text ?? 'Runtime.evaluate failed')
  }
  return result.result?.value
}

async function waitFor(cdp, expression, timeoutMs = 15000) {
  const started = Date.now()
  while (Date.now() - started < timeoutMs) {
    const value = await evaluate(cdp, expression)
    if (value) {
      return value
    }
    await delay(250)
  }
  throw new Error(`Timed out waiting for: ${expression}`)
}

async function loginIfNeeded(cdp) {
  const onLogin = await evaluate(
    cdp,
    `Boolean(document.querySelector('form input#email'))`,
  )

  if (!onLogin) {
    return
  }

  await evaluate(
    cdp,
    `(function () {
      const email = document.querySelector('#email');
      const password = document.querySelector('#password');
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      setter.call(email, 'alice@acme.test');
      email.dispatchEvent(new Event('input', { bubbles: true }));
      setter.call(password, 'password');
      password.dispatchEvent(new Event('input', { bubbles: true }));
      document.querySelector('form').requestSubmit();
      return true;
    })()`,
  )

  await waitFor(
    cdp,
    `Boolean(
      document.querySelector('.brand__mark')?.textContent?.includes('Task Board')
      && document.querySelector('[data-testid="new-task"]')
      && document.querySelector('.user-avatar')
    )`,
  )
}

async function createTask(cdp, title) {
  await evaluate(cdp, `document.querySelector('[data-testid="new-task"]')?.click()`)
  await waitFor(cdp, `Boolean(document.querySelector('#task-title'))`)

  await evaluate(
    cdp,
    `(function () {
      const titleInput = document.querySelector('#task-title');
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      setter.call(titleInput, ${JSON.stringify(title)});
      titleInput.dispatchEvent(new Event('input', { bubbles: true }));
      const buttons = Array.from(document.querySelectorAll('.modal button'));
      const save = buttons.find((b) => /save task/i.test(b.textContent || ''));
      save?.click();
      return Boolean(save);
    })()`,
  )

  await waitFor(cdp, `document.body.innerText.includes(${JSON.stringify(title)})`)
}

async function runViewport(cdp, viewport) {
  console.log(`\n→ ${viewport.name} (${viewport.width}x${viewport.height})`)

  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width: viewport.width,
    height: viewport.height,
    deviceScaleFactor: 1,
    mobile: viewport.width < 768,
  })

  await cdp.send('Page.navigate', { url: FRONTEND })
  await delay(500)
  await waitFor(
    cdp,
    `Boolean(document.querySelector('h1') || document.querySelector('.brand__mark'))`,
  )

  await loginIfNeeded(cdp)

  const stamp = Date.now()
  const createTitle = `CDP create ${viewport.name} ${stamp}`
  const editTitle = `CDP edited ${viewport.name} ${stamp}`

  // Create
  await createTask(cdp, createTitle)
  console.log('  ✓ create task')

  // Open view, then edit
  await evaluate(
    cdp,
    `(function () {
      const card = Array.from(document.querySelectorAll('.kanban-card'))
        .find((node) => node.innerText.includes(${JSON.stringify(createTitle)}));
      card?.querySelector('button[aria-label="View task"]')?.click();
      return Boolean(card);
    })()`,
  )
  await waitFor(cdp, `document.body.innerText.includes('View task') && Boolean(document.querySelector('#task-title'))`)
  await evaluate(
    cdp,
    `Array.from(document.querySelectorAll('.modal button')).find((b) => /edit task/i.test(b.textContent || ''))?.click()`,
  )
  await waitFor(cdp, `document.body.innerText.includes('Edit task')`)

  await evaluate(
    cdp,
    `(function () {
      const titleInput = document.querySelector('#task-title');
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      setter.call(titleInput, ${JSON.stringify(editTitle)});
      titleInput.dispatchEvent(new Event('input', { bubbles: true }));
      const buttons = Array.from(document.querySelectorAll('.modal button'));
      const save = buttons.find((b) => /save task/i.test(b.textContent || ''));
      save?.click();
      return Boolean(save);
    })()`,
  )
  await waitFor(cdp, `document.body.innerText.includes(${JSON.stringify(editTitle)})`)
  console.log('  ✓ view + edit task')

  // Drag edited card to Done
  await evaluate(
    cdp,
    `(function () {
      const card = Array.from(document.querySelectorAll('.kanban-card'))
        .find((node) => node.innerText.includes(${JSON.stringify(editTitle)}));
      const doneColumn = document.querySelector('.kanban-column[data-status="done"]');
      if (!card || !doneColumn) return false;

      const dataTransfer = new DataTransfer();
      dataTransfer.setData('text/task-id', card.getAttribute('data-task-id'));

      card.dispatchEvent(new DragEvent('dragstart', { bubbles: true, cancelable: true, dataTransfer }));
      doneColumn.dispatchEvent(new DragEvent('dragover', { bubbles: true, cancelable: true, dataTransfer }));
      doneColumn.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer }));
      card.dispatchEvent(new DragEvent('dragend', { bubbles: true, cancelable: true, dataTransfer }));
      return true;
    })()`,
  )
  await waitFor(
    cdp,
    `(function () {
      const doneColumn = document.querySelector('.kanban-column[data-status="done"]');
      return Boolean(doneColumn?.innerText.includes(${JSON.stringify(editTitle)}));
    })()`,
  )
  console.log('  ✓ drag task to done')

  // Delete with confirm
  await evaluate(
    cdp,
    `(function () {
      const card = Array.from(document.querySelectorAll('.kanban-card'))
        .find((node) => node.innerText.includes(${JSON.stringify(editTitle)}));
      card?.querySelector('button[aria-label="Delete task"]')?.click();
      return Boolean(card);
    })()`,
  )
  await waitFor(cdp, `document.body.innerText.includes('Delete task') && document.body.innerText.includes('Keep task')`)
  await evaluate(
    cdp,
    `Array.from(document.querySelectorAll('.modal button')).find((b) => /^Delete task$/i.test((b.textContent || '').trim()))?.click()`,
  )
  await waitFor(
    cdp,
    `!document.body.innerText.includes(${JSON.stringify(editTitle)})`,
  )
  console.log('  ✓ delete task')

  // Theme toggle still present
  const hasThemeControls = await evaluate(
    cdp,
    `Boolean(document.querySelector('button[aria-label="Choose color theme"]') && document.querySelector('button[aria-label^="Switch to"]'))`,
  )
  if (!hasThemeControls) {
    throw new Error('Theme controls missing from navbar')
  }
  console.log('  ✓ theme controls visible')

  // Logout via avatar menu
  await evaluate(cdp, `document.querySelector('.user-avatar')?.click()`)
  await waitFor(cdp, `Boolean(document.querySelector('[role="menuitem"]'))`)
  await evaluate(
    cdp,
    `document.querySelector('[role="menuitem"]')?.click()`,
  )
  await waitFor(cdp, `Boolean(document.querySelector('form input#email'))`)
  console.log('  ✓ logout')
}

async function main() {
  const chrome = spawn(
    CHROME,
    [
      `--remote-debugging-port=${DEBUG_PORT}`,
      '--disable-gpu',
      '--no-first-run',
      '--no-default-browser-check',
      '--window-size=1280,900',
      '--user-data-dir=/tmp/tenant-task-board-cdp',
      'about:blank',
    ],
    { stdio: 'ignore' },
  )

  let exitCode = 0

  try {
    const targets = await waitForJson(`http://127.0.0.1:${DEBUG_PORT}/json/list`)
    const pageTarget =
      (Array.isArray(targets) ? targets : []).find(
        (target) => target.type === 'page' && target.webSocketDebuggerUrl,
      ) ?? null

    let wsUrl = pageTarget?.webSocketDebuggerUrl

    if (!wsUrl) {
      const created = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/new?about:blank`, {
        method: 'PUT',
      }).then((response) => response.json())
      wsUrl = created.webSocketDebuggerUrl
    }

    if (!wsUrl) {
      throw new Error('Chrome did not expose a page debugger WebSocket URL')
    }

    const ws = new WebSocket(wsUrl)
    await new Promise((resolve, reject) => {
      ws.addEventListener('open', resolve)
      ws.addEventListener('error', reject)
    })

    const cdp = new CdpClient(ws)
    await cdp.send('Page.enable')
    await cdp.send('Runtime.enable')

    for (const viewport of VIEWPORTS) {
      await runViewport(cdp, viewport)
    }

    cdp.close()
    console.log('\nAll viewport scenario tests passed.')
  } catch (error) {
    exitCode = 1
    console.error('\nBrowser tests failed:')
    console.error(error instanceof Error ? error.message : error)
  } finally {
    chrome.kill('SIGTERM')
  }

  process.exit(exitCode)
}

main()
