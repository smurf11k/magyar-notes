import { visit } from "unist-util-visit";
import type { Root, Paragraph, Text } from "mdast";

export function remarkRevealTranslation() {
  return (tree: Root) => {
    visit(tree, "paragraph", (node: Paragraph) => {
      let modified = false;

      const newChildren: any[] = [];

      for (let i = 0; i < node.children.length; i++) {
        const child = node.children[i];

        if (child.type === "text") {
          const text = (child as Text).value;
          const regex = /\/\/(.+?)\/\//g;
          let lastIndex = 0;
          let match;

          while ((match = regex.exec(text)) !== null) {
            modified = true;

            // Add text before the match
            if (match.index > lastIndex) {
              newChildren.push({
                type: "text",
                value: text.slice(lastIndex, match.index),
              });
            }

            // Add the translation as HTML with special class
            newChildren.push({
              type: "html",
              value: `<span class="translation">${match[1]}</span>`,
            });

            lastIndex = regex.lastIndex;
          }

          // Add remaining text
          if (lastIndex < text.length) {
            newChildren.push({
              type: "text",
              value: text.slice(lastIndex),
            });
          }
        } else {
          newChildren.push(child);
        }
      }

      if (modified) {
        node.children = newChildren;
      }
    });
  };
}
