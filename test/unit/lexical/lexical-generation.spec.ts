import { unitSuite } from '#/utils/test_utils';
import { BUNDLES, LexicalModule } from '@/lexical/lexical.module';
import { createHeadlessEditor } from '@lexical/headless';
import { $createParagraphNode, $createTextNode, $getRoot, LexicalEditor } from 'lexical';

const LexicalGenerationUnitSpec = unitSuite('Lexical generation', (app) => {
  let lexicalModule: LexicalModule;

  beforeAll(() => {
    lexicalModule = app().get(LexicalModule);
  });

  const checkExportForBundles = (
    name: string,
    bundles: (keyof typeof BUNDLES)[],
    test: (editor: LexicalEditor) => void,
    result: string,
  ) => {
    bundles.forEach((bundle) => {
      // These steps are skipped as jest does not support yet pure-esm sub-dependencies
      describe.skip(name, () => {
        it(bundle, () => {
          const editor = createHeadlessEditor({
            nodes: BUNDLES['@etuutt/full'],
          });
          editor.update(() => {
            test(editor);
          });
          editor.read(async () =>
            expect(await lexicalModule.generateHTML(JSON.stringify(editor.getEditorState()), bundle)).toBe(result),
          );
        });
      });
    });
  };

  checkExportForBundles(
    'Paragraph',
    ['@etuutt/full', '@etuutt/simple'],
    () => $getRoot().append($createParagraphNode().append($createTextNode('Hello World'))),
    '<p style="margin:0px;"><span style="white-space:pre-wrap;">Hello World</span></p>',
  );

  checkExportForBundles(
    'Bold text',
    ['@etuutt/full', '@etuutt/simple'],
    () =>
      $getRoot().append(
        $createParagraphNode().append($createTextNode('Hello '), $createTextNode('World').setFormat('bold')),
      ),
    '<p style="margin:0px;"><span style="white-space:pre-wrap;">Hello <b><strong style="white-space:pre-wrap;font-weight:bold;">World</strong></b></span></p>',
  );
});

export default LexicalGenerationUnitSpec;
