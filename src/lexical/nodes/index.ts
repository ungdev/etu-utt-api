import type { EditorThemeClasses } from 'lexical';
export { ColorTextNode } from './ColorTextNode';
export { ImageNode } from './ImageNode';
import './NodeStyleInjector';

export type RegisteredStyleMap = {
  [K1 in keyof EditorThemeClasses]: EditorThemeClasses[K1] extends Record<string, any>
    ? { [K2 in keyof EditorThemeClasses[K1]]: keyof typeof CustomStyles }
    : keyof typeof CustomStyles;
};

export const CustomStyles = {
  'editor-image': {
    maxWidth: '100%',
    maxHeight: '100%',
    borderRadius: '3px',
    backgroundColor: 'rgba(68, 76, 95, 0.5)',
  },
  'editor-link': {
    color: '#2d8fce',
    borderBottom: '1px solid #2d8fce',
    textDecoration: 'none',
  },
  'editor-bold': {
    fontWeight: 'bold',
  },
  'editor-italic': {
    fontStyle: 'italic',
  },
  'editor-underline': {
    textDecoration: 'underline',
  },
  'editor-strikethrough': {
    textDecoration: 'line-through',
  },
  'editor-code': {
    backgroundColor: 'rgba(46, 52, 66, 0.1)',
    borderRadius: '3px',
  },
  'editor-quote': {
    backgroundColor: 'rgba(46, 52, 66, 0.1)',
    margin: '0.5em',
    padding: '0.5em',
    borderLeft: '5px solid #2e3442',
    borderRadius: '0 5px 5px 0',
  },
  'editor-horizontal-rule': {
    border: 'none',
    borderTop: '2px solid #2e3442',
    margin: '1em 0',
  },
  'editor-checklist': {}, // TODO: implement these styles without after or before pseudo-elements
  'editor-list-item': {
    position: 'relative',
  },
  'editor-list-item-nested': {
    listStyleType: 'none',
  },
  'editor-list-item-checked': {}, // TODO: implement these styles without after or before pseudo-elements
  'editor-list-item-unchecked': {}, // TODO: implement these styles without after or before pseudo-elements
  'editor-ordered-list': {},
  'editor-unordered-list': {},
  'editor-table': {
    borderCollapse: 'collapse',
  },
  'editor-table-cell': {
    padding: '3px 4px',
    minWidth: '200px',
    border: '1px solid rgba(68, 76, 95, 0.3)',
  },
  'editor-table-cell-header': {
    backgroundColor: '#2e3442',
    color: '#fafbfc',
    border: '1px solid #2e3442',
  },
  'editor-table-row': {
    backgroundColor: 'rgba(68, 76, 95, 0.1)',
  },
} satisfies Record<string, Partial<CSSStyleDeclaration>>;
