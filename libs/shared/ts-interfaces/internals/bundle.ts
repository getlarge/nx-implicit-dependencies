import type { JSONSchemaObject } from '@apidevtools/json-schema-ref-parser/dist/lib/types';
import { compile, Options } from 'json-schema-to-typescript';
import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { resolveConfig } from 'prettier';

const jsonSchemaPaths: ['batch', 'lot', 'reception'] = [
  'batch',
  'lot',
  'reception',
];

const options = async (): Promise<Partial<Options>> => ({
  format: true,
  style: (await resolveConfig(process.cwd())) ?? {},
  declareExternallyReferenced: true,
  additionalProperties: false,
  enableConstEnums: false,
  ignoreMinAndMaxItems: false,
  unknownAny: false,
  unreachableDefinitions: false,
  strictIndexSignatures: false,
});

export const isJsonSchemaObject = (
  object: unknown
): object is JSONSchemaObject =>
  typeof object === 'object' && object !== null && !Array.isArray(object);

// remove duplicate $refs due to different descriptions
function cleanSchema(schema: object | string): JSONSchemaObject {
  const stringifiedSchema =
    typeof schema === 'string' ? schema : JSON.stringify(schema);
  return JSON.parse(stringifiedSchema, (key, value) => {
    if (isJsonSchemaObject(value)) {
      // $refs with a description result in a duplicate interface being made
      // in an attempt to preserve the description as a JSDoc
      if ('$ref' in value && 'description' in value) {
        delete value['description'];
      }

      if ('additionalProperties' in value) {
        value['additionalProperties'] = false;
        //? value['additionalProperties'] = value['tsAdditionalProperties'];
      }
      if ('enum' in value) {
        value['tsEnumNames'] = (value['enum'] as string[])?.map((el) =>
          /** replaces spaces, hyphens and slashes by underscores then uppercase */
          el.replaceAll(/ |-|\//g, '_').toUpperCase()
        );
      }
    }
    return value;
  });
}

async function compileSchemaFiles(): Promise<void> {
  console.info('Compiling schemas...');
  const libPath = __dirname.replace('internals', 'src/lib');
  const schemasLibPath = join(__dirname, '..', '..', 'schemas', 'src', 'lib');
  await Promise.all(
    jsonSchemaPaths.map(async (jsonSchemaPath) => {
      console.info(`${jsonSchemaPath}.ts - 🎬`);
      const fullPath = join(schemasLibPath, `${jsonSchemaPath}.json`);
      const jsonSchema = await readFile(fullPath, 'utf-8');
      /**
       * @todo figure out if there's a way to patch json-schema-to-typescript to include typia compatible comments|tags based on JSON-schema format keywords
       * @see https://typia.io/docs/validators/tags/
       * */
      const tsInterface = await compile(
        cleanSchema(jsonSchema),
        jsonSchemaPath,
        await options()
      );
      await writeFile(join(libPath, `${jsonSchemaPath}.ts`), tsInterface);
      console.info(`${jsonSchemaPath}.ts - ✔️`);
    })
  );
}

compileSchemaFiles()
  .then(() => {
    console.info('Done compiling JSON schemas to TS interfaces.');
    process.exit();
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
