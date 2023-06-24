import {
  BaseFilter,
  DduItem,
} from "https://deno.land/x/ddu_vim@v3.2.6/types.ts";
import { basename, dirname } from "https://deno.land/std@0.192.0/path/mod.ts";
import { is } from "https://deno.land/x/unknownutil@v3.2.0/mod.ts";

const HIGHLIGHT_NAME = "ddu_dir";
const ENCODER = new TextEncoder();

type Params = {
  hlGroup: string;
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
      if (highlights.some((item) => item.name === HIGHLIGHT_NAME)) {
        return item;
      }

      // A path without parent
      const base = basename(display);
      if (base == display) {
        return item;
      }

      const dir = dirname(display);
      const col = 1;
      const width = ENCODER.encode(dir).length + 1;

      item.highlights = [
        {
          name: HIGHLIGHT_NAME,
          col,
          width,
          hl_group: filterParams.hlGroup,
        },
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
