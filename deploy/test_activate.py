"""Exercise release activation and rollback without Docker or SSH."""
import os
from pathlib import Path
import subprocess
import tempfile
import unittest

SCRIPT = Path(__file__).with_name('activate.sh').resolve()


class ActivationTests(unittest.TestCase):
    def activate(self, *, fail=False, previous=False):
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            release = root / 'releases' / 'new'
            release.mkdir(parents=True)
            (release / 'docker-compose.yml').touch()
            old = root / 'releases' / 'old'
            if previous:
                old.mkdir()
                (old / 'docker-compose.yml').touch()
                (root / 'current').symlink_to(old)
            binary = root / 'bin'
            binary.mkdir()
            docker = binary / 'docker'
            docker.write_text('''#!/usr/bin/env bash
printf '%s:%s\\n' "$PWD" "$*" >> "$TEST_LOG"
if [[ "$*" == *"ps -a -q"* ]]; then printf 'test-container\\n'; fi
if [[ "$*" == *"up -d"* && "$PWD" == "$FAIL_RELEASE" ]]; then exit 1; fi
''')
            docker.chmod(0o755)
            log = root / 'commands'
            result = subprocess.run(['bash', str(SCRIPT)], cwd=release, env={
                **os.environ,
                'PATH': f'{binary}:{os.environ["PATH"]}',
                'TEST_LOG': str(log),
                'FAIL_RELEASE': str(release) if fail else '',
            }, capture_output=True, text=True)
            commands = log.read_text()
            if not fail:
                self.assertEqual(result.returncode, 0, result.stderr)
                self.assertEqual((root / 'current').resolve(), release)
            else:
                self.assertNotEqual(result.returncode, 0)
                self.assertIn('collecting diagnostics before rollback', result.stderr)
                self.assertIn('inspect --format', commands)
                self.assertIn('test-container', commands)
                self.assertLess(commands.index('inspect --format'), commands.rindex(' up -d' if previous else ' down'))
                if previous:
                    self.assertEqual((root / 'current').resolve(), old)
                    self.assertIn(f'{old}:compose', commands)
                    self.assertIn('Restoring previous release', result.stdout)
                else:
                    self.assertFalse((root / 'current').exists())
                    self.assertIn(' down', commands)

    def test_success_activates_release(self):
        self.activate()

    def test_success_replaces_previous_release(self):
        self.activate(previous=True)

    def test_failure_restores_previous_release_and_stays_failed(self):
        self.activate(fail=True, previous=True)

    def test_first_failure_stops_failed_service(self):
        self.activate(fail=True)


if __name__ == '__main__':
    unittest.main()
