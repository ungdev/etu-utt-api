import { unitSuite } from '#/utils/test_utils';
import { BUNDLES, LexicalModule } from '@/lexical/lexical.module';
import { createHeadlessEditor } from '@lexical/headless';
import { $createParagraphNode, $createTextNode, $getRoot, LexicalEditor } from 'lexical';
import { $createImageNode } from '@/lexical/nodes/ImageNode';
import { $createColorTextNode, Color } from '@/lexical/nodes/ColorTextNode';

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
      describe(name, () => {
        it(bundle, async () => {
          const editor = createHeadlessEditor({
            nodes: BUNDLES['@etuutt/full'],
          });
          editor.update(() => {
            test(editor);
          });
          await editor.read(async () =>
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
    '<p style="margin:0px;"><span style="white-space:pre-wrap;">Hello </span><b><strong style="white-space:pre-wrap;font-weight:bold;">World</strong></b></p>',
  );

  checkExportForBundles(
    'Image',
    ['@etuutt/full'],
    () => $getRoot().append($createParagraphNode().append($createImageNode('https://etu.utt.fr/test.webp', 'An image', 69, 42))),
    '<p style="margin:0px;"><span><img src="https://etu.utt.fr/test.webp" alt="An image" width="69" height="42"></span></p>'
  )

  checkExportForBundles(
    'Color text',
    ['@etuutt/full'],
    () => $getRoot().append($createParagraphNode().append($createColorTextNode('Hello World', 'blue'))),
    `<p style="margin:0px;"><span style="color:${Color.blue};white-space:pre-wrap;">Hello World</span></p>`
  )
});

export default LexicalGenerationUnitSpec;
