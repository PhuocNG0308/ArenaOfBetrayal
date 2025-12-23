import fs from 'fs'
import path from 'path'
import { promisify } from 'util'
import strip from 'strip-comments'

const readFile = promisify(fs.readFile)
const writeFile = promisify(fs.writeFile)
const stat = promisify(fs.stat)
const readdir = promisify(fs.readdir)

const ROOT = path.resolve(new URL(import.meta.url).pathname, '..', '..')

const EXCLUDE_DIRS = new Set([
  'node_modules',
  'frontend/node_modules',
  'artifacts',
  'build-info',
  'cache',
  'deployments',
  'fhevmTemp',
  'frontend/.next',
  'frontend/.vercel',
  '.git',
  '.github',
  'contracts/@fhevm',
  'artifacts/@fhevm',
  'docs_context'
])

const EXT = new Set(['.ts', '.tsx', '.js', '.jsx', '.sol', '.py'])

async function walk(dir) {
  const entries = await readdir(dir)
  for (const name of entries) {
    const full = path.join(dir, name)
    const rel = path.relative(ROOT, full)
    try {
      const s = await stat(full)
      if (s.isDirectory()) {
        // check exclude
        const parts = rel.split(path.sep)
        if (parts.some(p => EXCLUDE_DIRS.has(p))) continue
        await walk(full)
      } else if (s.isFile()) {
        const ext = path.extname(name)
        if (!EXT.has(ext)) continue
        // avoid files under excluded dirs
        const parts = rel.split(path.sep)
        if (parts.some(p => EXCLUDE_DIRS.has(p))) continue
        // read file
        let src = await readFile(full, 'utf8')
        // remove comments
        try {
          let stripped = strip(src)
          if (stripped !== src) {
            await writeFile(full, stripped, 'utf8')
            console.log('Stripped comments:', rel)
          }
        } catch (e) {
          console.error('Failed to strip', rel, e.message)
        }
      }
    } catch (e) {
      console.error('stat error', full, e.message)
    }
  }
}

(async ()=>{
  console.log('Root:', ROOT)
  await walk(ROOT)
  console.log('Done')
})()
