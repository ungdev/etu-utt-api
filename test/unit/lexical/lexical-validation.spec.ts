import { unitSuite } from '../../utils/test_utils';
import { BUNDLES, LexicalModule } from '../../../src/lexical/lexical.module';
import { createHeadlessEditor } from '@lexical/headless';
import { $createParagraphNode, $createTextNode, $getRoot, LexicalEditor } from 'lexical';
import { $createCodeHighlightNode, $createCodeNode } from '@lexical/code';
import { $createHeadingNode, $createQuoteNode } from '@lexical/rich-text';
import { $createImageNode } from '../../../src/lexical/nodes/ImageNode';
import { $createColorTextNode } from '../../../src/lexical/nodes/ColorTextNode';
import { $createAutoLinkNode, $createLinkNode } from '@lexical/link';
import { $createHorizontalRuleNode } from '@lexical/extension';
import { $createListItemNode, $createListNode } from '@lexical/list';
import { $createTableCellNode, $createTableNode, $createTableRowNode } from '@lexical/table';

const LexicalValidationUnitSpec = unitSuite('Lexical validation', (app) => {
  let lexicalModule: LexicalModule;

  beforeAll(() => {
    lexicalModule = app().get(LexicalModule);
  });

  const checkValidityForBundles = (
    name: string,
    bundles: Partial<Record<keyof typeof BUNDLES, boolean>>,
    test: (editor: LexicalEditor) => void,
  ) => {
    Object.entries(bundles).forEach(([bundle, shouldBeValid]) => {
      describe(name, () => {
        it(bundle, () => {
          const editor = createHeadlessEditor({
            nodes: BUNDLES['@etuutt/full'],
          });
          editor.update(() => {
            test(editor);
          });
          editor.read(() =>
            expect(lexicalModule.isValidLexicalContent(JSON.stringify(editor.getEditorState()), bundle)).toBe(
              shouldBeValid,
            ),
          );
        });
      });
    });
  };

  checkValidityForBundles(
    'Paragraph',
    {
      '@etuutt/full': true,
      // '@etuutt/simple': true,
    },
    () => $getRoot().append($createParagraphNode().append($createTextNode('Hello World'))),
  );

  checkValidityForBundles(
    'Paragraph with color',
    {
      '@etuutt/full': true,
      '@etuutt/simple': false,
    },
    () => $getRoot().append($createParagraphNode().append($createColorTextNode('Hello World').setColor('blue'))),
  );

  checkValidityForBundles(
    'Paragraph with link',
    {
      '@etuutt/full': true,
      '@etuutt/simple': false,
    },
    () =>
      $getRoot().append(
        $createParagraphNode().append($createTextNode('Hello '), $createLinkNode('World').setURL('https://etu.utt.fr')),
      ),
  );

  checkValidityForBundles(
    'Paragraph with autolink',
    {
      '@etuutt/full': true,
      '@etuutt/simple': false,
    },
    () =>
      $getRoot().append(
        $createParagraphNode().append(
          $createTextNode('Hello '),
          $createAutoLinkNode('World').setURL('https://etu.utt.fr'),
        ),
      ),
  );

  checkValidityForBundles(
    'Heading',
    {
      '@etuutt/full': true,
      '@etuutt/simple': false,
    },
    () => $getRoot().append($createHeadingNode().append($createTextNode('Hello heading'))),
  );

  checkValidityForBundles(
    'Quote',
    {
      '@etuutt/full': true,
      '@etuutt/simple': false,
    },
    () => $getRoot().append($createQuoteNode().append($createTextNode('Hello quote'))),
  );

  checkValidityForBundles(
    'Code',
    {
      '@etuutt/full': true,
      '@etuutt/simple': false,
    },
    () => $getRoot().append($createCodeNode().append($createTextNode('Hello '), $createCodeHighlightNode('highlight'))),
  );

  checkValidityForBundles(
    'Image',
    {
      '@etuutt/full': true,
      '@etuutt/simple': false,
    },
    () => $getRoot().append($createParagraphNode().append($createImageNode('https://etu.utt.fr/test.webp'))),
  );

  checkValidityForBundles(
    'Horizontal rule',
    {
      '@etuutt/full': true,
      '@etuutt/simple': false,
    },
    () => $getRoot().append($createHorizontalRuleNode()),
  );

  checkValidityForBundles(
    'List',
    {
      '@etuutt/full': true,
      '@etuutt/simple': false,
    },
    () => $getRoot().append($createListNode().append($createListItemNode().append($createTextNode('Item')))),
  );

  checkValidityForBundles(
    'Table',
    {
      '@etuutt/full': true,
      '@etuutt/simple': false,
    },
    () =>
      $getRoot().append(
        $createTableNode().append($createTableRowNode().append($createTableCellNode().append($createTextNode('Cell')))),
      ),
  );
});

export default LexicalValidationUnitSpec;
