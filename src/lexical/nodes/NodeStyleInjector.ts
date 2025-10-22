import { TableCellNode } from '@lexical/table';
import { LexicalNode } from 'lexical';
import { CustomStyles } from '.';

function applyStylesToElement(element: HTMLElement, index: number, node?: LexicalNode) {
  element.classList.forEach((cName) => {
    if (!(cName in CustomStyles)) return;
    if (cName === 'editor-list-item-checked' || cName === 'editor-list-item-unchecked')
      Object.assign(element.style, CustomStyles['editor-list-item-check-base']);
    else if (cName !== 'editor-table-row' || !(index % 2))
      Object.assign(cName === 'editor-image' ? element.querySelector('img').style : element.style, CustomStyles[cName]);
    if (cName === 'editor-table-cell-header' && node instanceof TableCellNode)
      element.style.textAlign = node.__verticalAlign;
    if (cName === 'editor-list-item-checked' || cName === 'editor-list-item-unchecked') {
      const prependedElement = document.createElement('div');
      Object.assign(prependedElement.style, CustomStyles[cName]);
      if (cName === 'editor-list-item-checked') {
        const iconElement = document.createElement('div');
        Object.assign(iconElement.style, CustomStyles['editor-list-item-checked-icon']);
        prependedElement.prepend(iconElement);
      }
      element.prepend(prependedElement);
    }
  });
  if (!element.className.includes('editor-ordered-list') && !element.className.includes('editor-unordered-list'))
    element.className = '';
}

export function patchNodeExportDOM<T extends LexicalNode[]>(
  NodeClass: new (...args: unknown[]) => T extends (infer U)[] ? U : never,
) {
  const original = NodeClass.prototype.exportDOM;

  NodeClass.prototype.exportDOM = function (this: LexicalNode, ...args: unknown[]) {
    const result = original.apply(this, args);
    const originalAfterFunction = result?.after;
    result.after = (element: HTMLElement | null) => {
      let updatedElement = element;
      if (originalAfterFunction) updatedElement = originalAfterFunction(element);
      applyStylesToElement(updatedElement, this.getIndexWithinParent(), this);
      updatedElement
        .querySelectorAll('[class]')
        .forEach((element: HTMLElement) =>
          applyStylesToElement(element, Array.prototype.indexOf.call(element.parentElement.children, element)),
        );
    };

    return result;
  };
}
