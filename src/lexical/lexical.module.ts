import { Module } from '@nestjs/common';
import { ParagraphNode, TextNode } from 'lexical';
import { createHeadlessEditor } from '@lexical/headless';
import { $generateHtmlFromNodes } from '@lexical/html';
import { AutoLinkNode, LinkNode } from '@lexical/link';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { CodeHighlightNode, CodeNode } from '@lexical/code';
import { TableCellNode, TableNode, TableRowNode } from '@lexical/table';
import { ListItemNode, ListNode } from '@lexical/list';
import { HorizontalRuleNode } from '@lexical/extension';
import { ColorTextNode, ImageNode, RegisteredStyleMap } from '@/lexical/nodes';
import { patchNodeExportDOM } from '@/lexical/nodes/NodeStyleInjector';

/** @internal */
export const BUNDLES = {
  '@etuutt/simple': [],
  '@etuutt/full': [
    AutoLinkNode,
    CodeHighlightNode,
    CodeNode,
    ColorTextNode,
    HeadingNode,
    HorizontalRuleNode,
    ImageNode,
    LinkNode,
    ListItemNode,
    ListNode,
    TableCellNode,
    TableNode,
    TableRowNode,
    QuoteNode,
  ],
};

@Module({
  exports: [LexicalModule],
})
export class LexicalModule {
  constructor() {
    [TextNode, ParagraphNode, ...BUNDLES['@etuutt/full']].forEach(patchNodeExportDOM);
  }

  /**
   * Validates the user-provided string as valid Lexical content. Checks both structure and content.
   *
   * Checks that the content only contains nodes from the provided bundle (you can define custom bundles in {@link BUNDLES}).
   * This check is performed by parsing the content and re-serializing it, then comparing the result to the original input.
   * This forbids the use of unknown nodes as well as unknown properties. However, the client implementation is supposed to
   * serialize nodes the same way as the API does so that properties are in the same order.
   *
   * @param userInput the string provided by the user
   * @param bundle the bundle of allowed nodes (default: full bundle)
   * @returns true if the content is valid, false otherwise
   */
  isValidLexicalContent(userInput: string, bundle: keyof typeof BUNDLES = '@etuutt/full') {
    try {
      const editor = createHeadlessEditor({
        nodes: BUNDLES[bundle],
        onError: () => {},
      });
      const parsed = JSON.parse(userInput);
      const editorState = editor.parseEditorState(parsed);
      return JSON.stringify(editorState.toJSON()) === userInput;
    } catch {
      return false;
    }
  }

  /**
   * Generates HTML from lexical content. Nodes not included in the bundle are ignored. The output is sanitized (by happy-dom) and
   * contains inline-styles instead of classes, for email use. Inline style is defined in the {@link CustomStyles} (./nodes/index.ts).
   *
   * This function can not be used in a jest context as it relies on happy-dom to provide a DOM implementation.
   *
   * @param lexicalContent the lexical content to convert
   * @param bundle the bundle of allowed nodes (default: full bundle)
   * @returns the generated HTML
   */
  async generateHTML(lexicalContent: string, bundle: keyof typeof BUNDLES = '@etuutt/full'): Promise<string> {
    let html = '';
    const { withDOM } = (await new Function(
      "return import('@lexical/headless/dom')",
    )()) as typeof import('@lexical/headless/dom');
    withDOM(() => {
      const editor = createHeadlessEditor({
        nodes: BUNDLES[bundle],
        theme: {
          image: 'editor-image',
          link: 'editor-link',
          text: {
            bold: 'editor-bold',
            italic: 'editor-italic',
            underline: 'editor-underline',
            strikethrough: 'editor-strikethrough',
            code: 'editor-code',
          },
          paragraph: 'editor-no-margin',
          heading: {
            h1: 'editor-h1',
            h2: 'editor-h2',
            h3: 'editor-no-margin',
            h4: 'editor-no-margin',
            h5: 'editor-no-margin',
            h6: 'editor-no-margin',
          },
          quote: 'editor-quote',
          hr: 'editor-horizontal-rule',
          list: {
            checklist: 'editor-checklist',
            listitem: 'editor-list-item',
            listitemChecked: 'editor-list-item-checked',
            listitemUnchecked: 'editor-list-item-unchecked',
            ol: 'editor-ordered-list',
            ul: 'editor-unordered-list',
            nested: {
              listitem: 'editor-list-item-nested',
            },
          },
          table: 'editor-table',
          tableCell: 'editor-table-cell',
          tableCellHeader: 'editor-table-cell-header',
          tableRow: 'editor-table-row',
        } satisfies RegisteredStyleMap,
      });
      const parsed = JSON.parse(lexicalContent);
      editor.setEditorState(editor.parseEditorState(parsed));
      editor.read(() => (html = $generateHtmlFromNodes(editor)));
    });
    // Generated html contains multiple things that we want to minify:
    return html
      // class=""
      .replaceAll('class=""', '')
      // style="key1: value1; key2: value2" => style="key1:value1;key2:value2"
      .replaceAll(/(?<=style="[^"]+[:;])\s/g, '')
      // <p  style="key:value"> => <p style="key:value">
      .replaceAll(/(?<=<\w+\s)\s/g, '')
      // <p style="key:value" > => <p style="key:value">
      .replaceAll(/\s(?=>)/g, '')
  }
}
