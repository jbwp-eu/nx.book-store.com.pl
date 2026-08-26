import type { Locale } from "./index";

const dictionaries = {
  en: () =>
    import("../../dictionaries/en.json").then((module) => module.default),
  pl: () =>
    import("../../dictionaries/pl.json").then((module) => module.default),
};

export type Dictionary = Awaited<ReturnType<(typeof dictionaries)["en"]>>;

export const getDictionary = async (locale: Locale): Promise<Dictionary> =>
  dictionaries[locale]?.() ?? dictionaries.pl();
