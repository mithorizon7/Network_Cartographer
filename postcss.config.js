import tailwindcss from "tailwindcss";
import autoprefixer from "autoprefixer";

const ensurePostcssFrom = () => ({
  postcssPlugin: "ensure-postcss-from",
  Once(root) {
    const fallback = root.source?.input?.file || "inline.css";
    const rootInput = root.source?.input || { file: fallback };
    if (!rootInput.file) {
      rootInput.file = fallback;
    }
    if (root.source && !root.source.input) {
      root.source.input = rootInput;
    }
    root.walk((node) => {
      if (!node.source) {
        node.source = { input: rootInput };
      } else if (!node.source.input) {
        node.source.input = rootInput;
      }
      if (!node.source.input.file) {
        node.source.input.file = fallback;
      }
    });
  },
});

export default {
  plugins: [tailwindcss(), autoprefixer(), ensurePostcssFrom()],
};
