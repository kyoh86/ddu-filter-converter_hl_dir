import {
  BaseFilter,
  DduItem,
} from "https://deno.land/x/ddu_vim@v3.6.0/types.ts";
import { SEP_PATTERN } from "https://deno.land/std@0.203.0/path/mod.ts";
import { is } from "https://deno.land/x/unknownutil@v3.9.0/mod.ts";

const HIGHLIGHT_NAME = "ddu_dir";
const ENCODER = new TextEncoder();

type Params = {
  hlGroup: string | string[];
};

function getPath(item: DduItem): string | undefined {
  if (is.ObjectOf({ action: is.ObjectOf({ path: is.String }) })(item)) {
    return item.action.path;
  }
}

export class Filter extends BaseFilter<Params> {
  filter(args: {
    filterParams: Params;
    items: DduItem[];
  }): Promise<DduItem[]> {
    const { filterParams, items } = args;
    return Promise.resolve(items.map((item) => {
      const path = getPath(item);
      if (!path) {
        return item;
      }

      const { word, display = word, highlights = [] } = item;

      // Already highlighted
      const highlightName = `${HIGHLIGHT_NAME}_0`;
      if (highlights.some((item) => item.name === highlightName)) {
        return item;
      }

      // Path parts
      const hlGroup = (typeof filterParams.hlGroup == "string")
        ? [filterParams.hlGroup]
        : filterParams.hlGroup;
      const parts = display.split(SEP_PATTERN);
      parts.pop(); // trim basename

      // Highlights for the path parts of directory
      const dirhls = parts.reduce((pv, term, i) => {
        const width = ENCODER.encode(term).length + 1;
        return {
          col: pv.col + width,
          list: pv.list.concat([{
            name: `${HIGHLIGHT_NAME}_${i}`,
            col: pv.col,
            width,
            hl_group: hlGroup[i % hlGroup.length],
          }]),
        };
      }, { col: 1, list: [] as typeof highlights });
      item.highlights = [
        ...dirhls.list,
        ...highlights,
      ];

      return item;
    }));
  }

  params(): Params {
    return {
      hlGroup: "Directory",
    };
  }
}
