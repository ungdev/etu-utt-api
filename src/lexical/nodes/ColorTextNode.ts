import {
  $create,
  $getState,
  $getStateChange,
  $setState,
  BaseStaticNodeConfig,
  EditorConfig,
  TextNode,
  createState,
} from 'lexical';

export enum Color {
  blue = '#2d8fce',
  darkblue = '#1b557a',
  grey = '#444c5f',
  darkgrey = '#2e3442'
}
type SerializedColor = keyof typeof Color;

const colorState = createState('color', {
  parse: (v) => typeof v === 'string' && v in Color ? v as SerializedColor : undefined,
});

export class ColorTextNode extends TextNode {
  $config(): BaseStaticNodeConfig {
    return this.config('color-text', {
      extends: TextNode,
      stateConfigs: [{ flat: true, stateConfig: colorState }],
    });
  }

  setColor(color?: SerializedColor) {
    $setState(this, colorState, color);
    return this;
  }

  createDOM(config: EditorConfig): HTMLElement {
    const element = super.createDOM(config);
    element.style.color = Color[$getState(this, colorState)];
    return element;
  }

  updateDOM(prevNode: this, dom: HTMLElement, config: EditorConfig): boolean {
    if (super.updateDOM(prevNode, dom, config)) {
      return true;
    }
    const colorChange = $getStateChange(this, prevNode, colorState);
    if (colorChange !== null) {
      dom.style.color = Color[colorChange[0]];
    }
    return false;
  }
}

export function $createColorTextNode(text?: string, color?: SerializedColor): ColorTextNode {
  return $create(ColorTextNode).setTextContent(text).setColor(color);
}
