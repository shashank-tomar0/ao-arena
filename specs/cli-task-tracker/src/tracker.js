// CLI task tracker — AO Arena challenge spec.
//
// A zero-dependency CLI with persistent JSON storage: add, list, done, rm.
// The spec demands honest error paths (non-numeric index → clear error, not
// a panic) and real persistence across process restarts. Every guard below
// exists so the acceptance suite can prove the code actually behaves — a
// comparison flipped or a guard removed must break the tests.
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';

// The store path is resolved per call so tests (and the mutation
// differential) can redirect storage without re-importing the module.
function FILE_PATH() {
  return process.env.TASKS_FILE || join(process.cwd(), 'tasks.json');
}

// parseStored validates raw file content: a corrupt or non-array store is
// treated as empty, never as a crash.
function parseStored(raw) {
  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    return { ok: false, data: null };
  }
  const ok = Array.isArray(data);
  return { ok, data: ok ? data : null };
}

export function loadTasks() {
  let raw = '';
  try {
    raw = readFileSync(FILE_PATH(), 'utf8');
  } catch {
    return []; // missing store = empty store
  }
  const { ok, data } = parseStored(raw);
  if (!ok) {
    return [];
  }
  // Only well-formed tasks survive; everything else is dropped silently.
  return data.filter((t) => t && typeof t.done === 'boolean');
}

export function saveTasks(tasks) {
  writeFileSync(FILE_PATH(), JSON.stringify(tasks, null, 2));
}

export function addTask(tasks, text) {
  tasks.push({ text, done: false });
  return tasks.length;
}

// parseIndex validates a 1-based CLI index against the current task count.
// A non-numeric or out-of-range index is an error, never a crash.
function parseIndex(raw, count) {
  const n = Number(raw);
  const ok = Number.isInteger(n) && n >= 1 && n <= count;
  return { ok, value: n };
}

export function markDone(tasks, index) {
  const { ok, value } = parseIndex(index, tasks.length);
  if (!ok) {
    return { error: `no task at index ${index}` };
  }
  const task = tasks[value - 1];
  task.done = true;
  return { task };
}

export function removeTask(tasks, index) {
  const { ok, value } = parseIndex(index, tasks.length);
  if (!ok) {
    return { error: `no task at index ${index}` };
  }
  const [removed] = tasks.splice(value - 1, 1);
  return { removed };
}

export function formatList(tasks) {
  if (tasks.length === 0) {
    return 'no tasks';
  }
  return tasks
    .map((t, i) => `${i + 1}. [${t.done ? 'x' : ' '}] ${t.text}`)
    .join('\n');
}

export function usage() {
  return `usage: tasks <command> [args]

commands:
  tasks add "<description>"   add a task
  tasks list                  list tasks with index and done marker
  tasks done <index>          mark a task complete
  tasks rm <index>            delete a task
`;
}

// run executes one CLI invocation. Errors go to stderr with a non-zero exit
// code; success writes to stdout. Never panics on bad input.
export function run(argv = process.argv.slice(2)) {
  const [cmd, ...rest] = argv;
  if (cmd === undefined) {
    process.stderr.write(usage());
    process.exitCode = 1;
    return;
  }

  const tasks = loadTasks();

  switch (cmd) {
    case 'add': {
      const text = rest.join(' ').trim();
      if (text === '') {
        process.stderr.write('error: add needs a description\n');
        process.exitCode = 1;
        return;
      }
      const n = addTask(tasks, text);
      saveTasks(tasks);
      process.stdout.write(`added task ${n}: ${text}\n`);
      return;
    }
    case 'list':
      process.stdout.write(formatList(tasks) + '\n');
      return;
    case 'done': {
      const r = markDone(tasks, rest[0]);
      if (r.error) {
        process.stderr.write(`error: ${r.error}\n`);
        process.exitCode = 1;
        return;
      }
      saveTasks(tasks);
      process.stdout.write(`done: ${r.task.text}\n`);
      return;
    }
    case 'rm': {
      const r = removeTask(tasks, rest[0]);
      if (r.error) {
        process.stderr.write(`error: ${r.error}\n`);
        process.exitCode = 1;
        return;
      }
      saveTasks(tasks);
      process.stdout.write(`removed: ${r.removed.text}\n`);
      return;
    }
    default:
      process.stderr.write(usage());
      process.exitCode = 1;
  }
}

// Run as a CLI only when executed directly (tests import the module).
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  run();
}
