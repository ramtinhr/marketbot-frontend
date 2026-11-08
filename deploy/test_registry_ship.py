"""Verify digest-pinned registry delivery and failure before activation."""
import os
from pathlib import Path
import subprocess
import tempfile
import unittest

SCRIPT = Path(__file__).with_name('ship.sh').resolve()


class RegistryDeliveryTests(unittest.TestCase):
    def run_ship(self, fail_pull=False, registry=True, missing_image=False):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            bindir = root / 'bin'
            bindir.mkdir()
            (root / 'deploy').mkdir()
            (root / 'deploy/ship-images.sh').write_text('echo "transfer $IMAGE" >> "$COMMAND_LOG"\n')
            scripts = {
                'docker': '''#!/bin/bash
echo "docker $*" >> "$COMMAND_LOG"
if [[ "$*" == *RepoDigests* ]]; then
 echo registry.example/project@sha256:abcd
elif [[ "$*" == *inspect* ]]; then
 echo sha256:1234
fi
''',
                'ssh': '''#!/bin/bash
echo "$*" >> "$COMMAND_LOG"
if [[ "$*" == *"docker pull"* && "$FAIL_PULL" == 1 ]]; then exit 42; fi
if [[ "$*" == *"docker image inspect"* && "$MISSING_IMAGE" == 1 ]]; then exit 1; fi
''',
                'scp': '#!/bin/bash\nif [[ "$1" == env.out ]]; then cat env.out > "$ENV_LOG"; fi\n',
            }
            for name, content in scripts.items():
                path = bindir / name
                path.write_text(content)
                path.chmod(0o755)
            log = root / 'commands'
            env = dict(os.environ, PATH=f'{bindir}:{os.environ["PATH"]}',
                       FRONTEND_DEPLOY_PATH='/opt/frontend', IMAGE='registry.example/project:latest',
                       FRONTEND_ENV='FRONTEND_PORT=3001', LOCAL_REGISTRY='registry.example' if registry else '',
                       MISSING_IMAGE='1' if missing_image else '0', ENV_LOG=str(root / 'env-copy'),
                       GITHUB_RUN_ID='1', GITHUB_RUN_ATTEMPT='1', COMMAND_LOG=str(log),
                       FAIL_PULL='1' if fail_pull else '0')
            result = subprocess.run(['bash', str(SCRIPT)], cwd=root, env=env,
                                    capture_output=True, text=True)
            if (root / 'env-copy').exists():
                self.assertIn('MARKETBOT_FRONTEND_IMAGE=marketbot-frontend-release:1234', (root / 'env-copy').read_text())
            return result, log.read_text()

    def test_pulls_immutable_digest_before_activation(self):
        result, commands = self.run_ship()
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn('docker pull \'registry.example/project@sha256:abcd\'', commands)
        self.assertLess(commands.index('docker pull'), commands.index('bash activate.sh'))
        self.assertNotIn('docker load', commands)

    def test_failed_pull_does_not_activate(self):
        result, commands = self.run_ship(fail_pull=True)
        self.assertNotEqual(result.returncode, 0)
        self.assertNotIn('bash activate.sh', commands)


    def test_archive_transfers_release_tag_instead_of_runner_id(self):
        result, commands = self.run_ship(registry=False)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn('docker tag sha256:1234 marketbot-frontend-release:1234', commands)
        self.assertIn('transfer marketbot-frontend-release:1234', commands)
        self.assertLess(commands.index("docker image inspect 'marketbot-frontend-release:1234'"), commands.index('bash activate.sh'))

    def test_missing_server_image_does_not_activate(self):
        for registry in (False, True):
            with self.subTest(registry=registry):
                result, commands = self.run_ship(registry=registry, missing_image=True)
                self.assertNotEqual(result.returncode, 0)
                self.assertNotIn('bash activate.sh', commands)
