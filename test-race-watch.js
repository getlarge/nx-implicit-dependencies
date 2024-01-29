const { exec } = require('node:child_process');
const { assert } = require('node:console');
const { readFile, writeFile } = require('node:fs').promises;
const { join } = require('node:path');
const { PerformanceObserver, performance } = require('node:perf_hooks');
const { once } = require('node:stream');
const { format } = require('node:util');

const coffeeDealerAppServiceTsPath = join(
  __dirname,
  'apps',
  'coffee-dealer',
  'src',
  'app',
  'app.service.ts'
);
const port = 3010;
let counter = 0;
let isOriginalApi = true;

function runE2ETests(suite = '#1') {
  const shouldFail = !isOriginalApi;
  console.warn(
    '➡️ running E2E tests suite %s %s',
    suite,
    shouldFail ? 'should fail' : 'should pass'
  );
  const coffeeDealerE2EProcess = exec('npx nx run coffee-dealer-e2e:e2e', {
    env: { ...process.env, PORT: port },
  });

  coffeeDealerE2EProcess
    .once('spawn', () => {
      performance.mark(format('e2e-start:%s', suite));
      performance.mark(format('e2e-deps-start:%s', suite));
    })
    .once('exit', (code, signal) => {
      console.warn('🏁 test finished with code %s and signal %s', code, signal);
      performance.mark(format('e2e-end:%s', suite));
      performance.measure(
        format('e2e-run:%s', suite),
        format('e2e-start:%s', suite),
        format('e2e-end:%s', suite)
      );
      assert(
        shouldFail ? code !== 0 : code === 0,
        `e2e tests ${suite} should ${shouldFail ? 'fail' : 'pass'}`
      );
    });

  coffeeDealerE2EProcess.stdout.setEncoding('utf8').on('data', (data) => {
    // uncomment to see the output of the e2e tests task
    // console.log(data.trim());
    if (data.includes('Setting up')) {
      performance.mark(format('e2e-deps-end:%s', suite));
      performance.measure(
        format('e2e dependencies tasks:%s', suite),
        format('e2e-deps-start:%s', suite),
        format('e2e-deps-end:%s', suite)
      );
    }
  });
  coffeeDealerE2EProcess.stderr.pipe(process.stderr);
}

async function updateAppService() {
  const data = await readFile(coffeeDealerAppServiceTsPath, 'utf8');
  /**
   * Hello API is the value that should be returned by the API and what the e2e tests expect
   */
  const index = data.search('Hello API');
  let updatedData = '';
  if (index > 0) {
    // in that case e2e tests will fail
    updatedData = data.replaceAll('Hello API', 'Hello World!');
    isOriginalApi = false;
  } else {
    // in that case e2e tests will pass
    updatedData = data.replaceAll('Hello World!', 'Hello API');
    isOriginalApi = true;
  }

  console.warn(
    '🎬 updating API to %s version',
    isOriginalApi ? 'original' : 'new'
  );
  /**
   * You can try running the e2e tests here, before or after the write operation is started or after the file is written
   * the outcome should be the same:
   * - e2e tests will fail when the API is updated and the cache is NOT used - could be improved by using the cache for the build task
   * - e2e tests will pass when the API is restored, the cache is used for both the cofee-dealer:build and cofee-dealer-e2e:e2e tasks
   * An exception might occur occasionally when the e2e tests are running before the app listens on the port 3000
   *
   **/
  runE2ETests('#1');

  /**
   * should trigger build and reload of cofee-dealer app
   **/
  writeFile(coffeeDealerAppServiceTsPath, updatedData).then(() => {
    counter++;
    console.warn('➡️ updated API #%d', counter);
    runE2ETests('#3');
  });

  runE2ETests('#2');
}

/**
 * This script run an application (HTTP API), which is hot reloading after a file change - npx nx run coffee-dealer:serve -
 * and, in parallel, pseudo-randomly trigger e2e tests against this application - npx nx run coffee-dealer-e2e:e2e
 * Both tasks should read to and write from the same cache.
 * The goal is to demonstrate that it is possible to ensure that the e2e tests are always running against the
 * latest version of the application.
 **/

function main() {
  const obs = new PerformanceObserver((items) => {
    console.log(
      'task %s duration : %d ms',
      items.getEntries()[0].name,
      items.getEntries()[0].duration
    );
    performance.clearMarks(items.getEntries()[0].name);
  });
  obs.observe({ type: 'measure' });

  const coffeeDealerServerProcess = exec(
    'npx nx run coffee-dealer:serve --inspect=false',
    {
      env: {
        ...process.env,
        PORT: port,
      },
    }
  );
  // uncomment to see the output of the server
  // coffeeDealerServerProcess.stdout.pipe(process.stdout);
  coffeeDealerServerProcess.stderr.pipe(process.stderr);
  once(coffeeDealerServerProcess, 'exit').then(([code, signal]) =>
    console.log('coffeeDealerServerProcess exit', code, signal)
  );

  /**
   * update API every 3-7 seconds
   */
  setInterval(() => {
    updateAppService();
  }, (Math.floor(Math.random() * 4) + 3) * 1000);
}

main();
