import { Module } from '@nestjs/common';
import { TextNode, ParagraphNode } from 'lexical';
import { createHeadlessEditor } from '@lexical/headless';
import { $generateHtmlFromNodes } from '@lexical/html';
import { AutoLinkNode, LinkNode } from '@lexical/link';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { CodeHighlightNode, CodeNode } from '@lexical/code';
import { TableNode, TableCellNode, TableRowNode } from '@lexical/table';
import { ListNode, ListItemNode } from '@lexical/list';
import { HorizontalRuleNode } from '@lexical/extension';
import { ColorTextNode, ImageNode, RegisteredStyleMap } from './nodes';
import { patchNodeExportDOM } from './nodes/NodeStyleInjector';

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

  isValidLexicalContent(userInput: string, bundle: keyof typeof BUNDLES = '@etuutt/full') {
    try {
      const editor = createHeadlessEditor({
        nodes: BUNDLES[bundle],
      });
      const parsed = JSON.parse(userInput);
      const editorState = editor.parseEditorState(parsed);
      return JSON.stringify(editorState.toJSON()) === userInput;
    } catch {
      return false;
    }
  }

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
    return html
      .replaceAll('class=""', '')
      .replaceAll(/(?<=<[^>]+)(?<!\w|")\s+(?=[^>]*>)|(?<=<[^>]*(?:\w|"))\s+(?=>)/g, '');
  }
}
