import { bundle } from '@apidevtools/json-schema-ref-parser';
import type { ParserOptions } from '@apidevtools/json-schema-ref-parser/dist/lib/options';
import type {
  JSONSchema,
  ResolverOptions,
} from '@apidevtools/json-schema-ref-parser/dist/lib/types';
import type { JSONSchema7 } from 'json-schema';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { format, resolveConfig } from 'prettier';

export function isSchemaDefinitionRef(
  x: unknown
): x is JSONSchema7 & { $ref: string } {
  return (
    typeof x === 'object' &&
    x !== null &&
    '$ref' in x &&
    typeof x.$ref === 'string' &&
    x.$ref.startsWith('#/')
  );
}

const jsonSchemaPaths = ['reception.json', 'batch.json', 'lot.json'];
const partialJsonSchemaPaths = [
  'reception-partial.json',
  'batch-partial.json',
  'lot-partial.json',
];
const tmpDir = __dirname.replace('internals', '.tmp');

// path resolving issue : https://github.com/APIDevTools/json-schema-ref-parser/issues/199
const fixedRootDirectoryResolver: ResolverOptions = {
  // order: 101,
  order: 1,
  canRead: true,
  read(file) {
    // in file.url remove duplicate 'libs/shared/schemas/internals/'
    const fileUrl = [...new Set(file.url.split('/'))].join('/');
    return readFile(fileUrl, 'utf-8');
  },
};

const globalParserOptions: ParserOptions = {
  continueOnError: true,
  dereference: {
    circular: true,
    // excludedPathMatcher: (
    //   path: string // Skip dereferencing content under any 'example' key
    // ) => path.includes('/Lot'),
  },
  resolve: {
    file: fixedRootDirectoryResolver,
  },
};

// TODO: is there a way to remove ALL duplicate $refs?

async function bundleSchemaFiles(
  schemaPaths: string[],
  libPath: string,
  options: { replaceInternalsRefs?: boolean; replaceId?: boolean } = {}
): Promise<JSONSchema[]> {
  const { replaceInternalsRefs = false, replaceId = false } = options;
  const bundledSchemas: JSONSchema[] = [];
  for (const jsonSchemaPath of schemaPaths) {
    console.info(`${jsonSchemaPath} - 🎬`);
    const jsonSchema = JSON.parse(
      await readFile(join(__dirname, jsonSchemaPath), 'utf-8')
    ) as JSONSchema7;
    // TODO: replace $defs.$ref with local in internals with those from tmpdir
    if (replaceInternalsRefs) {
      Object.keys(jsonSchema.$defs ?? []).forEach((key) => {
        const value = jsonSchema?.$defs?.[key];
        if (isSchemaDefinitionRef(value)) {
          const refPath = value.$ref.replace('internals', '.tmp');
          value.$ref = refPath;
        }
      });
    }
    const bundledSchema = await bundle(jsonSchema, globalParserOptions);
    if (replaceId) {
      const relativePath = relative(process.cwd(), libPath);
      bundledSchema['$id'] = `${relativePath}/${jsonSchemaPath}`;
    }

    const stringifiedSchema = JSON.stringify(bundledSchema, null, 2);
    const prettierConfig = (await resolveConfig(process.cwd())) ?? {};
    // decoding of some refs is made to avoid  https://github.com/APIDevTools/json-schema-ref-parser/issues/262
    const prettifiedSchema = format(stringifiedSchema.replaceAll(/%24/g, '$'), {
      ...prettierConfig,
      parser: 'json',
    });
    await writeFile(join(libPath, jsonSchemaPath), prettifiedSchema);
    bundledSchemas.push(bundledSchema);
    console.info(`${jsonSchemaPath} - ✔️`);
  }
  return bundledSchemas;
}

function bundlePartialSchemaFiles(): Promise<JSONSchema[]> {
  console.info(`Bundling partial schemas...`);
  return bundleSchemaFiles(partialJsonSchemaPaths, tmpDir);
}

function bundleRootSchemaFiles(): Promise<JSONSchema[]> {
  console.info(`Bundling root schemas...`);
  const libPath = __dirname.replace('internals', 'src/lib');
  // TODO: change refs to pick from tmpdir
  return bundleSchemaFiles(jsonSchemaPaths, libPath, {
    replaceInternalsRefs: true,
    replaceId: true,
  });
}

async function main(): Promise<void> {
  await mkdir(tmpDir, { recursive: true });
  await bundlePartialSchemaFiles();
  await bundleRootSchemaFiles();
  await rm(tmpDir, { recursive: true });
}

main()
  .then(() => {
    console.info(`Done bundling schemas.`);
    process.exit();
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
