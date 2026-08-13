// Acceptance suite for the cli-task-tracker spec.
//
// Every criterion in SPEC.md is exercised through the real CLI as a
// subprocess — add, list, done, rm, persistence across restarts, usage on
// empty input, and a clean non-numeric-index error. The negative cases
// (empty description, corrupt store, bad index) are what keep the mutation
// differential honest: flip a comparison or a guard and these tests must
// fail.
import { test, after } from 'node:test';
import assert from 'node:assert';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadTasks, saveTasks, addTask, markDone, removeTask, formatList } from '../src/tracker.js';

const exec = promisify(execFile);
const CLI = join(process.cwd(), 'src', 'tracker.js');

// Every test gets its own store file in a temp dir — tests run serially and
// never touch the repo, and subprocesses inherit the redirected path.
const dirs = [];
function newStore() {
  const dir = mkdtempSync(join(tmpdir(), 'tasks-'));
  dirs.push(dir);
  return join(dir, 'tasks.json');
}

after(() => {
  for (const d of dirs) rmSync(d, { recursive: true, force: true });
});

async function run(args, file) {
  return exec('node', [CLI, ...args], { env: { ...process.env, TASKS_FILE: file } });
}

test('add creates a task and list shows it with an index and undone marker', async () => {
  const file = newStore();
  const add = await run(['add', 'buy milk'], file);
  assert.match(add.stdout, /added task 1: buy milk/);

  const listed = await run(['list'], file);
  assert.match(listed.stdout, /^1\. \[ \] buy milk$/m);
});

test('done marks the task complete and list shows the marker', async () => {
  const file = newStore();
  await run(['add', 'write report'], file);
  const done = await run(['done', '1'], file);
  assert.match(done.stdout, /done: write report/);

  const listed = await run(['list'], file);
  assert.match(listed.stdout, /^1\. \[x\] write report$/m);
});

test('rm deletes a task and re-indexes the remainder', async () => {
  const file = newStore();
  await run(['add', 'first'], file);
  await run(['add', 'second'], file);
  const removed = await run(['rm', '1'], file);
  assert.match(removed.stdout, /removed: first/);

  const listed = await run(['list'], file);
  assert.match(listed.stdout, /^1\. \[ \] second$/m);
});

test('tasks persist across process restarts', async () => {
  const file = newStore();
  await run(['add', 'survives reboot'], file);
  // A completely fresh process reads the same store file.
  const listed = await run(['list'], file);
  assert.match(listed.stdout, /survives reboot/);
});

test('no command prints usage and exits non-zero', async () => {
  const file = newStore();
  await assert.rejects(run([], file), (err) => {
    assert.match(err.stderr, /usage: tasks <command>/);
    assert.strictEqual(err.code, 1);
    return true;
  });
});

test('non-numeric index produces a clear error, not a panic', async () => {
  const file = newStore();
  await run(['add', 'thing'], file);
  await assert.rejects(run(['done', 'abc'], file), (err) => {
    assert.match(err.stderr, /no task at index abc/);
    assert.doesNotMatch(err.stderr, /TypeError|ReferenceError/);
    assert.strictEqual(err.code, 1);
    return true;
  });
  // Same for rm.
  await assert.rejects(run(['rm', 'abc'], file), (err) => {
    assert.match(err.stderr, /no task at index abc/);
    return true;
  });
});

test('add with an empty description is rejected', async () => {
  const file = newStore();
  await assert.rejects(run(['add', ''], file), (err) => {
    assert.match(err.stderr, /add needs a description/);
    assert.strictEqual(err.code, 1);
    return true;
  });
});

test('a corrupt store loads as empty instead of crashing', async () => {
  const file = newStore();
  writeFileSync(file, '{"not":"an array"}', 'utf8');
  const listed = await run(['list'], file);
  assert.match(listed.stdout, /^no tasks$/m);
});

test('module API round-trips add → done → rm through real storage', () => {
  const file = newStore();
  process.env.TASKS_FILE = file;

  const tasks = loadTasks();
  assert.deepStrictEqual(tasks, []);
  addTask(tasks, 'module api');
  saveTasks(tasks);
  assert.strictEqual(loadTasks().length, 1);

  const r = markDone(loadTasks(), 1);
  assert.strictEqual(r.task.text, 'module api');
  assert.strictEqual(r.task.done, true);
  saveTasks([r.task]);
  assert.match(formatList(loadTasks()), /^1\. \[x\] module api$/);

  const removed = removeTask(loadTasks(), 1);
  assert.strictEqual(removed.removed.text, 'module api');
  saveTasks([]);
  assert.strictEqual(loadTasks().length, 0);
  assert.strictEqual(formatList(loadTasks()), 'no tasks');
});
