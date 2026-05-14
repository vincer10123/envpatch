/**
 * transformStore.js — Save and load named transform pipelines to disk
 */

const fs = require('fs');
const path = require('path');
const { serializePipeline, deserializePipeline } = require('./transformPipeline');

/**
 * Resolve path for a named pipeline file
 * @param {string} dir
 * @param {string} name
 * @returns {string}
 */
function pipelinePath(dir, name) {
  return path.join(dir, `${name}.pipeline.json`);
}

/**
 * Save a named pipeline to disk
 * @param {string} dir
 * @param {string} name
 * @param {Array} steps
 */
function savePipeline(dir, name, steps) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(pipelinePath(dir, name), serializePipeline(steps), 'utf8');
}

/**
 * Load a named pipeline from disk
 * @param {string} dir
 * @param {string} name
 * @returns {Array}
 */
function loadPipeline(dir, name) {
  const file = pipelinePath(dir, name);
  if (!fs.existsSync(file)) throw new Error(`Pipeline not found: ${name}`);
  return deserializePipeline(fs.readFileSync(file, 'utf8'));
}

/**
 * List all saved pipeline names in a directory
 * @param {string} dir
 * @returns {string[]}
 */
function listPipelines(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter(f => f.endsWith('.pipeline.json'))
    .map(f => f.replace(/\.pipeline\.json$/, ''));
}

/**
 * Delete a named pipeline
 * @param {string} dir
 * @param {string} name
 */
function deletePipeline(dir, name) {
  const file = pipelinePath(dir, name);
  if (fs.existsSync(file)) fs.unlinkSync(file);
}

module.exports = { pipelinePath, savePipeline, loadPipeline, listPipelines, deletePipeline };
