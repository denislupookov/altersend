import json
import sys

def main():
    try:
        with open('package-lock.json', 'r') as f:
            lockfile = json.load(f)
    except FileNotFoundError:
        print("Error: package-lock.json not found.", file=sys.stderr)
        sys.exit(1)

    if 'packages' not in lockfile:
        print("Error: 'packages' field not found in lockfile. Ensure it's a v3 lockfile.", file=sys.stderr)
        sys.exit(1)

    packages = lockfile['packages']
    flattened_packages = {}

    for path, data in packages.items():
        if path == "":
            flattened_packages[path] = data
            continue
        
        if path.startswith('node_modules/'):
            flattened_packages[path] = data
            continue

        if '/node_modules/' in path:
            parts = path.split('/node_modules/')
            new_path = 'node_modules/' + parts[-1]
            if new_path not in flattened_packages:
                flattened_packages[new_path] = data
            else:
                existing_version = flattened_packages[new_path].get('version', '?')
                new_version = data.get('version', '?')
                if existing_version != new_version:
                    print(
                        f"ERROR: version conflict for '{new_path}': "
                        f"{existing_version} (existing) vs {new_version} from '{path}'",
                        file=sys.stderr
                    )
                    sys.exit(1)

    lockfile['packages'] = flattened_packages

    print(json.dumps(lockfile, indent=2))

if __name__ == "__main__":
    main()
