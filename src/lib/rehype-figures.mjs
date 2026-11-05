// Turns a paragraph holding only an image into a figure whose image links to its full-size file,
// which the post page opens in a zoom view. The post's own text is left as written.
export default function rehypeFigures() {
  return (tree) => visit(tree);
}

function visit(node) {
  if (!node.children) return;
  node.children = node.children.map((child) => {
    const img = loneImage(child);
    if (!img) {
      visit(child);
      return child;
    }
    img.properties.loading = 'lazy';
    img.properties.decoding = 'async';
    return element('figure', {}, [element('a', { href: img.properties.src, className: ['zoomable'] }, [img])]);
  });
}

function loneImage(node) {
  if (node.type !== 'element' || node.tagName !== 'p') return null;
  const kids = node.children.filter((kid) => !(kid.type === 'text' && !kid.value.trim()));
  return kids.length === 1 && kids[0].tagName === 'img' ? kids[0] : null;
}

const element = (tagName, properties, children) => ({ type: 'element', tagName, properties, children });
