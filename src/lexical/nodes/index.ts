import type { EditorThemeClasses } from 'lexical';
export { ColorTextNode } from './ColorTextNode';
export { ImageNode } from './ImageNode';
import './NodeStyleInjector';

export type RegisteredStyleMap = {
  [K1 in keyof EditorThemeClasses]: EditorThemeClasses[K1] extends Record<string, unknown>
    ? {
        [K2 in keyof EditorThemeClasses[K1]]: EditorThemeClasses[K1][K2] extends Record<string, unknown>
          ? { [K3 in keyof EditorThemeClasses[K1][K2]]: keyof typeof CustomStyles }
          : keyof typeof CustomStyles;
      }
    : keyof typeof CustomStyles;
};

export const CustomStyles = {
  'editor-image': {
    maxWidth: '100%',
    maxHeight: '100%',
    height: 'auto',
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
  'editor-no-margin': {
    margin: '0',
  },
  'editor-h1': {
    textTransform: 'uppercase',
    fontWeight: '900',
    margin: '0',
  },
  'editor-h2': {
    fontWeight: 'bold',
    margin: '0',
  },
  'editor-checklist': {
    marginLeft: '-1.5em',
  },
  'editor-list-item': {
    position: 'relative',
  },
  'editor-list-item-nested': {
    listStyleType: 'none',
  },
  'editor-list-item-check-base': {
    position: 'relative',
    marginLeft: '0.5em',
    marginRight: '0.5em',
    paddingLeft: '1.5em',
    paddingRight: '1.5em',
    outline: 'none',
    display: 'block',
  },
  'editor-list-item-checked': {
    width: '0.9em',
    height: '0.9em',
    top: '50%',
    left: '0',
    display: 'block',
    backgroundSize: 'cover',
    position: 'absolute',
    transform: 'translateY(-50%)',
    border: '1px solid #2d8fce',
    borderRadius: '2px',
    backgroundColor: '#2d8fce',
    backgroundRepeat: 'no-repeat',
  },
  'editor-list-item-checked-icon': {
    borderColor: '#fafbfc',
    borderStyle: 'solid',
    position: 'absolute',
    display: 'block',
    top: '45%',
    width: '0.2em',
    left: '0.32em',
    height: '0.4em',
    transform: 'translateY(-50%) rotate(45deg)',
    borderWidth: '0 0.1em 0.1em 0',
  },
  'editor-list-item-unchecked': {
    width: '0.9em',
    height: '0.9em',
    top: '50%',
    left: '0',
    display: 'block',
    backgroundSize: 'cover',
    position: 'absolute',
    transform: 'translateY(-50%)',
    border: '1px solid rgba(68, 76, 95, 0.5)',
    borderRadius: '2px',
  },
  'editor-ordered-list': {
    paddingTop: '0',
  },
  'editor-unordered-list': {
    paddingTop: '0',
  },
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
