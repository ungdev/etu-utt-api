import { LexicalNode } from 'lexical';
import { CustomStyles } from '.';

function applyStylesToElement(element: HTMLElement, index: number) {
  element.classList.forEach(
    (cName) =>
      cName in CustomStyles &&
      (cName !== 'editor-table-row' || !(index % 2)) &&
      (cName !== 'editor-list-item-nested' || element.querySelector('.editor-ordered-list,.editor-unordered-list')) &&
      Object.assign(cName === 'editor-image' ? element.querySelector('img').style : element.style, CustomStyles[cName]),
  );
  if (!element.className.includes('editor-ordered-list') && !element.className.includes('editor-unordered-list'))
    element.className = '';
}

export function patchNodeExportDOM<T extends LexicalNode[]>(
  NodeClass: new (...args: unknown[]) => T extends (infer U)[] ? U : never,
) {
  const original = NodeClass.prototype.exportDOM;

  NodeClass.prototype.exportDOM = function (this: LexicalNode, ...args: unknown[]) {
    const result = original.apply(this, args);

    if (result?.element) {
      const element = result.element as HTMLElement;
      applyStylesToElement(element, this.getIndexWithinParent());
      element
        .querySelectorAll('[class]')
        .forEach((element: HTMLElement) =>
          applyStylesToElement(element, Array.prototype.indexOf.call(element.parentElement.children, element)),
        );
    }

    return result;
  };
}
