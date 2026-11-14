"""Read-only verification of the public UI, database health and running commit."""
import json
import sys
import time
from urllib.request import urlopen


def check(base_url, commit):
    with urlopen(base_url + "/api/health", timeout=30) as response:
        assert json.load(response)["data"]["status"] == "ok", "Database is unavailable"
    with urlopen(base_url + "/api/version", timeout=30) as response:
        assert json.load(response)["data"]["commit"] == commit, "Running commit differs"
    with urlopen(base_url + "/", timeout=30) as response:
        assert '<div id="root">' in response.read().decode(), "UI was not served"


if __name__ == "__main__":
    base_url, commit = sys.argv[1].rstrip("/"), sys.argv[2]
    for attempt in range(12):
        try:
            check(base_url, commit)
            print("Live UI, database and release commit checks passed.")
            break
        except Exception:
            if attempt == 11:
                raise
            time.sleep(5)
