import {
  DecoratorNode,
  DOMConversionMap,
  DOMExportOutput,
  LexicalEditor,
  NodeKey,
  SerializedLexicalNode,
  Spread,
} from 'lexical';

type SerializedImageNode = Spread<
  {
    src: string;
    altText: string;
    width: number | 'inherit';
    height: number | 'inherit';
  },
  SerializedLexicalNode
>;

export class ImageNode extends DecoratorNode<HTMLElement> {
  __src: string;
  __altText: string;
  __width: number | 'inherit';
  __height: number | 'inherit';

  static getType() {
    return 'image';
  }

  static clone(node: ImageNode) {
    return new ImageNode(node.__src, node.__altText, node.__width, node.__height, node.__key);
  }

  constructor(src: string, altText?: string, width?: number | 'inherit', height?: number | 'inherit', key?: NodeKey) {
    super(key);
    this.__src = src;
    this.__altText = altText || '';
    this.__width = width || 'inherit';
    this.__height = height || 'inherit';
  }

  exportDOM(editor: LexicalEditor): DOMExportOutput {
    const element = document.createElement('span');
    if (editor._config?.theme?.image) element.className = editor._config.theme.image;
    const img = document.createElement('img');
    img.src = this.__src;
    img.alt = this.__altText;
    if (this.__width !== 'inherit') img.width = this.__width;
    if (this.__height !== 'inherit') img.height = this.__height;
    element.appendChild(img);
    return { element };
  }

  static importJSON(serializedNode: SerializedImageNode): ImageNode {
    return $createImageNode(
      serializedNode.src,
      serializedNode.altText,
      serializedNode.width,
      serializedNode.height,
    ).updateFromJSON(serializedNode);
  }

  exportJSON(): SerializedImageNode {
    return {
      ...super.exportJSON(),
      src: this.__src,
      altText: this.__altText,
      width: this.__width,
      height: this.__height,
    };
  }

  static importDOM(): DOMConversionMap {
    return null;
  }
}

export function $createImageNode(
  src: string,
  altText?: string,
  width?: number | 'inherit',
  height?: number | 'inherit',
  nodeKey?: NodeKey,
): ImageNode {
  return new ImageNode(src, altText, width, height, nodeKey);
}
