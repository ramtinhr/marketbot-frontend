"""Source delivery must pin the commit and never activate after failed preparation."""
import os
from pathlib import Path
import subprocess
import tempfile
import unittest

SCRIPT = Path(__file__).with_name('ship-source.sh').resolve()
SHA = 'a' * 40


class SourceDeliveryTests(unittest.TestCase):
    def ship(self, fail='', checkout=SHA):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            binary = root / 'bin'
            binary.mkdir()
            scripts = {
                'git': '''#!/bin/bash
if [[ "$1" == rev-parse ]]; then echo "$CHECKOUT"; else
  echo "git $*" >> "$COMMAND_LOG"
  for arg in "$@"; do
    if [[ "$arg" == --output=* ]]; then echo source > "${arg#--output=}"; fi
  done
fi
''',
                'docker': '#!/bin/bash\necho "docker $*" >> "$COMMAND_LOG"\n',
                'scp': '''#!/bin/bash
echo "scp $*" >> "$COMMAND_LOG"
for arg in "$@"; do
  if [[ "$arg" == */env.out ]]; then cat "$arg" > "$ENV_LOG"; fi
done
''',
                'ssh': '''#!/bin/bash
echo "ssh $*" >> "$COMMAND_LOG"
if [[ -n "$FAIL_STAGE" && "$*" == *"$FAIL_STAGE"* ]]; then exit 42; fi
''',
            }
            for name, content in scripts.items():
                path = binary / name
                path.write_text(content)
                path.chmod(0o755)
            log = root / 'commands'
            result = subprocess.run(['bash', str(SCRIPT)], cwd=root, env={
                **os.environ, 'PATH': f'{binary}:{os.environ["PATH"]}',
                'FRONTEND_DEPLOY_PATH': '/opt/frontend',
                'FRONTEND_ENV': 'MARKETBOT_FRONTEND_IMAGE=stale\nFRONTEND_PORT=3001',
                'GITHUB_SHA': SHA, 'GITHUB_RUN_ID': '123', 'GITHUB_RUN_ATTEMPT': '2',
                'CHECKOUT': checkout, 'COMMAND_LOG': str(log),
                'ENV_LOG': str(root / 'env-copy'), 'FAIL_STAGE': fail,
            }, capture_output=True, text=True)
            commands = log.read_text() if log.exists() else ''
            if (root / 'env-copy').exists():
                config = (root / 'env-copy').read_text()
                self.assertNotIn('=stale', config)
                self.assertIn(f'MARKETBOT_FRONTEND_IMAGE=marketbot-frontend-release:source-{SHA}-123-2', config)
            return result, commands

    def test_builds_exact_commit_before_activation_without_image_transfer(self):
        result, commands = self.ship()
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn(f'.tar.gz {SHA}', commands)
        self.assertIn('DOCKER_BUILDKIT=1 docker build', commands)
        self.assertLess(commands.index('docker build'), commands.index('bash activate.sh'))
        self.assertNotIn('docker pull', commands)
        self.assertNotIn('docker save', commands)

    def test_failed_upload_extraction_or_build_never_activates(self):
        for stage in ('mkdir -p', 'tar -xzf', 'docker build'):
            with self.subTest(stage=stage):
                result, commands = self.ship(fail=stage)
                self.assertNotEqual(result.returncode, 0)
                self.assertNotIn('bash activate.sh', commands)

    def test_wrong_checkout_never_contacts_server(self):
        result, commands = self.ship(checkout='b' * 40)
        self.assertNotEqual(result.returncode, 0)
        self.assertNotIn('ssh', commands)
