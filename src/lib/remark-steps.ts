import { visit } from "unist-util-visit";
import type {
  Root,
  Paragraph,
  Parent,
  BlockContent,
  DefinitionContent,
} from "mdast";

interface TextNode {
  type: "text";
  value: string;
}

interface MdxJsxAttribute {
  type: "mdxJsxAttribute";
  name: string;
  value?: string | null;
}

interface MdxJsxFlowElement {
  type: "mdxJsxFlowElement";
  name: string;
  attributes: MdxJsxAttribute[];
  children: (BlockContent | DefinitionContent)[];
}

interface NodeReplacement {
  parent: Parent;
  startIndex: number;
  endIndex: number;
  componentNode: MdxJsxFlowElement;
}

export function remarkSteps() {
  return (tree: Root) => {
    const nodesToReplace: NodeReplacement[] = [];

    visit(tree, "paragraph", (node: Paragraph, index, parent) => {
      if (!node.children || node.children.length === 0) return;
      if (!parent || typeof index !== "number") return;

      const firstChild = node.children[0];
      if (firstChild.type !== "text") return;

      const text = (firstChild as TextNode).value;
      const stepsMatch = text.match(/^::steps$/);

      if (stepsMatch) {
        const startIndex = index;
        let endIndex = -1;

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

        // Create the Steps component
        const componentNode: MdxJsxFlowElement = {
          type: "mdxJsxFlowElement",
          name: "Steps",
          attributes: [],
          children: contentNodes,
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
        componentNode as any,
      );
    }
  };
}
