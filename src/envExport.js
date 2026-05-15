// envExport.js — Export env files to various formats (JSON, YAML, shell script)

/**
 * Export env object to JSON string
 * @param {Record<string,string>} env
 * @returns {string}
 */
function toJSON(env) {
  return JSON.stringify(env, null, 2);
}

/**
 * Export env object to YAML-like string (simple key: value, no deps)
 * @param {Record<string,string>} env
 * @returns {string}
 */
function toYAML(env) {
  return Object.entries(env)
    .map(([k, v]) => {
      const needsQuotes = /[:#{}\[\],&*?|<>=!%@`]/.test(v) || v.includes('\n') || v.trim() !== v;
      const val = needsQuotes ? `"${v.replace(/"/g, '\\"')}"` : v || "''";
      return `${k}: ${val}`;
    })
    .join('\n');
}

/**
 * Export env object to POSIX shell export statements
 * @param {Record<string,string>} env
 * @returns {string}
 */
function toShell(env) {
  return Object.entries(env)
    .map(([k, v]) => {
      const escaped = v.replace(/'/g, "'\\''")
      return `export ${k}='${escaped}'`;
    })
    .join('\n');
}

/**
 * Export env object to Docker --env-file compatible format (KEY=VALUE, no quotes)
 * @param {Record<string,string>} env
 * @returns {string}
 */
function toDockerEnv(env) {
  return Object.entries(env)
    .map(([k, v]) => `${k}=${v}`)
    .join('\n');
}

/**
 * Dispatch export by format name
 * @param {Record<string,string>} env
 * @param {'json'|'yaml'|'shell'|'docker'} format
 * @returns {string}
 */
function exportEnv(env, format = 'json') {
  switch (format.toLowerCase()) {
    case 'json':   return toJSON(env);
    case 'yaml':   return toYAML(env);
    case 'shell':  return toShell(env);
    case 'docker': return toDockerEnv(env);
    default: throw new Error(`Unknown export format: ${format}. Supported: json, yaml, shell, docker`);
  }
}

module.exports = { exportEnv, toJSON, toYAML, toShell, toDockerEnv };
