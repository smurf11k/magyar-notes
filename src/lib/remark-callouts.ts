import { visit } from "unist-util-visit";
import type {
  Root,
  Paragraph,
  Parent,
  PhrasingContent,
  BlockContent,
  DefinitionContent,
} from "mdast";
import type { MdxJsxFlowElement, MdxJsxAttribute } from "mdast-util-mdx-jsx";

type CalloutType = "warning" | "tip" | "note" | "danger" | "info";

interface TextNode {
  type: "text";
  value: string;
}

interface StrongNode {
  type: "strong";
  children: PhrasingContent[];
}

interface NodeReplacement {
  parent: Parent;
  startIndex: number;
  endIndex: number;
  componentNode: MdxJsxFlowElement;
}

/**
 * Remark plugin to transform custom callout syntax into Astro components
 *
 * Syntax:
 * ::warning
 * **Custom Title**: Content here
 * ::
 *
 * Supported types: warning, tip, note, danger, info
 */
export function remarkCallouts() {
  return (tree: Root) => {
    const nodesToReplace: NodeReplacement[] = [];

    visit(tree, "paragraph", (node: Paragraph, index, parent) => {
      if (!node.children || node.children.length === 0) return;
      if (!parent || typeof index !== "number") return;

      const firstChild = node.children[0];
      if (firstChild.type !== "text") return;

      const text = (firstChild as TextNode).value;
      const calloutMatch = text.match(/^::(warning|tip|note|danger|info)$/);

      if (calloutMatch) {
        const type = calloutMatch[1] as CalloutType;
        const startIndex = index;
        let endIndex = -1;
        let titleText: string | null = null;

        // Find the end marker ::
        for (let i = startIndex + 1; i < parent.children.length; i++) {
          const child = parent.children[i];
          if (
            child.type === "paragraph" &&
            "children" in child &&
            child.children &&
            child.children[0]?.type === "text" &&
            (child.children[0] as TextNode).value.trim() === "::"
          ) {
            endIndex = i;
            break;
          }
        }

        if (endIndex === -1) return;

        // Collect content between markers
        const contentNodes = parent.children.slice(
          startIndex + 1,
          endIndex,
        ) as (BlockContent | DefinitionContent)[];

        // Check if first content node has a title (bold text followed by colon)
        if (contentNodes.length > 0 && contentNodes[0].type === "paragraph") {
          const firstContentNode = contentNodes[0] as Paragraph;
          if (
            firstContentNode.children &&
            firstContentNode.children[0]?.type === "strong"
          ) {
            const strongNode = firstContentNode.children[0] as StrongNode;
            if (
              strongNode.children &&
              strongNode.children[0]?.type === "text"
            ) {
              const strongText = (strongNode.children[0] as TextNode).value;

              // Check if there's a colon after the strong text
              if (
                firstContentNode.children[1]?.type === "text" &&
                (firstContentNode.children[1] as TextNode).value.startsWith(":")
              ) {
                titleText = strongText;

                // Remove the title from content
                firstContentNode.children = firstContentNode.children.slice(2);

                // If the paragraph is now empty, remove it
                if (firstContentNode.children.length === 0) {
                  contentNodes.shift();
                }
              }
            }
          }
        }

        // Create attributes array
        const attributes: MdxJsxAttribute[] = [
          {
            type: "mdxJsxAttribute",
            name: "type",
            value: type,
          },
        ];

        // Add title attribute if found
        if (titleText) {
          attributes.push({
            type: "mdxJsxAttribute",
            name: "title",
            value: titleText,
          });
        }

        // Create the component node
        const componentNode: MdxJsxFlowElement = {
          type: "mdxJsxFlowElement",
          name: "Callout",
          attributes,
          children: contentNodes as (typeof contentNodes)[number][],
        };

        nodesToReplace.push({
          parent,
          startIndex,
          endIndex,
          componentNode,
        });
      }
    });

    // Replace nodes (in reverse order to maintain indices)
    for (const {
      parent,
      startIndex,
      endIndex,
      componentNode,
    } of nodesToReplace.reverse()) {
      parent.children.splice(
        startIndex,
        endIndex - startIndex + 1,
        componentNode,
      );
    }
  };
}
