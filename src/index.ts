import { Array, Console, Data, Effect, Option, pipe } from "effect";
import { catchAll, flatMap, map, tap } from "effect/Effect";
import * as NodeFS from "node:fs";

const homedir = require("os").homedir();

const readFile = (filename: string) =>
  Effect.async<{ quotes: Array<Quote> }, { code: string; error: unknown }>(
    (resume) => {
      NodeFS.readFile(filename, { encoding: "utf8" }, (error, data) => {
        if (error) {
          resume(Effect.fail({ code: error.code ?? "File read error", error }));
        } else {
          resume(
            Effect.try({
              try: () => JSON.parse(data),
              catch: (error) => ({ code: "PARSE_ERROR", error }),
            }).pipe(Effect.flatMap((values) => decodeQuote(values))),
          );
        }
      });
    },
  );

const program = readFile(`${homedir}/.config/quotes/quotes.json`).pipe(
  // const program = readFile(
  //   `${homedir}/Developer/desktop/effectquote/src/quotes-error.json`,
  // ).pipe(
  flatMap((value) => {
    return Effect.try({
      try: () => Data.array(value.quotes),
      catch: (error) => ({ code: "PARSE_ERROR", error }),
    });
  }),
  map((quotes) =>
    formatQuote(
      Array.get(getRandomNumberInRange(0, quotes.length - 1))(quotes),
    ),
  ),
  map((quote) => Option.getOrThrow(quote)),
  tap((quote) => Console.log(quote)),
  catchAll((error) => {
    if (error.code === "ENOENT") {
      return Console.log("Error: File not found");
    } else if (error.code === "PARSE_ERROR") {
      return Console.log("Error: JSON not formatted correctly");
    } else {
      return Console.log(`Error: ${error?.code}`);
    }
  }),
);

Effect.runPromise(program);

interface Quote {
  author: string;
  text: string;
}

const getRandomNumberInRange = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const formatQuote = (quote: Option.Option<Quote>) =>
  Option.map(quote, (value) => `${value.text}\n- ${value.author}`);

const decodeQuote = (value: {
  quotes: Array<Quote>;
}): Effect.Effect<
  { quotes: Array<Quote> },
  { code: string; error: unknown }
> => {
  const hasQuotesKey = value.hasOwnProperty("quotes");
  const hasSubKeys = value.quotes
    .map(
      (quote) => quote.hasOwnProperty("author") && quote.hasOwnProperty("text"),
    )
    .every((value) => value);
  const hasKeys = hasQuotesKey && hasSubKeys;
  return Effect.flatMap(Effect.succeed(hasKeys), () =>
    hasKeys
      ? Effect.succeed(value)
      : Effect.fail({ code: "PARSE_ERROR", error: "" }),
  );
};
