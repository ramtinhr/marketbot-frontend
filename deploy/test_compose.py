"""Validate the runner's explicit dotenv file without a repository .env."""
import os
from pathlib import Path
import shutil
import subprocess
import tempfile
import unittest


@unittest.skipUnless(shutil.which('docker'), 'Docker CLI is unavailable')
class ComposeTests(unittest.TestCase):
    def test_runner_validation_without_default_env_file(self):
        source = Path(__file__).resolve().parents[1] / 'docker-compose.prod.yml'
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            shutil.copy(source, root / source.name)
            (root / 'env.out').write_text(
                'MARKETBOT_FRONTEND_IMAGE=ci\n'
                'MARKETBOT_API_URL=http://127.0.0.1:8080\n'
                'MARKETBOT_APP_ORIGIN=https://ci.example\n'
            )
            result = subprocess.run(
                ['docker', 'compose', '--env-file', 'env.out', '-f', source.name, 'config', '-q'],
                cwd=root,
                env={**os.environ, 'FRONTEND_ENV_FILE': 'env.out'},
                capture_output=True, text=True,
            )
            self.assertEqual(result.returncode, 0, result.stderr)
            self.assertFalse((root / '.env').exists())
