import { TableCellNode } from '@lexical/table';
import { DOMExportOutput, LexicalNode } from 'lexical';
import { CustomStyles } from '.';

/** Applies style to a specific Node */
function applyStylesToElement(element: HTMLElement, index: number, node?: LexicalNode) {
  element.classList.forEach((cName) => {
    if (!(cName in CustomStyles)) return;
    if (cName === 'editor-list-item-checked' || cName === 'editor-list-item-unchecked') {
      Object.assign(element.style, CustomStyles['editor-list-item-check-base']);
      const prependedElement = document.createElement('div');
      Object.assign(prependedElement.style, CustomStyles[cName]);
      if (cName === 'editor-list-item-checked') {
        const iconElement = document.createElement('div');
        Object.assign(iconElement.style, CustomStyles['editor-list-item-checked-icon']);
        prependedElement.prepend(iconElement);
      }
      element.prepend(prependedElement);
    } else if (cName !== 'editor-table-row' || !(index % 2))
      Object.assign(cName === 'editor-image' ? element.querySelector('img').style : element.style, CustomStyles[cName]);
    if (cName === 'editor-table-cell-header' && node instanceof TableCellNode)
      element.style.textAlign = node.__verticalAlign;
  });
  if (!element.className.includes('editor-ordered-list') && !element.className.includes('editor-unordered-list'))
    element.className = '';
}

/**
 * Patches the exportDOM method of a Lexical Node to inject inline styles based on class names.
 */
export function patchNodeExportDOM(
  NodeClass: new (...args: unknown[]) => LexicalNode,
) {
  const originalExportDOM: LexicalNode["exportDOM"] = NodeClass.prototype.exportDOM;
  NodeClass.prototype.exportDOM = function (this: LexicalNode, ...args: unknown[]) {
    const result: DOMExportOutput = originalExportDOM.apply(this, args);
    if (!result.element) return result;
    const element = result.element as HTMLElement;
    // Apply custom styles to the element
    applyStylesToElement(element, this.getIndexWithinParent(), this);
    // And also to all his descendent (direct and non-direct)
    element
      .querySelectorAll('[class]')
      .forEach((descendent: HTMLElement) =>
        applyStylesToElement(descendent, Array.from(descendent.parentElement.children).indexOf(descendent)),
      );
    return result;
  };
  // Remove warning of having no importDOM method
  const originalImportDOM = NodeClass['importDOM'];
  NodeClass['importDOM'] = () => originalImportDOM?.() ?? null;
}
