"""Capture real screenshots of the web app into docs/screenshots/.

    python tool/capture_screenshots.py

The app's src/lib/firebase.ts is hard-coded to the PRODUCTION Firebase project,
so this script never lets the app talk to it:

  1. Starts the Firebase Auth + Firestore emulators (project `demo-kanban`)
     from a throw-away directory, and seeds a demo user, bank accounts and
     transactions through the emulators' REST APIs.
  2. Temporarily swaps next.config.js for one that (via webpack's
     NormalModuleReplacementPlugin) replaces src/lib/firebase.ts with a shim
     that initialises a `demo-kanban` app and connects it to the emulators.
     It also uses a separate distDir so the normal .next cache is untouched.
  3. Runs `next dev`, and Playwright aborts every request to Google/Firebase
     production hosts as a second safety net.
  4. Restores next.config.js / tsconfig.json byte-for-byte, deletes the shim
     and the capture build dir, and stops every process it started.

No app source files are modified. Requires: Java (Firestore emulator),
firebase-tools (global `firebase` or via npx), node_modules, Python playwright.
"""
import json
import os
import shutil
import socket
import subprocess
import sys
import tempfile
import time
import urllib.request
from datetime import datetime, timedelta, timezone

from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'docs', 'screenshots')
PROJECT = 'demo-kanban'
AUTH_PORT, FS_PORT, APP_PORT = 9099, 8080, 3100
APP = f'http://localhost:{APP_PORT}'
SHIM_DIR = os.path.join(ROOT, '.capture-shim')
DIST_DIR = '.next-capture'
EMAIL, PASSWORD = 'ananya.rao@example.com', 'demo-pass-123'

# Hosts that would mean the app is talking to real Firebase. Fonts are allowed.
BLOCKED_HOSTS = ('firestore.googleapis.com', 'identitytoolkit.googleapis.com',
                 'securetoken.googleapis.com', 'firebaseinstallations.googleapis.com',
                 'firebase.googleapis.com', 'firebaseapp.com', 'google-analytics.com',
                 'googletagmanager.com')

SHIM = f'''
import {{ getApp, getApps, initializeApp }} from "firebase/app";
import {{ getAuth, connectAuthEmulator }} from "firebase/auth";
import {{ getFirestore, connectFirestoreEmulator }} from "firebase/firestore";

// Screenshot-capture shim: demo project wired to local emulators only.
export const firebaseApp = getApps().length ? getApp() : initializeApp({{
  apiKey: "demo-key", authDomain: "{PROJECT}.firebaseapp.com",
  projectId: "{PROJECT}", appId: "1:000000000000:web:demo",
}});
export const firebaseAuth = getAuth(firebaseApp);
export const firestore = getFirestore(firebaseApp);
if (!globalThis.__kfEmulators) {{
  globalThis.__kfEmulators = true;
  connectAuthEmulator(firebaseAuth, "http://127.0.0.1:{AUTH_PORT}", {{ disableWarnings: true }});
  connectFirestoreEmulator(firestore, "127.0.0.1", {FS_PORT});
}}
'''

NEXT_CONFIG = f'''/* TEMPORARY: written by tool/capture_screenshots.py, restored automatically. */
const path = require("path");
module.exports = {{
  reactStrictMode: true,
  distDir: "{DIST_DIR}",
  webpack: (config, {{ webpack }}) => {{
    config.plugins.push(new webpack.NormalModuleReplacementPlugin(
      /[\\\\/]src[\\\\/]lib[\\\\/]firebase\\.ts$/,
      path.resolve(__dirname, ".capture-shim", "firebase.js"),
    ));
    return config;
  }},
}};
'''


# ---------------------------------------------------------------- helpers
def port_open(port):
    with socket.socket() as s:
        s.settimeout(0.5)
        return s.connect_ex(('127.0.0.1', port)) == 0


def wait_port(port, timeout, label):
    end = time.time() + timeout
    while time.time() < end:
        if port_open(port):
            return
        time.sleep(1)
    raise RuntimeError(f'{label} did not come up on :{port} within {timeout}s')


def kill_tree(proc):
    if proc and proc.poll() is None:
        if os.name == 'nt':
            subprocess.run(['taskkill', '/T', '/F', '/PID', str(proc.pid)],
                           stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        else:
            proc.kill()


def java21_env():
    """firebase-tools needs Java 21+. Prefer an existing JAVA_HOME, else Android Studio's JBR."""
    env = dict(os.environ)
    candidates = [os.environ.get('KF_JAVA_HOME', ''),
                  r'C:\Program Files\Android\Android Studio\jbr',
                  os.environ.get('JAVA_HOME', '')]
    for home in candidates:
        exe = os.path.join(home, 'bin', 'java.exe' if os.name == 'nt' else 'java')
        if home and os.path.exists(exe):
            out = subprocess.run([exe, '-version'], capture_output=True, text=True).stderr
            try:
                major = int(out.split('"')[1].split('.')[0])
            except (IndexError, ValueError):
                continue
            if major >= 21:
                env['JAVA_HOME'] = home
                env['PATH'] = os.path.join(home, 'bin') + os.pathsep + env['PATH']
                return env
    print('warning: no Java 21+ found; set KF_JAVA_HOME if the Firestore emulator refuses to start')
    return env


def http(method, url, body=None, headers=None):
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, method=method,
                                 headers={'Content-Type': 'application/json', **(headers or {})})
    with urllib.request.urlopen(req, timeout=20) as r:
        return json.loads(r.read() or b'{}')


def fs_value(v):
    if isinstance(v, bool):
        return {'booleanValue': v}
    if isinstance(v, int):
        return {'integerValue': str(v)}
    if isinstance(v, float):
        return {'doubleValue': v}
    if isinstance(v, datetime):
        return {'timestampValue': v.astimezone(timezone.utc).strftime('%Y-%m-%dT%H:%M:%S.%fZ')}
    if v is None:
        return {'nullValue': None}
    return {'stringValue': str(v)}


def fs_put(coll, doc_id, data):
    url = (f'http://127.0.0.1:{FS_PORT}/v1/projects/{PROJECT}/databases/(default)/documents/'
           f'{coll}/{doc_id}')
    http('PATCH', url, {'fields': {k: fs_value(v) for k, v in data.items()}},
         {'Authorization': 'Bearer owner'})  # emulator admin token, bypasses rules


# ---------------------------------------------------------------- demo data
ACCOUNTS = [
    # id, bank, category, account no, IFSC, card no, cvv, validity, hasCard
    ('BANK0001', 'HDFC Bank', 'salary', '50100234561024', 'HDFC0001234', '4532118790121024', '381', (2029, 7), True),
    ('BANK0002', 'State Bank of India', 'savings', '30987654327781', 'SBIN0004567', '5244310098767781', '204', (2028, 3), True),
    ('BANK0003', 'ICICI Bank', 'expenses', '001201556643', 'ICIC0000012', '4718650043214410', '657', (2027, 11), True),
    ('BANK0004', 'Axis Bank', 'fixed', '919010045672233', 'UTIB0000301', '', '', None, False),
    ('BANK0005', 'India Post Savings', 'postalSavings', '2345678901', 'IPOS0000001', '', '', None, False),
]

# account, title, amount, type, status, description, days ago, hour
TXNS = [
    ('BANK0001', 'November Salary', 185000, 'credit', 'completed', 'Acme Technologies Pvt Ltd', 19, 10),
    ('BANK0001', 'October Salary', 185000, 'credit', 'completed', 'Acme Technologies Pvt Ltd', 50, 10),
    ('BANK0001', 'Home Loan EMI', 42500, 'debit', 'completed', 'HDFC home loan · Nov', 15, 9),
    ('BANK0001', 'Transfer to SBI Savings', 60000, 'debit', 'processing', 'IMPS · monthly sweep', 1, 18),
    ('BANK0001', 'Credit Card Bill', 23840, 'debit', 'pending', 'Due 25 Nov', 0, 11),
    ('BANK0001', 'Mutual Fund SIP', 15000, 'debit', 'pending', 'Nifty 50 index fund', 0, 9),
    ('BANK0001', 'Performance Bonus', 45000, 'credit', 'processing', 'Q3 bonus payout', 2, 16),
    ('BANK0001', 'Insurance Premium', 12450, 'debit', 'failed', 'Auto-debit declined', 4, 8),
    ('BANK0001', 'Freelance Payment', 28000, 'credit', 'completed', 'UI design project', 8, 14),
    ('BANK0001', 'Electricity Bill', 3260, 'debit', 'completed', 'BESCOM · Oct usage', 6, 20),
    ('BANK0002', 'Transfer from HDFC', 60000, 'credit', 'completed', 'Monthly savings sweep', 18, 12),
    ('BANK0002', 'Opening Balance', 340000, 'credit', 'completed', 'Carried forward', 120, 10),
    ('BANK0002', 'Interest Credit', 2840, 'credit', 'completed', 'Quarterly interest', 50, 6),
    ('BANK0002', 'Gold ETF Purchase', 25000, 'debit', 'processing', 'Goldbees · 380 units', 1, 11),
    ('BANK0002', 'PPF Contribution', 12500, 'debit', 'pending', 'FY 26-27', 0, 15),
    ('BANK0003', 'Groceries', 4380, 'debit', 'completed', 'BigBasket order', 3, 19),
    ('BANK0003', 'Top-up from HDFC', 30000, 'credit', 'completed', 'Monthly spend budget', 18, 13),
    ('BANK0003', 'Flight Tickets', 11240, 'debit', 'pending', 'BLR → DEL · Dec trip', 0, 13),
    ('BANK0003', 'Netflix Subscription', 649, 'debit', 'failed', 'Card expired retry', 2, 7),
    ('BANK0003', 'Dining Out', 2150, 'debit', 'completed', 'Weekend dinner', 5, 21),
    ('BANK0003', 'Refund · Amazon', 1899, 'credit', 'processing', 'Returned headphones', 1, 17),
    ('BANK0004', 'FD Booking', 500000, 'credit', 'completed', '7.1% · 2 years', 200, 11),
    ('BANK0004', 'FD Interest Payout', 8875, 'credit', 'completed', 'Quarterly payout', 20, 9),
    ('BANK0005', 'Recurring Deposit', 5000, 'credit', 'completed', 'Monthly RD instalment', 14, 10),
    ('BANK0005', 'Opening Deposit', 150000, 'credit', 'completed', 'Post office savings', 300, 10),
    ('BANK0005', 'RD Instalment · Dec', 5000, 'credit', 'pending', 'Scheduled', 0, 8),
]


def seed():
    signup = http('POST', f'http://127.0.0.1:{AUTH_PORT}/identitytoolkit.googleapis.com/v1/'
                          f'accounts:signUp?key=demo-key',
                  {'email': EMAIL, 'password': PASSWORD, 'returnSecureToken': True})
    uid = signup['localId']
    now = datetime.now(timezone.utc)
    dob = datetime(1996, 8, 14, tzinfo=timezone.utc)
    age = now.year - dob.year - ((now.month, now.day) < (dob.month, dob.day))
    fs_put('users', uid, {
        'id': 'USER0001', 'uid': uid, 'name': 'Ananya Rao', 'email': EMAIL,
        'phone': '9876543210', 'dateOfBirth': dob, 'age': age,
        'createdAt': now - timedelta(days=320), 'updatedAt': now - timedelta(days=3),
    })

    totals = {a[0]: 0 for a in ACCOUNTS}
    for i, (acc, title, amt, typ, status, desc, days, hour) in enumerate(TXNS, start=1):
        ist = timezone(timedelta(hours=5, minutes=30))
        ts = (now.astimezone(ist) - timedelta(days=days)).replace(
            hour=hour, minute=(i * 7) % 60, second=0, microsecond=0)
        if ts > now:
            ts = now - timedelta(minutes=30 + i * 11)
        fs_put('transactions', f'TXN{i:04d}', {
            'id': f'TXN{i:04d}', 'bankAccountId': acc, 'userId': uid, 'title': title,
            'amount': amt, 'type': typ, 'status': status, 'description': desc,
            'timestamp': ts, 'createdAt': ts,
        })
        if status not in ('failed', 'cancelled'):
            totals[acc] += amt if typ == 'credit' else -amt

    # Accounts listed newest-first by createdAt, so give BANK0001 the newest.
    for n, (aid, bank, cat, accno, ifsc, card, cvv, valid, has_card) in enumerate(ACCOUNTS):
        created = now - timedelta(days=30 + n * 20)
        fs_put('bank_accounts', aid, {
            'id': aid, 'userId': uid, 'bankName': bank, 'category': cat,
            'accountNumber': accno, 'ifscCode': ifsc, 'cardNumber': card, 'cvv': cvv,
            'cardValidity': datetime(valid[0], valid[1], 1, tzinfo=timezone.utc) if valid else None,
            'hasCard': has_card, 'totalAmount': totals[aid],
            'createdAt': created, 'updatedAt': now - timedelta(days=1),
        })
    print(f'seeded user {uid}, {len(ACCOUNTS)} accounts, {len(TXNS)} transactions')


# ---------------------------------------------------------------- capture
def guard(route):
    host = route.request.url.split('/')[2] if '://' in route.request.url else ''
    if any(host == h or host.endswith('.' + h) for h in BLOCKED_HOSTS):
        print('  BLOCKED production request:', route.request.url[:100])
        return route.abort()
    return route.continue_()


def settle(page, ms=1800):
    page.wait_for_timeout(ms)  # let the fade/scale-in animations finish


def capture(browser, prefix, viewport, dsf, mobile):
    ctx = browser.new_context(viewport=viewport, device_scale_factor=dsf,
                              is_mobile=mobile, has_touch=mobile,
                              timezone_id='Asia/Kolkata', locale='en-IN')
    ctx.route('**/*', guard)
    page = ctx.new_page()
    page.set_default_timeout(90000)

    def snap(name):
        path = os.path.join(OUT, f'{prefix}-{name}.png')
        page.screenshot(path=path)
        print('saved', path)

    page.goto(f'{APP}/login')
    page.wait_for_selector('input[type=email]')
    page.wait_for_timeout(1500)
    page.fill('input[type=email]', EMAIL)
    page.fill('input[autocomplete=current-password]', PASSWORD)
    page.locator('input[type=email]').blur()
    page.wait_for_timeout(500)
    snap('login')

    page.click('button[type=submit]')
    page.wait_for_url('**/home')
    page.wait_for_selector('text=Category Breakdown')
    page.wait_for_selector('text=Add Account')
    settle(page, 2500)
    snap('dashboard')

    page.goto(f'{APP}/accounts')
    page.wait_for_selector('text=HDFC Bank')
    settle(page)
    snap('accounts')

    page.goto(f'{APP}/accounts/BANK0001')
    page.wait_for_selector('text=Transaction Board')
    page.wait_for_selector('text=Home Loan EMI')
    settle(page)
    snap('account-board')
    if mobile:
        page.locator('text=Transaction Board').scroll_into_view_if_needed()
        page.evaluate("window.scrollBy(0, document.evaluate(\"//h2[text()='Transaction Board']\","
                      " document, null, 9, null).singleNodeValue.getBoundingClientRect().top - 70)")
        page.wait_for_timeout(800)
        snap('account-board-columns')

    page.goto(f'{APP}/kanban')
    page.wait_for_selector('text=Bank Kanban Board')
    page.wait_for_selector('text=FD Booking')
    settle(page)
    snap('kanban')

    page.goto(f'{APP}/profile')
    page.wait_for_selector('text=Ananya Rao')
    settle(page)
    snap('profile')
    ctx.close()


def launch_chromium(p):
    try:
        return p.chromium.launch()
    except Exception:
        import glob
        exe = sorted(glob.glob(os.path.join(os.environ.get('LOCALAPPDATA', ''), 'ms-playwright',
                                            'chromium-*', 'chrome-win*', 'chrome.exe')))[-1]
        return p.chromium.launch(executable_path=exe)


def main():
    for port in (AUTH_PORT, FS_PORT, APP_PORT):
        if port_open(port):
            sys.exit(f'port {port} is already in use; stop whatever is running there first')
    os.makedirs(OUT, exist_ok=True)

    cfg_path = os.path.join(ROOT, 'next.config.js')
    backups = {}
    for name in ('next.config.js', 'tsconfig.json', 'next-env.d.ts'):
        path = os.path.join(ROOT, name)
        if os.path.exists(path):
            with open(path, 'rb') as f:
                backups[path] = f.read()

    emu_dir = tempfile.mkdtemp(prefix='kf-emulators-')
    with open(os.path.join(emu_dir, 'firebase.json'), 'w') as f:
        json.dump({'emulators': {'auth': {'port': AUTH_PORT}, 'firestore': {'port': FS_PORT},
                                 'ui': {'enabled': False}}}, f)
    fb = shutil.which('firebase')
    fb_cmd = f'"{fb}"' if fb else 'npx --yes firebase-tools'
    emu = app = None
    logs = []
    try:
        emu_log = open(os.path.join(emu_dir, 'emulators.log'), 'w')
        logs.append(emu_log)
        emu = subprocess.Popen(f'{fb_cmd} emulators:start --only auth,firestore --project {PROJECT}',
                               cwd=emu_dir, shell=True, stdout=emu_log, stderr=subprocess.STDOUT,
                               stdin=subprocess.DEVNULL, env=java21_env())
        for _ in range(120):
            if emu.poll() is not None:
                emu_log.flush()
                with open(emu_log.name) as f:
                    raise RuntimeError('emulators exited early:\n' + f.read()[-2000:])
            if port_open(AUTH_PORT) and port_open(FS_PORT):
                break
            time.sleep(1)
        wait_port(AUTH_PORT, 5, 'Auth emulator')
        wait_port(FS_PORT, 120, 'Firestore emulator')
        time.sleep(3)
        seed()

        os.makedirs(SHIM_DIR, exist_ok=True)
        with open(os.path.join(SHIM_DIR, 'firebase.js'), 'w', encoding='utf-8') as f:
            f.write(SHIM)
        with open(cfg_path, 'w', encoding='utf-8') as f:
            f.write(NEXT_CONFIG)

        app_log = open(os.path.join(emu_dir, 'next.log'), 'w')
        logs.append(app_log)
        app = subprocess.Popen(['node', os.path.join(ROOT, 'node_modules', 'next', 'dist', 'bin', 'next'),
                                'dev', '-p', str(APP_PORT)], cwd=ROOT,
                               stdout=app_log, stderr=subprocess.STDOUT,
                               env={**os.environ, 'NEXT_TELEMETRY_DISABLED': '1'})
        wait_port(APP_PORT, 120, 'next dev')
        # Warm up compilation of every route before taking screenshots.
        for route in ('/login', '/home', '/accounts', '/accounts/BANK0001', '/kanban', '/profile'):
            try:
                urllib.request.urlopen(APP + route, timeout=180).read()
            except Exception as e:
                print('warm-up', route, e)

        with sync_playwright() as p:
            browser = launch_chromium(p)
            capture(browser, 'desktop', {'width': 1440, 'height': 900}, 2, False)
            capture(browser, 'mobile', {'width': 390, 'height': 844}, 3, True)
            browser.close()
    finally:
        kill_tree(app)
        kill_tree(emu)
        for f in logs:
            f.close()
        for path, data in backups.items():
            with open(path, 'wb') as f:
                f.write(data)
        shutil.rmtree(SHIM_DIR, ignore_errors=True)
        time.sleep(2)
        shutil.rmtree(os.path.join(ROOT, DIST_DIR), ignore_errors=True)
        shutil.rmtree(emu_dir, ignore_errors=True)
        print('restored config files and stopped servers')


if __name__ == '__main__':
    main()
