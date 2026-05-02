import {
  $create,
  $getState, $getStateChange,
  $setState, BaseStaticNodeConfig,
  createState,
  DecoratorNode,
  EditorConfig,
} from 'lexical';

const srcState = createState('src', {
  parse: (value) => (typeof value === 'string' ? value : undefined),
});

const altTextState = createState('altText', {
  parse: (value) => (typeof value === 'string' ? value : undefined),
});

const widthState = createState('width', {
  parse: (value) => (value === 'inherit' || typeof value === 'number' ? value : 'inherit'),
})

const heightState = createState('height', {
  parse: (value) => (value === 'inherit' || typeof value === 'number' ? value : 'inherit'),
})

export class ImageNode extends DecoratorNode<HTMLElement> {
  $config(): BaseStaticNodeConfig {
    return this.config('image', {
      extends: DecoratorNode,
      stateConfigs: [
        { flat: true, stateConfig: srcState },
        { flat: true, stateConfig: altTextState },
        { flat: true, stateConfig: widthState },
        { flat: true, stateConfig: heightState },
      ],
    });
  }

  setSrc(src?: string) {
    $setState(this, srcState, src);
    return this;
  }

  setAltText(altText: string) {
    $setState(this, altTextState, altText);
    return this;
  }

  setWidth(width: number | 'inherit') {
    $setState(this, widthState, width);
    return this;
  }

  setHeight(height: number | 'inherit') {
    $setState(this, heightState, height);
    return this;
  }

  createDOM(): HTMLElement {
    const img = document.createElement('img');
    img.src = $getState(this, srcState);
    img.alt = $getState(this, altTextState);
    const width = $getState(this, widthState);
    const height = $getState(this, heightState);
    if (width !== 'inherit') img.width = width;
    if (height !== 'inherit') img.height = height;

    const element = document.createElement('span');
    element.appendChild(img);
    return element;
  }

  updateDOM(prevNode: this, dom: HTMLElement, config: EditorConfig): boolean {
    const image = dom.children[0] as HTMLImageElement;
    if (super.updateDOM(prevNode, dom, config)) {
      return true;
    }
    const srcChange = $getStateChange(this, prevNode, srcState);
    if (srcChange !== null) {
      image.src = srcChange[0];
    }
    const altTextChange = $getStateChange(this, prevNode, altTextState);
    if (altTextChange !== null) {
      image.alt = altTextChange[0];
    }
    const widthChange = $getStateChange(this, prevNode, widthState);
    if (widthChange !== null) {
      image.width = widthChange[0] === 'inherit' ? undefined : widthChange[0];
    }
    const heightChange = $getStateChange(this, prevNode, heightState);
    if (heightChange !== null) {
      image.height = heightChange[0] === 'inherit' ? undefined : heightChange[0];
    }
    return false;
  }
}

export function $createImageNode(
  src: string,
  altText?: string,
  width?: number | 'inherit',
  height?: number | 'inherit',
): ImageNode {
  return $create(ImageNode).setSrc(src).setAltText(altText).setWidth(width).setHeight(height);
}
