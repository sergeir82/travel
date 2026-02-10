#!/bin/sh
set -eu

# Generate runtime public env for the browser (served from /public/env.js)
# This allows using docker-compose environment variables without rebuilding the image.
ENV_JS_PATH="${ENV_JS_PATH:-/app/public/env.js}"

mkdir -p "$(dirname "$ENV_JS_PATH")"

cat > "$ENV_JS_PATH" <<'EOF'
// This file is generated at container start.
// It provides runtime-configurable NEXT_PUBLIC_* variables for the browser.
window.__ENV = window.__ENV || {};
EOF

# Whitelist of public vars exposed to the browser
PUBLIC_VARS="NEXT_PUBLIC_YANDEX_MAPS_API_KEY"

for VAR_NAME in $PUBLIC_VARS; do
  # shellcheck disable=SC2163
  VAL="$(printenv "$VAR_NAME" 2>/dev/null || true)"
  if [ -n "$VAL" ]; then
    # JSON-escape value using node (available in the image)
    JSON_VAL="$(node -e "process.stdout.write(JSON.stringify(process.env['$VAR_NAME'] || ''))")"
    printf 'window.__ENV[%s] = %s;\n' "$(node -e "process.stdout.write(JSON.stringify('$VAR_NAME'))")" "$JSON_VAL" >> "$ENV_JS_PATH"
  fi
done

exec "$@"

