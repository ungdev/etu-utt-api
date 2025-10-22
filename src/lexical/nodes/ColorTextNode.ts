import {
  $getState,
  $setState,
  createState,
  DOMConversionMap,
  DOMExportOutput,
  LexicalEditor,
  NodeKey,
  SerializedTextNode,
  Spread,
  TextNode,
} from 'lexical';

const ColorOptions = { blue: '#2d8fce', darkblue: '#1b557a', grey: '#444c5f', darkgrey: '#2e3442' };
export type ColorType = keyof typeof ColorOptions;

type SerializedColorTextNode = Spread<{ color?: ColorType }, SerializedTextNode>;

const colorState = createState('color', {
  parse: (v) => ((v as ColorType) in ColorOptions ? (v as ColorType) : undefined),
});

export class ColorTextNode extends TextNode {
  static getType() {
    return 'color-text';
  }

  static clone(node: ColorTextNode) {
    return new ColorTextNode(node.__text, node.__key);
  }

  setColor(color?: ColorType) {
    $setState(this, colorState, color);
    return this;
  }

  static importJSON(serializedNode: SerializedColorTextNode): ColorTextNode {
    return $createColorTextNode(serializedNode.text).updateFromJSON(serializedNode).setColor(serializedNode.color);
  }

  exportJSON(): SerializedColorTextNode {
    return {
      ...super.exportJSON(),
      color: $getState(this, colorState),
      $: undefined,
    };
  }

  exportDOM(editor: LexicalEditor): DOMExportOutput {
    const { element } = super.exportDOM(editor);
    const color = $getState(this, colorState);
    if (color) (element as HTMLElement).style.color = ColorOptions[color];
    return { element };
  }

  static importDOM(): DOMConversionMap {
    return null;
  }
}

export function $createColorTextNode(text?: string, nodeKey?: NodeKey): ColorTextNode {
  return new ColorTextNode(text, nodeKey);
}
